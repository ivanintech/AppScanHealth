import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { HeartPulse, Sunrise, Sun, Moon, Flame, Pill, Undo2, CalendarDays, ClipboardList, Check, Clock, Sparkles, Package, Award, Shield, Leaf } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { WeeklyCalendar } from "@/pages/home/WeeklyCalendar";
import ProgressTrends from "@/features/analytics/components/ProgressTrends";
import StreaksAndAchievements from "@/features/analytics/components/StreaksAndAchievements";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { useIsMobile } from "@/shared/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/shared/components/ui/badge";
import CircularProgress from "@/features/analytics/components/CircularProgress";
import { cn, formatProductInfo, getBrandFromTags, getCategoryFromTags, getLabelsFromTags } from "@/shared/lib/utils";
import { useHistoricalDashboard } from "@/features/analytics/hooks/useHistoricalDashboard";
import { useCheckHistoricalData } from "@/shared/hooks/useCheckHistoricalData";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/shared/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { CelebrationEffect } from "@/shared/components/CelebrationEffect";
import { HealthSummaryPanel } from "./HealthSummaryPanel";

// Definimos las interfaces para tipar los datos de los suplementos
interface UserSupplement {
  ean: string;
  name: string;
  brand?: string;
  takenToday: boolean;
  preferred_time: string;
  image_url?: string;
  brands_tags?: string;
  categories_tags?: string;
  labels_tags?: string;
  calculated_score?: number;
}

interface SupplementsByTime {
  morning: UserSupplement[];
  midday: UserSupplement[];
  night: UserSupplement[];
}

export const Home = () => {
  const { selectedDate, setSelectedDate, formatCurrentDate } = useDateNavigation();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: loading, error } = useHistoricalDashboard(selectedDate);
  const { data: historicalDataCheck } = useCheckHistoricalData();

  // Log de rendimiento para cambios de fecha
  useEffect(() => {
    const dateChangeTime = performance.now();
    // Date changed
  }, [selectedDate]);

  // Estado local para suplementos (para optimistic updates)
  const [localUserSupplements, setLocalUserSupplements] = useState<UserSupplement[]>([]);

  // Derivamos TODO el estado a partir de una única fuente de verdad
  const userSupplements = useMemo(() => dashboardData?.supplements || [], [dashboardData?.supplements]);
  const weeklyAdherence = useMemo(() => {
    if (!dashboardData?.weekly_adherence) return [];
    
    // Mapear weekly_adherence al formato esperado por ProgressTrends
    return dashboardData.weekly_adherence.map((item: any) => ({
      date: item.log_date || item.date,
      overall_score: item.adherence_percentage || item.adherence
    }));
  }, [dashboardData?.weekly_adherence]);

  // Datos de adherencia para WeeklyCalendar (formato original)
  const adherenceData = useMemo(() => {
    if (!dashboardData?.weekly_adherence) return [];
    
    const data = dashboardData.weekly_adherence.map((item: any) => ({
      log_date: item.log_date || item.date,
      adherence_percentage: item.adherence_percentage || item.adherence
    }));
    
    console.log('📅 [WeeklyCalendar] Adherence data:', data);
    console.log('📅 [WeeklyCalendar] Raw weekly_adherence from DB:', dashboardData.weekly_adherence);
    return data;
  }, [dashboardData?.weekly_adherence]);
  
  const chartData = useMemo(() => {
    const data = dashboardData?.chart_data || [];
    console.log('📊 [Home] Raw chart_data from DB:', data);
    return data;
  }, [dashboardData?.chart_data]);
  
  // Combinar datos para el gráfico: combinar adherencia y wellness scores
  const combinedChartData = useMemo(() => {
    // Crear un mapa de fechas para evitar duplicados
    const dateMap = new Map();
    
    // Función para normalizar fechas (extraer solo YYYY-MM-DD)
    const normalizeDate = (dateStr: string) => {
      if (!dateStr) return null;
      // Si es formato ISO, extraer solo la parte de fecha
      if (dateStr.includes('T')) {
        return dateStr.split('T')[0];
      }
      return dateStr;
    };
    
    // Agregar datos de wellness scores (chart_data)
    chartData.forEach(item => {
      if (item.date && item.overall_score !== undefined) {
        const normalizedDate = normalizeDate(item.date);
        if (normalizedDate) {
          dateMap.set(normalizedDate, {
            date: normalizedDate,
            overall_score: item.overall_score
          });
        }
      }
    });
    
    // Agregar datos de adherencia (weeklyAdherence) para fechas que no tienen wellness scores
    weeklyAdherence.forEach(item => {
      if (item.date) {
        const normalizedDate = normalizeDate(item.date);
        if (normalizedDate && !dateMap.has(normalizedDate)) {
          dateMap.set(normalizedDate, {
            date: normalizedDate,
            overall_score: item.overall_score
          });
        }
      }
    });
    
    // Convertir mapa a array y ordenar por fecha
    const result = Array.from(dateMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Debug log para verificar la combinación
    console.log('📊 [Home] Combined chart data:', {
      wellnessScores: chartData.length,
      adherenceData: weeklyAdherence.length,
      combined: result.length,
      lastFewDays: result.slice(-5)
    });
    
    return result;
  }, [weeklyAdherence, chartData]);
  const kpis = dashboardData?.kpis;
  const gamificationData = dashboardData?.gamification;

  // Sincronizar estado local con datos del hook
  useEffect(() => {
    if (dashboardData?.supplements) {
      setLocalUserSupplements(dashboardData.supplements);
    }
  }, [dashboardData?.supplements]);

  // Logs esenciales para debugging
  useEffect(() => {
    if (dashboardData) {
      const dashboardLoadTime = performance.now();
      // Dashboard loaded successfully
    }
  }, [dashboardData, userSupplements.length, selectedDate, weeklyAdherence.length, kpis]);

  const [completionState, setCompletionState] = useState<{
    supplementName: string;
    count: number;
  } | null>(null);

  // activeToastId eliminado - ya no se usan toasts de completado/desmarcado


  // Invalidate queries after celebration completes
  useEffect(() => {
    if (!completionState) {
      // Celebration has ended, invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard', selectedDate.toISOString().split('T')[0]] });
    }
  }, [completionState, queryClient, selectedDate]);

  // useEffect(() => {
  //   fetchUserSupplements(selectedDate);
  //   // Invalida la caché al cambiar de fecha para forzar un refetch
  //   queryClient.invalidateQueries({ queryKey: ['weeklyAdherence'] });
  // }, [selectedDate, queryClient]);

  // const fetchUserSupplements = async (date: Date) => {
  //   setLoading(true);
  //   try {
  //     const { data: user } = await supabase.auth.getUser();
  //     if (!user.user) {
  //       setLoading(false);
  //       return;
  //     }

  //     // El final del día para la consulta
  //     const effectiveDate = endOfDay(date);

  //     // Get user's supplement stack with preferred_time
  //     const { data: stackData, error: stackError } = await supabase
  //       .from('user_supplement_stack_2')
  //       .select(`
  //         supplement_ean,
  //         preferred_time,
  //         supplements(name, brand)
  //       `)
  //       .eq('user_id', user.user.id)
  //       .lte('created_at', effectiveDate.toISOString());

  //     if (stackError) throw stackError;

  //     if (!stackData || stackData.length === 0) {
  //       setUserSupplements([]);
  //       setUserStack([]);
  //       setLoading(false);
  //       return;
  //     }

  //     // Store the stack data for time grouping
  //     setUserStack(stackData as UserStackItem[]);

  //     // Check which supplements were taken on the selected date
  //     const dateString = date.toISOString().split('T')[0];
  //     const { data: logs, error: logsError } = await supabase
  //       .from('supplement_logs_2')
  //       .select('supplement_ean')
  //       .eq('user_id', user.user.id)
  //       .gte('taken_at', `${dateString}T00:00:00.000Z`)
  //       .lt('taken_at', `${dateString}T23:59:59.999Z`);

  //     if (logsError) throw logsError;

  //     const takenOnSelectedDay = new Set(logs?.map(log => log.supplement_ean) || []);

  //     const supplements = stackData.map(item => ({
  //       ean: item.supplement_ean,
  //       name: item.supplements?.name || 'Suplemento desconocido',
  //       brand: item.supplements?.brand,
  //       takenToday: takenOnSelectedDay.has(item.supplement_ean)
  //     }));

  //     setUserSupplements(supplements);
  //   } catch (error) {
  //     console.error('Error fetching user supplements:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Helper function para obtener la fecha local sin problemas de timezone
  const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const markAsTaken = async (ean: string, name: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Acceso requerido",
          description: "Debes estar autenticado para registrar suplementos",
          variant: "destructive",
        });
        return;
      }

      // Usar la fecha seleccionada, no la fecha actual
      const selectedDay = getLocalDateString(selectedDate);
      const takenAt = `${selectedDay}T12:00:00.000Z`; // Hora fija para evitar problemas de timezone
      
      // Marking supplement as taken

      // OPTIMISTIC UPDATE - Actualizar UI inmediatamente para mejor UX
      setLocalUserSupplements(prev => prev.map(s => s.ean === ean ? { ...s, takenToday: true } : s));

      // Verificar primero si ya existe un registro para este suplemento en esta fecha
      const { data: existingLogs, error: checkError } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('supplement_ean', ean)
        .gte('taken_at', selectedDay + 'T00:00:00.000Z')
        .lt('taken_at', selectedDay + 'T23:59:59.999Z');

      if (checkError) {
        console.error('❌ [Home] Error verificando logs existentes:', checkError);
        throw checkError;
      }

      if (existingLogs && existingLogs.length > 0) {
        // No insertar duplicados
        return;
      }

      // Add to supplement logs
      const insertData = {
        user_id: user.user.id,
        supplement_ean: ean,
        taken_at: takenAt,
        notes: 'Registrado desde inicio'
      };
      
      // Inserting into database
      
      const { data: insertedData, error } = await supabase
        .from('supplement_logs')
        .insert(insertData)
        .select(); // Añadir select para ver qué se insertó

      if (error) {
        console.error('❌ [Home] Error insertando log:', error);
        console.error('❌ [Home] Detalles del error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }
      
      // Log inserted successfully

      // Show celebration effect (confeti)
      setCompletionState({
        supplementName: name,
        count: Date.now() // Use timestamp as unique count
      });

      // Refresh data - invalidar todas las consultas del dashboard histórico
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard'] });
      queryClient.invalidateQueries({
        queryKey: ['historicalDashboard', selectedDay]
      });

      // Forzar un refetch inmediato para actualizar los KPIs
      queryClient.refetchQueries({ queryKey: ['historicalDashboard'] });

    } catch (error) {
      console.error('❌ [Home] Error marking supplement as taken:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar el suplemento",
        variant: "destructive",
      });
      // Revert optimistic update on error
      setLocalUserSupplements(prev => prev.map(s => s.ean === ean ? { ...s, takenToday: false } : s));
    }
  };

  const unmarkAsTaken = async (ean: string, name: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Acceso requerido",
          description: "Debes estar autenticado para modificar suplementos",
          variant: "destructive",
        });
        return;
      }

      const selectedDay = getLocalDateString(selectedDate);
      // Unmarking supplement

      // OPTIMISTIC UPDATE - Actualizar UI inmediatamente para mejor UX
      setLocalUserSupplements(prev => prev.map(s => s.ean === ean ? { ...s, takenToday: false } : s));

      // Primero, verificar si existen registros para este suplemento en esta fecha
      const { data: existingLogs, error: checkError } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.user.id)
        .eq('supplement_ean', ean)
        .gte('taken_at', selectedDay + 'T00:00:00.000Z')
        .lt('taken_at', selectedDay + 'T23:59:59.999Z');

      if (checkError) {
        console.error('❌ [Home] Error verificando logs existentes:', checkError);
        throw checkError;
      }

      if (existingLogs && existingLogs.length > 0) {
        // Found existing logs

        // Remove from supplement logs for the selected day
        // Executing DELETE with conditions

        const { data: deletedData, error } = await supabase
          .from('supplement_logs')
          .delete()
          .eq('user_id', user.user.id)
          .eq('supplement_ean', ean)
          .gte('taken_at', selectedDay + 'T00:00:00.000Z')
          .lt('taken_at', selectedDay + 'T23:59:59.999Z')
          .select(); // Añadir select para ver qué se eliminó

        if (error) {
          console.error('❌ [Home] Error eliminando log:', error);
          console.error('❌ [Home] Detalles del error de eliminación:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        if (deletedData && deletedData.length > 0) {
          // Logs deleted successfully
        } else {
          // No records deleted - trying direct deletion by ID
          
          // Si no se eliminó nada, intentar eliminación directa por ID de los registros encontrados
          if (existingLogs && existingLogs.length > 0) {
            const idsToDelete = existingLogs.map(log => log.id);
            // Trying direct deletion by IDs
            
            const { data: directDeleteData, error: directDeleteError } = await supabase
              .from('supplement_logs')
              .delete()
              .in('id', idsToDelete)
              .select();
              
            if (directDeleteError) {
              console.error('❌ [Home] Error en eliminación directa:', directDeleteError);
            } else {
              // Direct deletion successful
            }
          }
        }
      }

      // Refresh data - invalidar todas las consultas del dashboard histórico
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard'] });
      queryClient.invalidateQueries({
        queryKey: ['historicalDashboard', selectedDay]
      });

      // Forzar un refetch inmediato para actualizar los KPIs
      queryClient.refetchQueries({ queryKey: ['historicalDashboard'] });

    } catch (error) {
      console.error('❌ [Home] Error unmarking supplement:', error);
      toast({
        title: "Error",
        description: "No se pudo desmarcar el suplemento",
        variant: "destructive",
      });
      // Revert optimistic update on error
      setLocalUserSupplements(prev => prev.map(s => s.ean === ean ? { ...s, takenToday: true } : s));
    }
  };

  const groupSupplementsByTime = (supplements: UserSupplement[]): SupplementsByTime => {
    return supplements.reduce((acc, supplement) => {
      const time = supplement.preferred_time || 'morning';
      acc[time].push(supplement);
      return acc;
    }, { morning: [], midday: [], night: [] } as SupplementsByTime);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.25, 0.1, 0.25, 1] // Using bezier curve instead of string
      }
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDay = new Date(selectedDate);
  selectedDay.setHours(0, 0, 0, 0);
  const isViewingPast = selectedDay < today;

  const groupedSupplements = groupSupplementsByTime(localUserSupplements || []);

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="min-h-screen bg-background pb-20"
    >
      <CelebrationEffect
        completionState={completionState}
        onComplete={() => setCompletionState(null)}
      />

      {/* Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-40"
      >
        <div className="flex items-center gap-2">
          {/* <img src="/logo_2.png" alt="Scan Health Logo" className="w-7.5 h-8 object-contain" /> */}
          <div className="w-7 h-7 flex items-center justify-center rounded-md bg-gradient-primary shadow-button">
            <HeartPulse className="w-5 h-5 text-white" strokeWidth={1.5} />
          </div>
          <h1 className=" text-foreground text-lg">Scan Health</h1>
        </div>

        <div className="flex items-center gap-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-gradient-to-r from-orange-100 to-red-100 rounded-full px-3 py-2 flex items-center gap-2 border border-orange-200"
          >
            <Flame className="w-4 h-4 text-orange-500 animate-bounce-subtle" />
            <span className="text-sm font-bold text-orange-600">{kpis?.current_streak}</span>
          </motion.div>
          <div className="bg-gradient-primary text-white px-3 py-1 rounded-full text-sm font-medium shadow-button">
            PRO
          </div>
        </div>
      </motion.header>

      {/* Progress and Achievements Section */}
      <main className="px-4 mt-6 space-y-6">
        {/* Weekly Calendar */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          <Card>
            <CardContent className="pt-6">
              <WeeklyCalendar
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
                adherenceData={adherenceData}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Supplements Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        >
          <Card className={isMobile ? "w-full p-3" : "w-full"}>
            <CardHeader className="relative">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 pr-20">
                  <ClipboardList className="w-6 h-6 text-primary" />
                  Completar Suplementación
                </CardTitle>
                {localUserSupplements.length > 0 && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.4 }}
                    className="absolute top-4 right-4"
                  >
                    <div className="bg-card/50 backdrop-blur-sm rounded-full p-1 border border-border/20">
                      <CircularProgress
                        value={localUserSupplements.filter(s => s.takenToday).length}
                        max={localUserSupplements.length}
                        size={60}
                        strokeWidth={4}
                        showPercentage={false}
                      >
                        <div className="flex items-center justify-center leading-none">
                          <span className="text-sm font-bold text-foreground">
                            {localUserSupplements.filter(s => s.takenToday).length}/{localUserSupplements.length}
                          </span>
                        </div>
                      </CircularProgress>
                    </div>
                  </motion.div>
                )}
              </div>
              <CardDescription>
                {isViewingPast
                  ? "Así estaba tu progreso este día."
                  : "Marca tus suplementos como tomados para mantener tu progreso."
                }
              </CardDescription>
            </CardHeader>
            <CardContent className={isMobile ? "space-y-4" : ""}>
              {loading ? (
                <div className={isMobile ? "space-y-3" : "space-y-4"}>
                  {[1, 2, 3].map((i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="animate-pulse bg-card rounded-lg p-4 border border-border"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-full"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                          <div className="h-3 bg-muted rounded w-3/4"></div>
                        </div>
                        <div className="h-8 w-20 bg-muted rounded"></div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : localUserSupplements.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="border-dashed border-2 hover:border-primary/30 transition-colors card-interactive rounded-lg p-8 text-center"
                >
                  <div className="space-y-4">
                    <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                      <CalendarDays className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {isViewingPast ? "Sin Suplementos en esta Fecha" : "No tienes suplementos en tu stack"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isViewingPast
                          ? "Tu stack estaba vacío en este día."
                          : 'Agrega suplementos desde la sección "Explore" para empezar.'
                        }
                      </p>
                      {!isViewingPast && (
                        <Button 
                          onClick={() => navigate('/stack')}
                          className="mt-4 bg-primary hover:bg-primary/90 text-white"
                        >
                          <Package className="w-4 h-4 mr-2" />
                          Agregar Suplementos
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="space-y-6">
                  {(() => {
                    return (
                      <>
                        {/* Mañana */}
                        <div className="space-y-3">
                          <h3 className="font-medium text-foreground flex items-center gap-2">
                            <Sunrise className="w-5 h-5 text-orange-400" />
                            Mañana
                          </h3>
                          <div className="space-y-3">
                            {groupedSupplements.morning.map((supplement, index) => (
                              <motion.article
                                key={supplement.ean}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1, duration: 0.3 }}
                                className={cn(
                                  `rounded-lg p-4 border card-interactive overflow-hidden ${isMobile ? 'p-3' : ''}`,
                                  {
                                    'bg-muted/50 border-border': supplement.takenToday,
                                    'bg-card border-border': !supplement.takenToday && !isViewingPast,
                                    'bg-destructive/10 border-destructive/20': !supplement.takenToday && isViewingPast
                                  }
                                )}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3 flex-1">
                                    <motion.div
                                      animate={supplement.takenToday ? { scale: [1, 1.2, 1] } : {}}
                                      transition={{ duration: 0.3 }}
                                      className={`p-2 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${supplement.takenToday
                                        ? `bg-muted`
                                        : 'bg-primary/10 hover:bg-primary/20'
                                        }`}
                                      onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                    >
                                      {supplement.takenToday ? (
                                        <Check className="w-5 h-5 text-muted-foreground" />
                                      ) : (
                                        <Clock className="w-5 h-5 text-primary" />
                                      )}
                                    </motion.div>
                                    {/* {supplement.image_url ? (
                                        <img 
                                          src={supplement.image_url} 
                                          alt={supplement.name}
                                          className="w-14 h-14 rounded-lg object-cover border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        />
                                      ) : (
                                        <div 
                                          className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        >
                                          <Package className="w-7 h-7 text-primary" />
                                        </div>
                                      )} */}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-1">
                                        <h4 className={`font-semibold text-foreground text-sm leading-tight line-clamp-2 transition-all duration-300 ${supplement.takenToday ? 'text-completed line-through' : ''
                                          }`}>
                                          {supplement.name}
                                        </h4>
                                        {supplement.calculated_score && (
                                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                            <Award className={`w-4 h-4 ${formatProductInfo(supplement).scoreColor}`} />
                                            <span className={`text-xs font-medium ${formatProductInfo(supplement).scoreColor}`}>
                                              {supplement.calculated_score}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground font-medium">
                                            {getBrandFromTags(supplement.brands_tags) || supplement.brand}
                                          </span>
                                          {/* {formatProductInfo(supplement).isSupplement && (
                                              <Shield className="w-3 h-3 text-green-600" />
                                            )} */}
                                        </div>
                                        {/* <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                              {getCategoryFromTags(supplement.categories_tags) || 'Suplemento'}
                                            </Badge>
                                            {formatProductInfo(supplement).hasLabels && (
                                              <Leaf className="w-3 h-3 text-green-600" />
                                            )}
                                          </div> */}
                                        {/* {formatProductInfo(supplement).labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {formatProductInfo(supplement).labels.slice(0, 2).map((label, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                                  {label}
                                                </Badge>
                                              ))}
                                            </div>
                                          )} */}
                                      </div>
                                    </div>
                                  </div>

                                  {!isViewingPast && (
                                    <motion.div
                                      initial={{ scale: 1 }}
                                      whileTap={{ scale: 0.95 }}
                                      className="ml-2 flex-shrink-0"
                                    >
                                      <Button
                                        onClick={() =>
                                          supplement.takenToday
                                            ? unmarkAsTaken(String(supplement.ean), String(supplement.name))
                                            : markAsTaken(String(supplement.ean), String(supplement.name))
                                        }
                                        size="sm"
                                        variant={supplement.takenToday ? "secondary" : "default"}
                                        className={isMobile ? "min-w-[60px] text-xs" : "min-w-[70px] transition-all duration-300"}
                                      >
                                        {supplement.takenToday ? (
                                          <>
                                            <Undo2 className={isMobile ? "w-3 h-3" : "w-3 h-3 mr-1"} />
                                            {!isMobile && "Deshacer"}
                                          </>
                                        ) : (
                                          "Completar"
                                        )}
                                      </Button>
                                    </motion.div>
                                  )}
                                </div>
                              </motion.article>
                            ))}
                          </div>
                        </div>


                        {/* Mediodía */}
                        {groupedSupplements.midday.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="font-medium text-foreground flex items-center gap-2">
                              <Sun className="w-5 h-5 text-yellow-400" />
                              Mediodía
                            </h3>
                            <div className="space-y-3">
                              {groupedSupplements.midday.map((supplement, index) => (
                                <motion.article
                                  key={supplement.ean}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1, duration: 0.3 }}
                                  className={cn(
                                    `rounded-lg p-4 border card-interactive overflow-hidden ${isMobile ? 'p-3' : ''}`,
                                    {
                                      'bg-muted/50 border-border': supplement.takenToday,
                                      'bg-card border-border': !supplement.takenToday && !isViewingPast,
                                      'bg-destructive/10 border-destructive/20': !supplement.takenToday && isViewingPast
                                    }
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <motion.div
                                        animate={supplement.takenToday ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                        className={`p-2 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${supplement.takenToday
                                          ? `bg-muted`
                                          : 'bg-primary/10 hover:bg-primary/20'
                                          }`}
                                        onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                      >
                                        {supplement.takenToday ? (
                                          <Check className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                          <Clock className="w-5 h-5 text-primary" />
                                        )}
                                      </motion.div>
                                      {/* {supplement.image_url ? (
                                        <img 
                                          src={supplement.image_url} 
                                          alt={supplement.name}
                                          className="w-14 h-14 rounded-lg object-cover border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        />
                                      ) : (
                                        <div 
                                          className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        >
                                          <Package className="w-7 h-7 text-primary" />
                                        </div>
                                      )} */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <h4 className={`font-semibold text-foreground text-sm leading-tight line-clamp-2 transition-all duration-300 ${supplement.takenToday ? 'text-completed line-through' : ''
                                            }`}>
                                            {supplement.name}
                                          </h4>
                                          {supplement.calculated_score && (
                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                              <Award className={`w-4 h-4 ${formatProductInfo(supplement).scoreColor}`} />
                                              <span className={`text-xs font-medium ${formatProductInfo(supplement).scoreColor}`}>
                                                {supplement.calculated_score}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-medium">
                                              {getBrandFromTags(supplement.brands_tags) || supplement.brand}
                                            </span>
                                            {/* {formatProductInfo(supplement).isSupplement && (
                                              <Shield className="w-3 h-3 text-green-600" />
                                            )} */}
                                          </div>
                                          {/* <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                              {getCategoryFromTags(supplement.categories_tags) || 'Suplemento'}
                                            </Badge>
                                            {formatProductInfo(supplement).hasLabels && (
                                              <Leaf className="w-3 h-3 text-green-600" />
                                            )}
                                          </div> */}
                                          {/* {formatProductInfo(supplement).labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {formatProductInfo(supplement).labels.slice(0, 2).map((label, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                                  {label}
                                                </Badge>
                                              ))}
                                            </div>
                                          )} */}
                                        </div>
                                      </div>
                                    </div>

                                    {!isViewingPast && (
                                      <motion.div
                                        initial={{ scale: 1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="ml-2 flex-shrink-0"
                                      >
                                        <Button
                                          onClick={() =>
                                            supplement.takenToday
                                              ? unmarkAsTaken(String(supplement.ean), String(supplement.name))
                                              : markAsTaken(String(supplement.ean), String(supplement.name))
                                          }
                                          size="sm"
                                          variant={supplement.takenToday ? "secondary" : "default"}
                                          className={isMobile ? "min-w-[60px] text-xs" : "min-w-[70px] transition-all duration-300"}
                                        >
                                          {supplement.takenToday ? (
                                            <>
                                              <Undo2 className={isMobile ? "w-3 h-3" : "w-3 h-3 mr-1"} />
                                              {!isMobile && "Deshacer"}
                                            </>
                                          ) : (
                                            "Completar"
                                          )}
                                        </Button>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.article>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Noche */}
                        {groupedSupplements.night.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="font-medium text-foreground flex items-center gap-2">
                              <Moon className="w-5 h-5 text-blue-700" />
                              Noche
                            </h3>
                            <div className="space-y-3">
                              {groupedSupplements.night.map((supplement, index) => (
                                <motion.article
                                  key={supplement.ean}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1, duration: 0.3 }}
                                  className={cn(
                                    `rounded-lg p-4 border card-interactive overflow-hidden ${isMobile ? 'p-3' : ''}`,
                                    {
                                      'bg-muted/50 border-border': supplement.takenToday,
                                      'bg-card border-border': !supplement.takenToday && !isViewingPast,
                                      'bg-destructive/10 border-destructive/20': !supplement.takenToday && isViewingPast
                                    }
                                  )}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                      <motion.div
                                        animate={supplement.takenToday ? { scale: [1, 1.2, 1] } : {}}
                                        transition={{ duration: 0.3 }}
                                        className={`p-2 rounded-full flex-shrink-0 transition-all duration-300 cursor-pointer ${supplement.takenToday
                                          ? `bg-muted`
                                          : 'bg-primary/10 hover:bg-primary/20'
                                          }`}
                                        onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                      >
                                        {supplement.takenToday ? (
                                          <Check className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                          <Clock className="w-5 h-5 text-primary" />
                                        )}
                                      </motion.div>
                                      {/* {supplement.image_url ? (
                                        <img 
                                          src={supplement.image_url} 
                                          alt={supplement.name}
                                          className="w-14 h-14 rounded-lg object-cover border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        />
                                      ) : (
                                        <div 
                                          className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border cursor-pointer"
                                          onClick={() => navigate(`/supplement/${supplement.ean}`)}
                                        >
                                          <Package className="w-7 h-7 text-primary" />
                                        </div>
                                      )} */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-1">
                                          <h4 className={`font-semibold text-foreground text-sm leading-tight line-clamp-2 transition-all duration-300 ${supplement.takenToday ? 'text-completed line-through' : ''
                                            }`}>
                                            {supplement.name}
                                          </h4>
                                          {supplement.calculated_score && (
                                            <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                              <Award className={`w-4 h-4 ${formatProductInfo(supplement).scoreColor}`} />
                                              <span className={`text-xs font-medium ${formatProductInfo(supplement).scoreColor}`}>
                                                {supplement.calculated_score}
                                              </span>
                                            </div>
                                          )}
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground font-medium">
                                              {getBrandFromTags(supplement.brands_tags) || supplement.brand}
                                            </span>
                                            {/* {formatProductInfo(supplement).isSupplement && (
                                              <Shield className="w-3 h-3 text-green-600" />
                                            )} */}
                                          </div>
                                          {/* <div className="flex items-center gap-1">
                                            <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                              {getCategoryFromTags(supplement.categories_tags) || 'Suplemento'}
                                            </Badge>
                                            {formatProductInfo(supplement).hasLabels && (
                                              <Leaf className="w-3 h-3 text-green-600" />
                                            )}
                                          </div> */}
                                          {/* {formatProductInfo(supplement).labels.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                              {formatProductInfo(supplement).labels.slice(0, 2).map((label, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                                  {label}
                                                </Badge>
                                              ))}
                                            </div>
                                          )} */}
                                        </div>
                                      </div>
                                    </div>

                                    {!isViewingPast && (
                                      <motion.div
                                        initial={{ scale: 1 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="ml-2 flex-shrink-0"
                                      >
                                        <Button
                                          onClick={() =>
                                            supplement.takenToday
                                              ? unmarkAsTaken(String(supplement.ean), String(supplement.name))
                                              : markAsTaken(String(supplement.ean), String(supplement.name))
                                          }
                                          size="sm"
                                          variant={supplement.takenToday ? "secondary" : "default"}
                                          className={isMobile ? "min-w-[60px] text-xs" : "min-w-[70px] transition-all duration-300"}
                                        >
                                          {supplement.takenToday ? (
                                            <>
                                              <Undo2 className={isMobile ? "w-3 h-3" : "w-3 h-3 mr-1"} />
                                              {!isMobile && "Deshacer"}
                                            </>
                                          ) : (
                                            "Completar"
                                          )}
                                        </Button>
                                      </motion.div>
                                    )}
                                  </div>
                                </motion.article>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Progress Trends */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.3 }}
        >
          <ProgressTrends
            kpis={kpis}
            chartData={combinedChartData}
            selectedDate={selectedDate}
            isLoading={loading}
          />
        </motion.div>

        {/* Health Summary Panel */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.3 }}
        >
          <HealthSummaryPanel
            userProfile={(() => {
              // Intentar obtener datos del usuario desde localStorage
              try {
                const temporaryData = localStorage.getItem('temporary_onboarding_data');
                const normalData = localStorage.getItem('onboarding_data');
                
                if (temporaryData) {
                  return JSON.parse(temporaryData);
                } else if (normalData) {
                  return JSON.parse(normalData);
                }
              } catch (error) {
                console.error('❌ Error parsing user profile from localStorage:', error);
              }
              return null;
            })()}
            onViewDetails={() => navigate('/analysis')}
            onRestartOnboarding={() => navigate('/onboarding')}
          />
        </motion.div>

        {/* Streaks and Achievements */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.3 }}
        >
          <StreaksAndAchievements
            gamificationData={gamificationData}
            kpis={kpis}
            isLoading={loading}
          />
        </motion.div>
      </main>
    </motion.div>
  );
};
