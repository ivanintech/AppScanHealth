import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { motion } from "framer-motion";
import { Gift, Star, Trophy, Crown, Diamond } from "lucide-react";
import { getRewardsForLevel, getNextReward, getRewardProgress, LevelReward } from "@/pages/home/levelRewards";

interface LevelRewardsProps {
  currentLevel: number;
  totalPoints: number;
}

const getRewardIcon = (type: string) => {
  switch (type) {
    case 'badge': return Trophy;
    case 'unlock': return Star;
    case 'bonus': return Diamond;
    default: return Gift;
  }
};

const LevelRewards: React.FC<LevelRewardsProps> = ({ currentLevel, totalPoints }) => {
  const earnedRewards = getRewardsForLevel(currentLevel);
  const nextReward = getNextReward(currentLevel);
  const progress = getRewardProgress(currentLevel);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="w-5 h-5 text-primary" />
          Recompensas por Nivel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progreso hacia la siguiente recompensa */}
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

        {/* Recompensas ganadas */}
        {earnedRewards.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Recompensas desbloqueadas</h4>
            {earnedRewards.map((reward, index) => {
              const IconComponent = getRewardIcon(reward.type);
              return (
                <motion.div
                  key={reward.level}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200"
                >
                  <IconComponent className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-green-800">{reward.title}</span>
                      <Badge variant="secondary" className="text-xs">
                        Nivel {reward.level}
                      </Badge>
                    </div>
                    <p className="text-sm text-green-700 mb-2">{reward.description}</p>
                    <ul className="text-xs text-green-600 space-y-1">
                      {reward.benefits.map((benefit, idx) => (
                        <li key={idx} className="flex items-center gap-1">
                          <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Próxima recompensa */}
        {nextReward && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
          >
            <Crown className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-blue-800">Próxima: {nextReward.title}</span>
                <Badge variant="outline" className="text-xs">
                  Nivel {nextReward.level}
                </Badge>
              </div>
              <p className="text-sm text-blue-700 mb-2">{nextReward.description}</p>
              <ul className="text-xs text-blue-600 space-y-1">
                {nextReward.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-500 rounded-full"></span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default LevelRewards;
