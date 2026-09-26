import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { Flame, Trophy, Calendar, Award, ChevronRight, Star, BarChart, Zap, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/shared/components/ui/badge";
import { getAchievementIconByName } from "@/shared/lib/utils";
import VisualLevelProgress from "./VisualLevelProgress";

interface StatCardProps {
  icon: React.ElementType;
  title: string;
  value: string | number;
  colorClass: string;
  animationDelay?: number;
  cardClassName?: string;
}

const StatCard = ({ icon: Icon, title, value, colorClass, animationDelay = 0, cardClassName }: StatCardProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: animationDelay }}
    className={`flex flex-col items-center justify-center text-center p-4 rounded-lg border ${colorClass} ${cardClassName}`}
  >
    <Icon className="h-5 w-5 mb-1" />
    <div className="text-xl font-bold">{value}</div>
    <div className="text-xs font-medium">{title}</div>
  </motion.div>
);

const calculateLevelData = (totalPoints: number) => {
  if (totalPoints < 0) totalPoints = 0;

  let level = 1;
  let pointsForNextLevel = 100;
  let pointsForCurrentLevel = 0;

  while (totalPoints >= pointsForNextLevel) {
    pointsForCurrentLevel = pointsForNextLevel;
    pointsForNextLevel += 100 + (level - 1) * 50;
    level++;
  }

  const pointsInCurrentLevel = totalPoints - pointsForCurrentLevel;
  const pointsNeededForLevel = pointsForNextLevel - pointsForCurrentLevel;
  const progressPercent = pointsNeededForLevel > 0 ? (pointsInCurrentLevel / pointsNeededForLevel) * 100 : 0;

  return {
    level,
    pointsInCurrentLevel,
    pointsNeededForLevel,
    progressPercent,
    totalPoints,
    pointsForNextLevel,
  };
};

const UpcomingAchievementCard = ({
  achievement,
  progress,
}: {
  achievement: {
    id: string;
    name: string;
    description: string;
    points: number;
    rarity: string;
    progress: number;
    target: number;
  };
  progress: number;
}) => {
  const IconComponent = getAchievementIconByName(achievement.name)
  const rarityConfigMap = {
    common: { 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      progress: 'bg-emerald-500',
      glow: 'shadow-emerald-200',
      iconBg: 'bg-gray-100',
      accent: 'bg-gray-400'
    },
    rare: { 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      progress: 'bg-emerald-500',
      glow: 'shadow-emerald-200',
      iconBg: 'bg-blue-100',
      accent: 'bg-blue-500'
    },
    epic: { 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      progress: 'bg-emerald-500',
      glow: 'shadow-emerald-200',
      iconBg: 'bg-purple-100',
      accent: 'bg-purple-500'
    },
    legendary: { 
      color: 'text-emerald-600', 
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      progress: 'bg-emerald-500',
      glow: 'shadow-emerald-200',
      iconBg: 'bg-yellow-100',
      accent: 'bg-yellow-500'
    },
  };
  
  const rarityConfig = rarityConfigMap[achievement.rarity as keyof typeof rarityConfigMap] || rarityConfigMap.common;

  // Calcular el progreso como porcentaje
  const progressPercent = achievement.target > 0 ? (achievement.progress / achievement.target) * 100 : 0;
  const remaining = Math.max(0, achievement.target - achievement.progress);

  return (
    <div className="flex-shrink-0 w-28 text-center">
      {/* Contenedor con padding para evitar corte */}
      <div className="relative p-2">
        {/* Icono principal con fondo emerald */}
        <div className={`relative mx-auto h-12 w-12 ${rarityConfig.bg} rounded-full flex items-center justify-center border-2 ${rarityConfig.border} shadow-md ${rarityConfig.glow} transition-all duration-300 hover:scale-105`}>
          {/* Fondo del icono con color de rareza sutil */}
          <div className={`h-8 w-8 ${rarityConfig.iconBg} rounded-full flex items-center justify-center`}>
            <IconComponent
              className={`h-4 w-4 ${rarityConfig.color}`}
            />
          </div>
          
          {/* Puntos del logro - posicionado para evitar corte */}
          <div className={`absolute -top-1 -right-1 ${rarityConfig.progress} text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center shadow-lg z-10`}>
            {achievement.points}
          </div>
        </div>
      </div>
      
      {/* Nombre del logro */}
      <p className="mt-2 text-xs font-medium text-gray-700 leading-tight">{achievement.name}</p>
      
      {/* Barra de progreso emerald */}
      <div className="mt-2 flex justify-center">
        <div className="relative h-2 w-20 rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-2 rounded-full ${rarityConfig.progress} transition-all duration-300`}
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
      </div>
      
      {/* Progreso numérico */}
      <div className="mt-1 text-xs text-gray-600">
        {achievement.progress}/{achievement.target}
      </div>
      
      {/* Etiqueta de rareza con color de acento */}
      <div className={`mt-1 text-xs font-medium ${rarityConfig.accent.replace('bg-', 'text-')} capitalize`}>
        {achievement.rarity}
      </div>
    </div>
  );
};

// Definimos la estructura de los datos que el componente espera recibir
interface GamificationData {
  total_points: number;
  user_level: number;
  current_streak: number;
  longest_streak: number;
  total_active_days: number;
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

interface StreaksAndAchievementsProps {
  gamificationData: {
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
    achievements_by_type?: {
      [key: string]: {
        earned: number;
        total: number;
      };
    };
  } | null;
  kpis: {
    current_streak: number;
    longest_streak: number;
    active_days_last_30: number;
  } | null;
  isLoading: boolean;
}

const StreaksAndAchievements: React.FC<StreaksAndAchievementsProps> = ({ gamificationData, kpis, isLoading }) => {
  const navigate = useNavigate();

  // Usar el nivel calculado del backend en lugar de recalcular - OPTIMIZADO
  const levelData = useMemo(() => {
    if (!gamificationData) return null;
    return {
      level: gamificationData.user_level,
      totalPoints: gamificationData.total_points,
      pointsInCurrentLevel: gamificationData.total_points % 100,
      pointsNeededForLevel: 100 - (gamificationData.total_points % 100),
      progressPercent: ((gamificationData.total_points % 100) / 100) * 100,
      pointsForNextLevel: Math.ceil(gamificationData.total_points / 100) * 100
    };
  }, [gamificationData?.user_level, gamificationData?.total_points]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="h-28 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/50 rounded-xl animate-pulse"></div>
            <div className="h-28 bg-muted/50 rounded-xl animate-pulse"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!gamificationData || !kpis || !levelData) {
    return null; // O un estado de error/vacío
  }
  

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          Rachas y Logros
        </CardTitle>
        <CardDescription>Tu progreso y achievements desbloqueados</CardDescription>
      </CardHeader>
      <CardContent>
        {gamificationData && levelData ? (
          <>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatCard
                icon={Flame}
                title="Racha Actual"
                value={kpis.current_streak || 0}
                colorClass="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200 text-orange-700"
                animationDelay={0}
              />
              <StatCard
                icon={Trophy}
                title="Mejor Racha"
                value={kpis.longest_streak || 0}
                colorClass="bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200 text-yellow-700"
                animationDelay={0.1}
              />
        <StatCard
          icon={Trophy}
          title="Logros Obtenidos"
          value={`${gamificationData?.achievements_by_type ? 
            Object.values(gamificationData.achievements_by_type).reduce((sum: number, type: any) => sum + (type.earned || 0), 0) : 0} / ${
            gamificationData?.achievements_by_type ? 
            Object.values(gamificationData.achievements_by_type).reduce((sum: number, type: any) => sum + (type.total || 0), 0) : 0}`}
          colorClass="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200 text-purple-700"
          animationDelay={0.2}
        />
            </div>


            {/* Progreso de nivel visual */}
            <div className="mt-6">
          <VisualLevelProgress 
            currentLevel={gamificationData.user_level} 
            totalPoints={gamificationData.total_points}
            achievementsByType={gamificationData.achievements_by_type || {}}
          />
            </div>

            {/* Próximos Logros - Sección minimalista */}
            {gamificationData.upcoming_achievements && gamificationData.upcoming_achievements.length > 0 && (
              <div className="mt-6">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold flex items-center gap-2 text-gray-800">
                    <Award className="w-4 h-4 text-emerald-600" />
                    Próximos Logros
                  </h4>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" 
                    onClick={() => navigate('/achievements')}
                  >
                    Ver todos
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                <div className="flex space-x-4 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                  {gamificationData.upcoming_achievements
                    .sort((a, b) => {
                      // Ordenar por: 1) Progreso restante (menos = primero), 2) Puntos (más = primero)
                      const aRemaining = a.target - a.progress;
                      const bRemaining = b.target - b.progress;
                      
                      if (aRemaining !== bRemaining) {
                        return aRemaining - bRemaining; // Menos progreso restante primero
                      }
                      
                      // Si el progreso restante es igual, ordenar por puntos (mayor primero)
                      return (b.points || 0) - (a.points || 0);
                    })
                    .slice(0, 4)
                    .map((ach, index) => (
                      <UpcomingAchievementCard key={ach.id} achievement={ach} progress={ach.progress} />
                    ))}
                </div>
              </div>
            )}

          </>
        ) : null}
      </CardContent>
    </Card>
  );
};

export default StreaksAndAchievements;
