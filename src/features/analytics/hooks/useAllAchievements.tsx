import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/supabase/client';

export type AchievementStatus = {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number;
  category: string;
  is_unlocked: boolean;
  earned_at: string | null;
  current_progress?: number;
  target_progress?: number;
};

export const useAllAchievements = () => {
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        throw new Error("User not authenticated");
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
        .eq('user_id', user.user.id);

      if (achievementsError) {
        console.error('Error fetching user achievements:', achievementsError);
      }

      // Obtener todos los achievements disponibles
      const { data: allAchievementsData, error: allAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true });

      if (allAchievementsError) {
        console.error('Error fetching all achievements:', allAchievementsError);
      }

      // Obtener el progreso real de todos los achievements usando la función RPC
      const { data: allAchievementsWithProgress, error: progressError } = await supabase.rpc('get_all_achievements_status', {
        p_user_id: user.user.id
      });

      if (progressError) {
        console.error('Error fetching achievements with progress:', progressError);
      }

      // Obtener IDs de logros ganados de user_achievements PRIMERO
      const earnedAchievementIds = new Set();
      if (achievementsData) {
        achievementsData.forEach(ua => {
          if (ua.achievement_id) earnedAchievementIds.add(ua.achievement_id);
          if (ua.achievements?.id) earnedAchievementIds.add(ua.achievements.id);
        });
      }

      // Crear un mapa de progreso por achievement ID y también identificar logros completados
      const progressMap = new Map();
      const completedAchievementIds = new Set();
      
      if (Array.isArray(allAchievementsWithProgress)) {
        allAchievementsWithProgress.forEach((ach: any) => {
          // Verificar si el logro ya está ganado en user_achievements
          const isAlreadyEarned = earnedAchievementIds.has(ach.id);
          
          let currentProgress = ach.current_progress || 0;
          let targetProgress = ach.target_progress || 1;
          
          // Si ya está ganado, forzar progreso completo
          if (isAlreadyEarned) {
            currentProgress = targetProgress;
            // Debug log removido para limpieza
          }
          
          progressMap.set(ach.id, {
            progress: currentProgress,
            target: targetProgress
          });
          
          // Si el progreso es igual al target, el logro está completado
          if (currentProgress >= targetProgress && targetProgress > 0) {
            completedAchievementIds.add(ach.id);
            // Debug log removido para limpieza
          }
        });
      }

      // Combinar logros ganados con logros completados
      const allCompletedAchievementIds = new Set([...earnedAchievementIds, ...completedAchievementIds]);

      // Debug log removido para limpieza

      // Mapear achievements con estado correcto
      const achievementsWithStatus = allAchievementsData?.map(achievement => {
        const progressData = progressMap.get(achievement.id) || { progress: 0, target: 1 };
        const isUnlocked = allCompletedAchievementIds.has(achievement.id);
        
        // Obtener fecha real de earned_at si existe en user_achievements
        let earnedAt = null;
        if (isUnlocked && achievementsData) {
          const userAchievement = achievementsData.find(ua => 
            ua.achievement_id === achievement.id || ua.achievements?.id === achievement.id
          );
          earnedAt = userAchievement?.earned_at || new Date().toISOString();
        }
        
        return {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon_url: achievement.icon_url,
          rarity: achievement.rarity as 'common' | 'rare' | 'epic' | 'legendary',
          points: achievement.points,
          category: achievement.category,
          is_unlocked: isUnlocked,
          earned_at: earnedAt,
          current_progress: progressData.progress,
          target_progress: progressData.target
        };
      }) || [];

      // Ordenar logros: completados primero (por fecha más antigua), luego no completados
      achievementsWithStatus.sort((a, b) => {
        // Si ambos están desbloqueados, ordenar por fecha (más antiguos primero)
        if (a.is_unlocked && b.is_unlocked) {
          if (!a.earned_at || !b.earned_at) return 0;
          return new Date(a.earned_at).getTime() - new Date(b.earned_at).getTime();
        }
        
        // Si solo uno está desbloqueado, el desbloqueado va primero
        if (a.is_unlocked && !b.is_unlocked) return -1;
        if (!a.is_unlocked && b.is_unlocked) return 1;
        
        // Si ninguno está desbloqueado, ordenar por puntos (menos puntos primero)
        return a.points - b.points;
      });

      setAchievements(achievementsWithStatus);

    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    achievements,
    loading,
    error,
  };
};


