import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { motion } from "framer-motion";
import { 
  Trophy, Star, Crown, Diamond, Gift, Flame, 
  Target, Calendar, Award, Zap, ChevronRight 
} from "lucide-react";
import { getRewardsForLevel, getNextReward, getRewardProgress, LevelReward } from "@/pages/home/levelRewards";

interface ProgressTimelineProps {
  currentLevel: number;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  upcomingAchievements: any[];
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'badge': return Trophy;
    case 'unlock': return Star;
    case 'bonus': return Diamond;
    default: return Gift;
  }
};

const getStreakStatus = (current: number, longest: number) => {
  if (current === 0) return { status: 'Sin racha', color: 'text-gray-500', bg: 'bg-gray-50' };
  if (current >= 30) return { status: '🔥 Máquina', color: 'text-red-600', bg: 'bg-red-50' };
  if (current >= 14) return { status: '💪 Experto', color: 'text-orange-600', bg: 'bg-orange-50' };
  if (current >= 7) return { status: '⭐ Consistente', color: 'text-blue-600', bg: 'bg-blue-50' };
  return { status: '🌱 Iniciando', color: 'text-green-600', bg: 'bg-green-50' };
};

const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ 
  currentLevel, 
  totalPoints, 
  currentStreak, 
  longestStreak,
  upcomingAchievements 
}) => {
  const earnedRewards = getRewardsForLevel(currentLevel);
  const nextReward = getNextReward(currentLevel);
  const progress = getRewardProgress(currentLevel);
  const streakStatus = getStreakStatus(currentStreak, longestStreak);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          Tu Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Nivel y Puntos */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {currentLevel}
              </div>
              <div>
                <h3 className="text-lg font-semibold">Nivel {currentLevel}</h3>
                <p className="text-sm text-muted-foreground">{totalPoints} puntos totales</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm">
              {totalPoints} pts
            </Badge>
          </div>

          {/* Progreso hacia siguiente nivel */}
          {nextReward && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Próxima recompensa</span>
                <span className="text-sm text-muted-foreground">Nivel {nextReward.level}</span>
              </div>
              <Progress value={progress.progress} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {currentLevel} / {nextReward.level} niveles
              </div>
            </div>
          )}
        </div>


        {/* Recompensas Ganadas */}
        {earnedRewards.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <h4 className="text-sm font-semibold">Recompensas Desbloqueadas</h4>
            </div>
            
            <div className="space-y-2">
              {earnedRewards.map((reward, index) => {
                const IconComponent = getRewardIcon(reward.type);
                return (
                  <motion.div
                    key={reward.level}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-green-50 border border-green-200"
                  >
                    <IconComponent className="w-4 h-4 text-green-600" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-green-800">{reward.title}</span>
                        <Badge variant="secondary" className="text-xs">
                          Nivel {reward.level}
                        </Badge>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Próxima Recompensa */}
        {nextReward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-blue-500" />
              <h4 className="text-sm font-semibold">Próxima Recompensa</h4>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
              <Crown className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-blue-800">{nextReward.title}</span>
                  <Badge variant="outline" className="text-xs">
                    Nivel {nextReward.level}
                  </Badge>
                </div>
                <p className="text-sm text-blue-700 mb-2">{nextReward.description}</p>
                <ul className="text-xs text-blue-600 space-y-1">
                  {nextReward.benefits.slice(0, 2).map((benefit, idx) => (
                    <li key={idx} className="flex items-center gap-1">
                      <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}

      </CardContent>
    </Card>
  );
};

export default ProgressTimeline;
