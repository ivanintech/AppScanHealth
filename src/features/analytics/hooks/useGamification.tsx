import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/supabase/client';

export interface GamificationData {
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
}

export const useGamification = () => {
  const [gamificationData, setGamificationData] = useState<GamificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGamificationData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Fetching user gamification data

      // Obtener puntos totales del usuario desde profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('total_points')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        throw profileError;
      }

      const totalPoints = profileData?.total_points || 0;

      // Obtener achievements del usuario
      const { data: achievementsData, error: userAchievementsError } = await supabase
        .from('user_achievements')
        .select(`
          id,
          earned_at,
          achievements (
            id,
            name,
            description,
            points,
            rarity
          )
        `)
        .eq('user_id', user.id);

      if (userAchievementsError) {
        console.error('Error fetching user achievements:', userAchievementsError);
        throw userAchievementsError;
      }

      // Obtener todos los achievements disponibles para calcular próximos
      const { data: allAchievementsData, error: allAchievementsError } = await supabase
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('points', { ascending: true });

      if (allAchievementsError) {
        console.error('Error fetching all achievements:', allAchievementsError);
        throw allAchievementsError;
      }

      // Calcular próximos achievements (los que no ha ganado)
      const earnedAchievementIds = new Set(achievementsData?.map(ua => ua.achievements?.id) || []);
      const upcomingAchievements = allAchievementsData
        ?.filter(achievement => !earnedAchievementIds.has(achievement.id))
        ?.slice(0, 4) // Solo los primeros 4
        ?.map(achievement => ({
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          points: achievement.points,
          rarity: achievement.rarity,
          progress: 0, // Por ahora 0, se puede calcular basado en condiciones
          target: 1 // Por ahora 1, se puede calcular basado en condiciones
        })) || [];

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
      const { data: earnedAchievements, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          achievements (
            points,
            name
          )
        `)
        .eq('user_id', user.id);

      let realTotalPoints = 0;
      let userLevel = 1;


      if (achievementsError) {
        console.error('Error fetching earned achievements:', achievementsError);
        // Fallback: usar puntos del perfil
        realTotalPoints = totalPoints;
        userLevel = calculateLevelFromAchievements(totalPoints);
      } else {
        // Calcular puntos reales basados en logros ganados
        realTotalPoints = earnedAchievements?.reduce((sum, ua) => {
          const points = ua.achievements?.points || 0;
          return sum + points;
        }, 0) || 0;
        
        userLevel = calculateLevelFromAchievements(realTotalPoints);
        
        // Actualizar el perfil con los puntos reales si son diferentes
        if (realTotalPoints !== totalPoints) {
          console.log(`🎮 [Gamificación] Actualizando perfil: ${totalPoints} → ${realTotalPoints} puntos, Nivel ${userLevel}`);
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              total_points: realTotalPoints,
              level: userLevel,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('🎮 [Gamificación] Error actualizando perfil:', updateError);
          }
        }
      }

      const finalGamificationData: GamificationData = {
        total_points: realTotalPoints,
        user_level: userLevel,
        upcoming_achievements: upcomingAchievements
      };


      // Gamification data fetched successfully
      setGamificationData(finalGamificationData);

    } catch (err: any) {
      console.error('Error fetching gamification data:', err);
      setError(err.message || 'An unknown error occurred');
      
      // Fallback data
      setGamificationData({
        total_points: 0,
        user_level: 1,
        upcoming_achievements: []
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGamificationData();
  }, [fetchGamificationData]);

  return {
    gamificationData,
    loading,
    error,
    refetch: fetchGamificationData
  };
};
