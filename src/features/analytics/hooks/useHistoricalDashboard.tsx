import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';

// Función para formatear la fecha a YYYY-MM-DD sin verse afectada por la zona horaria
const toLocalDateString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Definimos la interfaz para los datos del dashboard
interface DashboardData {
  kpis: {
    current_streak: number;
    longest_streak: number;
    weekly_adherence: number;
    active_days_last_30: number;
    weekly_completed_days : number;
  };
  supplements: Array<{
    ean: string;
    name: string;
    brand: string;
    preferred_time: string;
    takenToday: boolean;
  }>;
  weekly_adherence: Array<{
    log_date: string;
    adherence_percentage: number;
  }>;
  chart_data: Array<{
    date: string;
    overall_score: number;
  }>;
  gamification: {
    total_points: number;
    user_level: number;
    upcoming_achievements: Array<{
      id: string;
      name: string;
      description: string;
      points: number;
      rarity: string;
      progress: number;
      target: number;
    }>;
  };
}

export const useHistoricalDashboard = (date: Date) => {
  const fetchGamificationData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          total_points: 0,
          user_level: 1,
          upcoming_achievements: []
        };
      }

      // Obtener puntos totales del usuario desde profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return {
          total_points: 0,
          user_level: 1,
          upcoming_achievements: []
        };
      }

      const totalPoints = profileData?.total_points || 0;
      
      // Calcular nivel real basado en logros ganados
      const calculateLevelFromAchievements = (points: number) => {
        if (points < 50) return 1;
        if (points < 100) return 2;
        if (points < 200) return 3;
        if (points < 400) return 4;
        if (points < 800) return 5;
        return Math.floor(points / 150) + 1;
      };

      // Obtener puntos reales de logros ganados
      const { data: earnedAchievements, error: earnedAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          achievements (
            points,
            name
          )
        `)
        .eq('user_id', user.id);

      let realTotalPoints = 0;
      let calculatedUserLevel = 1;

      if (earnedAchievementsError) {
        console.error('Error fetching earned achievements:', earnedAchievementsError);
        // Fallback: usar puntos del perfil
        realTotalPoints = totalPoints;
        calculatedUserLevel = calculateLevelFromAchievements(totalPoints);
      } else {
        // Calcular puntos reales basados en logros ganados
        realTotalPoints = earnedAchievements?.reduce((sum, ua) => {
          const points = ua.achievements?.points || 0;
          return sum + points;
        }, 0) || 0;
        
        calculatedUserLevel = calculateLevelFromAchievements(realTotalPoints);
        
        // Actualizar el perfil con los puntos reales si son diferentes
        if (realTotalPoints !== totalPoints) {
          console.log(`🎮 [Gamificación] Actualizando perfil: ${totalPoints} → ${realTotalPoints} puntos, Nivel ${calculatedUserLevel}`);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              total_points: realTotalPoints,
              level: calculatedUserLevel,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('🎮 [Gamificación] Error actualizando perfil:', updateError);
          }
        }
      }

      // Obtener achievements del usuario
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievement_id,
          achievements (
            id,
            name,
            description,
            points,
            rarity
          )
        `)
        .eq('user_id', user.id);

      if (achievementsError) {
        console.error('Error fetching user achievements:', achievementsError);
      }

      // Obtener todos los achievements disponibles para calcular próximos
      const { data: allAchievementsData, error: allAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true });

      if (allAchievementsError) {
        console.error('Error fetching all achievements:', allAchievementsError);
      }

      // Calcular próximos achievements (los que no ha ganado)
      // Usar tanto achievement_id directo como achievements.id para mayor seguridad
      const earnedAchievementIds = new Set();
      if (achievementsData) {
        achievementsData.forEach(ua => {
          if (ua.achievement_id) earnedAchievementIds.add(ua.achievement_id);
          if (ua.achievements?.id) earnedAchievementIds.add(ua.achievements.id);
        });
      }
      
      // Logs de debug removidos para limpieza
      
      // Obtener el progreso real de todos los achievements usando la función RPC existente
      const { data: allAchievementsWithProgress, error: progressError } = await supabase.rpc('get_all_achievements_status', {
        p_user_id: user.id
      });

      if (progressError) {
        console.error('Error fetching achievements with progress:', progressError);
      }

      // Crear un mapa de progreso por achievement ID y también identificar logros completados
      const progressMap = new Map();
      const completedAchievementIds = new Set();
      
      if (allAchievementsWithProgress && Array.isArray(allAchievementsWithProgress)) {
        allAchievementsWithProgress.forEach((ach: any) => {
          progressMap.set(ach.id, {
            progress: ach.current_progress || 0,
            target: ach.target_progress || 1
          });
          
          // Si el progreso es igual al target, el logro está completado
          if (ach.current_progress >= ach.target_progress && ach.target_progress > 0) {
            completedAchievementIds.add(ach.id);
          }
        });
      }
      
      // Combinar logros ganados de user_achievements con logros completados de la RPC
      const allCompletedAchievementIds = new Set([...earnedAchievementIds, ...completedAchievementIds]);

      // Logs de debug removidos para limpieza

      // Calcular logros por tipo
      const achievementsByType = {
        general: { earned: 0, total: 0 },
        streak: { earned: 0, total: 0 },
        consistency: { earned: 0, total: 0 },
        variety: { earned: 0, total: 0 },
        health: { earned: 0, total: 0 },
        exploration: { earned: 0, total: 0 },
        collection: { earned: 0, total: 0 },
        volume: { earned: 0, total: 0 }
      };

      // Contar logros por tipo
      if (allAchievementsData) {
        allAchievementsData.forEach(achievement => {
          const category = achievement.category || 'general';
          if (achievementsByType[category]) {
            achievementsByType[category].total++;
            if (allCompletedAchievementIds.has(achievement.id)) {
              achievementsByType[category].earned++;
            }
          }
        });
      }

      // Calcular próximos achievements con progreso real (excluyendo todos los completados)
      const upcomingAchievements = allAchievementsData
        ?.filter(achievement => !allCompletedAchievementIds.has(achievement.id))
        ?.slice(0, 4) // Solo los primeros 4
        ?.map(achievement => {
          const progressData = progressMap.get(achievement.id) || { progress: 0, target: 1 };
          return {
            id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            points: achievement.points,
            rarity: achievement.rarity,
            progress: progressData.progress,
            target: progressData.target
          };
        }) || [];

      // Logs de debug removidos para limpieza

      // Calcular nivel basado en puntos + logros (híbrido)
      const calculateLevel = (points: number, achievementsCount: number) => {
        // Nivel base por puntos (cada 50 puntos = 1 nivel)
        const baseLevel = Math.max(1, Math.floor(points / 50));
        
        // Bonus por logros (cada 3 logros = 1 nivel bonus)
        const bonusLevel = Math.floor(achievementsCount / 3);
        
        // Nivel final = base + bonus (mínimo 1)
        const finalLevel = Math.max(1, baseLevel + bonusLevel);
        
        // Level calculation log removido para limpieza
        
        return finalLevel;
      };

      const userLevel = calculateLevel(realTotalPoints, allCompletedAchievementIds.size);

      const gamificationData = {
        total_points: realTotalPoints,
        user_level: userLevel,
        upcoming_achievements: upcomingAchievements,
        achievements_by_type: achievementsByType
      };

      // Gamification log removido para limpieza

      return gamificationData;

    } catch (err: any) {
      console.error('Error fetching gamification data:', err);
      return {
        total_points: 0,
        user_level: 1,
        upcoming_achievements: []
      };
    }
  };

  const fetchHistoricalData = async (): Promise<DashboardData | null> => {
    const startTime = performance.now();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const targetDate = new Date(date); // Asegurar que es un objeto Date válido
    
    // Validar que targetDate es un objeto Date válido
    if (isNaN(targetDate.getTime())) {
      console.error('❌ [useHistoricalDashboard] Invalid date provided:', date);
      return null;
    }

    // Para el gráfico de 30D, usar la fecha actual para obtener datos completos
    // Para la vista de 7D, usar la fecha seleccionada
    const currentDate = new Date();
    const isCurrentWeek = Math.abs((targetDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)) <= 7;
    
    // Si estamos viendo la semana actual, usar la fecha actual para obtener datos completos
    const dateToUse = isCurrentWeek ? currentDate : targetDate;

    try {
      // Usar la función optimizada de la base de datos
      const targetDateStr = dateToUse.toISOString().split('T')[0];
      console.log('🗓️ [useHistoricalDashboard] Calling DB function with target_date:', targetDateStr);
      console.log('🗓️ [useHistoricalDashboard] Original date:', targetDate.toISOString().split('T')[0]);
      console.log('🗓️ [useHistoricalDashboard] Using date:', targetDateStr);
      console.log('🗓️ [useHistoricalDashboard] Is current week:', isCurrentWeek);
      
      const { data: dashboardData, error: dashboardError } = await supabase.rpc('get_historical_dashboard_data', {
        p_user_id: user.id,
        p_target_date: targetDateStr
      });

      if (dashboardError) {
        console.error('Error fetching dashboard data:', dashboardError);
        throw dashboardError;
      }

      if (dashboardData) {
        const data = dashboardData as any;
        console.log('🔍 [useHistoricalDashboard] Database function returned data:', {
          kpis: data.kpis,
          chart_data: data.chart_data,
          weekly_adherence: data.weekly_adherence,
          chart_data_length: data.chart_data?.length || 0,
          weekly_adherence_length: data.weekly_adherence?.length || 0
        });
        
        // Log detallado de weekly_adherence
        if (data.weekly_adherence && data.weekly_adherence.length > 0) {
          console.log('📊 [useHistoricalDashboard] Weekly adherence details:', data.weekly_adherence.map((item: any, index: number) => ({
            index,
            log_date: item.log_date,
            adherence_percentage: item.adherence_percentage
          })));
          
          // Analizar por qué hay tantos 0%
          const zeroDays = data.weekly_adherence.filter((item: any) => item.adherence_percentage === 0);
          const nonZeroDays = data.weekly_adherence.filter((item: any) => item.adherence_percentage > 0);
          
          console.log('🔍 [useHistoricalDashboard] Adherence analysis:', {
            total_days: data.weekly_adherence.length,
            zero_days: zeroDays.length,
            non_zero_days: nonZeroDays.length,
            zero_days_dates: zeroDays.map((item: any) => item.log_date),
            non_zero_days_data: nonZeroDays.map((item: any) => ({
              date: item.log_date,
              percentage: item.adherence_percentage
            }))
          });
        } else {
          console.log('⚠️ [useHistoricalDashboard] No weekly_adherence data found');
        }
        
        // Verificar si la función RPC ya incluye gamification
        if (data.gamification) {
          console.log('🎮 [useHistoricalDashboard] RPC function includes gamification data:', data.gamification);
          
          // Verificar si los datos de gamificación están actualizados
          const rpcGamification = data.gamification;
          
          // Si los datos parecen desactualizados (nivel 1 con pocos puntos), recalcular
          if (rpcGamification.user_level === 1 && rpcGamification.total_points < 100) {
            console.log('🎮 [Gamificación] Datos desactualizados detectados, recalculando...');
            const gamificationData = await fetchGamificationData();
            return {
              ...data,
              gamification: gamificationData
            } as unknown as DashboardData;
          } else {
            return dashboardData as unknown as DashboardData;
          }
        } else {
          console.log('🎮 [useHistoricalDashboard] RPC function does not include gamification, fetching manually...');
          // Si no incluye gamification, obtenerlo manualmente
          const gamificationData = await fetchGamificationData();
          return {
            ...data,
            gamification: gamificationData
          } as unknown as DashboardData;
        }
      }

      // Si la función no devuelve datos, usar el método manual como fallback
      
      // Método manual (código existente)
          // Obtener suplementos que se tomaron en la fecha histórica específica
          const stackStartTime = performance.now();
          // Performance log removido para limpieza
          
          // Para fechas históricas, obtenemos los suplementos que se tomaron en esa fecha
          const { data: historicalLogs, error: historicalLogsError } = await supabase
            .from('supplement_logs')
            .select(`
              supplement_ean,
              taken_at,
              products (
                ean,
                product_name,
                brands_tags,
                image_url,
                categories_tags,
                labels_tags,
                calculated_score
              )
            `)
            .eq('user_id', user.id)
            .gte('taken_at', `${targetDate}T00:00:00`)
            .lte('taken_at', `${targetDate}T23:59:59`);

          const stackEndTime = performance.now();
          // Performance log removido para reducir redundancia

          if (historicalLogsError) {
            console.error('Error fetching historical logs:', historicalLogsError);
          }

          // Determinar si es una fecha histórica o futura
          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0);
          const targetDateObj = new Date(targetDate);
          targetDateObj.setHours(0, 0, 0, 0);
          const isHistoricalDate = targetDateObj < currentDate;
          
          let stackData = historicalLogs;
          
          // LÓGICA SIMPLIFICADA Y REALISTA:
          // Para fechas históricas: usar logs reales de esa fecha
          // Para fechas futuras/actuales: usar stack actual
          let finalStackData = [];
          
          if (isHistoricalDate) {
            // FECHA HISTÓRICA: usar solo los suplementos que realmente se tomaron ese día
            if (historicalLogs && historicalLogs.length > 0) {
              finalStackData = historicalLogs;
            } else {
              // Si no hay logs históricos, no mostrar nada (realismo)
              finalStackData = [];
            }
          } else {
            // FECHA FUTURA/ACTUAL: usar el stack actual
            const { data: currentStack, error: currentStackError } = await supabase
              .from('user_supplement_stack')
              .select(`
                supplement_ean,
                preferred_time,
                products (
                  ean,
                  product_name,
                  brands_tags,
                  image_url,
                  categories_tags,
                  labels_tags,
                  calculated_score
                )
              `)
              .eq('user_id', user.id);
            
            if (currentStackError) {
              console.error('Error fetching current stack:', currentStackError);
              finalStackData = [];
            } else {
              // Convertir stack actual a formato compatible
              finalStackData = (currentStack || []).map(item => ({
                ...item,
                taken_at: targetDate + 'T00:00:00'
              }));
            }
          }
          
          stackData = finalStackData;

          // Obtener datos de wellness scores reales
          const wellnessStartTime = performance.now();
          // Performance log removido para limpieza
          
          const { data: wellnessData, error: wellnessError } = await supabase
            .from('wellness_score_history')
            .select('recorded_date, overall_score')
            .eq('user_id', user.id)
            .lte('recorded_date', targetDate)
            .order('recorded_date', { ascending: true });

          const wellnessEndTime = performance.now();
          // Performance log removido para reducir redundancia

          if (wellnessError) {
            console.error('Error fetching wellness data:', wellnessError);
          }

          // Obtener logs de suplementos para calcular adherencia
          // Calcular la semana basada en la fecha seleccionada
          const weekDateObj = new Date(targetDate);
          const weekStart = new Date(weekDateObj);
          weekStart.setDate(weekDateObj.getDate() - weekDateObj.getDay()); // Domingo
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // Sábado

          const logsStartTime = performance.now();
          // Performance log removido para limpieza
          
          const { data: logsData, error: logsError } = await supabase
            .from('supplement_logs')
            .select('taken_at, supplement_ean')
            .eq('user_id', user.id)
            .gte('taken_at', weekStart.toISOString())
            .lte('taken_at', weekEnd.toISOString());

          const logsEndTime = performance.now();
          // Performance log removido para reducir redundancia

          if (logsError) {
            console.error('Error fetching logs data:', logsError);
          }

          // Obtener logs específicos para la fecha seleccionada
          const selectedDateLogsStartTime = performance.now();
          // Performance log removido para limpieza
          
          const { data: selectedDateLogs, error: selectedDateLogsError } = await supabase
            .from('supplement_logs')
            .select('supplement_ean, taken_at')
            .eq('user_id', user.id)
            .gte('taken_at', `${targetDate}T00:00:00`)
            .lte('taken_at', `${targetDate}T23:59:59`);

          const selectedDateLogsEndTime = performance.now();
          // Performance log removido para reducir redundancia

          if (selectedDateLogsError) {
            console.error('Error fetching selected date logs:', selectedDateLogsError);
          }

          // Crear un Set de suplementos tomados en la fecha seleccionada
          const takenSupplements = new Set((selectedDateLogs || []).map(log => log.supplement_ean));

          // Procesar datos reales
          const processingStartTime = performance.now();
          // Performance y debug logs removidos para limpieza
          const realSupplements = (stackData || []).map(item => ({
            ean: item.supplement_ean,
            name: (item.products as any)?.product_name || 'Suplemento',
            brand: (item.products as any)?.brands_tags || 'Marca',
            preferred_time: (item as any).preferred_time || 'morning', // Fallback para logs históricos
            takenToday: takenSupplements.has(item.supplement_ean),
            image_url: (item.products as any)?.image_url,
            brands_tags: (item.products as any)?.brands_tags,
            categories_tags: (item.products as any)?.categories_tags,
            labels_tags: (item.products as any)?.labels_tags,
            calculated_score: (item.products as any)?.calculated_score
          }));

          const realChartData = (wellnessData || []).map(item => ({
            date: item.recorded_date,
            overall_score: item.overall_score
          }));


          // Calcular adherencia semanal real
          const realWeeklyAdherence = [];
          for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            const dateStr = date.toISOString().split('T')[0];
            
            // Combinar todos los logs disponibles
            const allLogs = [...(logsData || []), ...(selectedDateLogs || [])];
            const dayLogs = allLogs.filter(log => 
              log.taken_at.startsWith(dateStr)
            );
            
            // Contar suplementos únicos tomados ese día
            const uniqueSupplementsTaken = new Set(dayLogs.map(log => log.supplement_ean));
            const stackSize = realSupplements.length;
            const adherencePercentage = stackSize > 0 ? 
              Math.round((uniqueSupplementsTaken.size / stackSize) * 100) : 0;
            
            // Debug log removido para reducir redundancia
            
            realWeeklyAdherence.push({
              log_date: dateStr,
              adherence_percentage: adherencePercentage
            });
          }

          const processingEndTime = performance.now();
          // Performance log removido para reducir redundancia

      // Debug log removido para limpieza

      // Calcular adherencia semanal real basada en los datos
      const totalAdherence = realWeeklyAdherence.reduce((sum, day) => sum + day.adherence_percentage, 0);
      const averageWeeklyAdherence = realWeeklyAdherence.length > 0 ? totalAdherence / realWeeklyAdherence.length : 0;

      // Calcular días activos en los últimos 30 días usando los logs ya obtenidos
      const thirtyDaysAgo = new Date(targetDate);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Usar los logs de la semana y extender la consulta si es necesario
      const allLogs = [...(logsData || []), ...(selectedDateLogs || [])];
      
      // Filtrar logs de los últimos 30 días
      const last30DaysLogs = allLogs.filter(log => {
        const logDate = new Date(log.taken_at);
        return logDate >= thirtyDaysAgo && logDate <= new Date(`${targetDate}T23:59:59`);
      });

      // Contar días únicos con actividad
      const uniqueDays = new Set(last30DaysLogs.map(log => 
        log.taken_at.split('T')[0]
      ));
      const activeDaysLast30 = uniqueDays.size;

      // Calcular racha actual (días consecutivos desde hoy hacia atrás)
      let currentStreak = 0;
      const streakDate = new Date(targetDate);
      
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(streakDate);
        checkDate.setDate(streakDate.getDate() - i);
        const checkDateStr = checkDate.toISOString().split('T')[0];
        
        const dayLogs = last30DaysLogs.filter(log => 
          log.taken_at.startsWith(checkDateStr)
        );
        
        if (dayLogs.length > 0) {
          currentStreak++;
        } else {
          break;
        }
      }

      const kpiCalculationEndTime = performance.now();
      // Performance log removido para reducir redundancia

      // Debug log removido para limpieza

      const totalEndTime = performance.now();
      // Performance log removido para reducir redundancia

      return {
        kpis: {
          current_streak: currentStreak,
          longest_streak: Math.max(currentStreak, 5), // Por ahora usar current_streak como longest
          weekly_adherence: Math.round(averageWeeklyAdherence * 10) / 10, // Redondear a 1 decimal
          active_days_last_30: activeDaysLast30,
          weekly_completed_days: realWeeklyAdherence.filter(day => day.adherence_percentage === 100).length
        },
        supplements: realSupplements,
        weekly_adherence: realWeeklyAdherence,
        chart_data: realChartData,
        gamification: await fetchGamificationData()
      };
    } catch (fallbackError) {
      console.error('Error fetching real user data:', fallbackError);
      // Si falla, usar datos mínimos
      return {
        kpis: { current_streak: 0, longest_streak: 0, weekly_adherence: 0, active_days_last_30: 0, weekly_completed_days : 0 },
        supplements: [],
        weekly_adherence: [],
        chart_data: [],
        gamification: { total_points: 0, user_level: 1, upcoming_achievements: [] }
      };
    }
  };

  return useQuery({
    queryKey: ['historicalDashboard', toLocalDateString(date)],
    queryFn: fetchHistoricalData,
    enabled: !!date,
    staleTime: 0, // Los datos nunca se consideran "frescos" para permitir refetch inmediato
    refetchOnWindowFocus: true, // Refetch cuando la ventana recupera el foco
    refetchOnMount: true, // Refetch al montar el componente
    retry: 1, // Solo reintentar una vez en caso de error
  });
};
