import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Crown, Diamond, Gift, Target, 
  Award, Zap, ChevronRight, ChevronLeft, MapPin
} from "lucide-react";
import { getRewardsForLevel, getNextReward, getRewardProgress, LevelReward } from "@/pages/home/levelRewards";

interface InteractiveTimelineProps {
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

const getLevelColor = (level: number, currentLevel: number) => {
  if (level < currentLevel) return 'bg-green-500';
  if (level === currentLevel) return 'bg-blue-500';
  return 'bg-gray-300';
};

const getLevelStatus = (level: number, currentLevel: number) => {
  if (level < currentLevel) return 'completed';
  if (level === currentLevel) return 'current';
  return 'upcoming';
};

const InteractiveTimeline: React.FC<InteractiveTimelineProps> = ({ 
  currentLevel, 
  totalPoints 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
  // Generar niveles para mostrar (desde nivel actual hasta 25)
  const timelineLevels = useMemo(() => {
    const levels = [];
    const startLevel = Math.max(1, currentLevel - 1);
    const endLevel = Math.min(25, currentLevel + 8);
    
    for (let level = startLevel; level <= endLevel; level++) {
      const rewards = getRewardsForLevel(level);
      const nextReward = getNextReward(level);
      const progress = getRewardProgress(level);
      
      levels.push({
        level,
        rewards,
        nextReward,
        progress,
        isCurrent: level === currentLevel,
        isCompleted: level < currentLevel,
        isUpcoming: level > currentLevel
      });
    }
    
    return levels;
  }, [currentLevel]);

  const handleLevelClick = (level: number) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Tu Línea de Progreso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Línea temporal horizontal */}
        <div className="relative">
          {/* Línea de conexión */}
          <div className="absolute top-6 left-0 right-0 h-0.5 bg-gray-200"></div>
          
          {/* Niveles */}
          <div className="flex justify-between items-center relative z-10">
            {timelineLevels.map((levelData, index) => {
              const status = getLevelStatus(levelData.level, currentLevel);
              const color = getLevelColor(levelData.level, currentLevel);
              const IconComponent = levelData.rewards.length > 0 
                ? getRewardIcon(levelData.rewards[levelData.rewards.length - 1].type)
                : Target;
              
              return (
                <motion.div
                  key={levelData.level}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex flex-col items-center cursor-pointer group"
                  onClick={() => handleLevelClick(levelData.level)}
                >
                  {/* Punto del nivel */}
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm
                    ${color} shadow-lg transition-all duration-300 group-hover:scale-110
                    ${levelData.isCurrent ? 'ring-4 ring-blue-200' : ''}
                    ${levelData.isCompleted ? 'ring-2 ring-green-200' : ''}
                  `}>
                    {levelData.isCurrent ? (
                      <Crown className="w-5 h-5" />
                    ) : levelData.isCompleted ? (
                      <IconComponent className="w-5 h-5" />
                    ) : (
                      levelData.level
                    )}
                  </div>
                  
                  {/* Etiqueta del nivel */}
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-700">
                      Nivel {levelData.level}
                    </div>
                    {levelData.isCurrent && (
                      <Badge variant="secondary" className="text-xs mt-1">
                        Actual
                      </Badge>
                    )}
                    {levelData.isCompleted && (
                      <Badge variant="default" className="text-xs mt-1 bg-green-100 text-green-800">
                        ✓
                      </Badge>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Nivel actual destacado */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-200">
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
          {timelineLevels.find(l => l.level > currentLevel) && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Próximo hito</span>
                <span className="text-sm text-muted-foreground">
                  Nivel {timelineLevels.find(l => l.level > currentLevel)?.level}
                </span>
              </div>
              <Progress 
                value={timelineLevels.find(l => l.level > currentLevel)?.progress.progress || 0} 
                className="h-2" 
              />
            </div>
          )}
        </div>

        {/* Detalles del nivel seleccionado */}
        <AnimatePresence>
          {selectedLevel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {(() => {
                const selectedLevelData = timelineLevels.find(l => l.level === selectedLevel);
                if (!selectedLevelData) return null;
                
                return (
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold">Nivel {selectedLevel}</h4>
                      <Badge variant={selectedLevelData.isCompleted ? 'default' : selectedLevelData.isCurrent ? 'secondary' : 'outline'}>
                        {selectedLevelData.isCompleted ? 'Completado' : selectedLevelData.isCurrent ? 'Actual' : 'Próximo'}
                      </Badge>
                    </div>
                    
                    {/* Recompensas de este nivel */}
                    {selectedLevelData.rewards.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-green-700">Recompensas desbloqueadas:</h5>
                        {selectedLevelData.rewards.map((reward, index) => {
                          const IconComponent = getRewardIcon(reward.type);
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-100 rounded">
                              <IconComponent className="w-4 h-4 text-green-600" />
                              <span className="text-sm text-green-800">{reward.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Próxima recompensa */}
                    {selectedLevelData.nextReward && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-blue-700">Próxima recompensa:</h5>
                        <div className="flex items-center gap-2 p-2 bg-blue-100 rounded">
                          <Crown className="w-4 h-4 text-blue-600" />
                          <span className="text-sm text-blue-800">{selectedLevelData.nextReward.title}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegación */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            <span>Nivel {Math.max(1, currentLevel - 1)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span>Nivel {Math.min(25, currentLevel + 8)}</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default InteractiveTimeline;
