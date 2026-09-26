import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Progress } from "@/shared/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, Star, Crown, Diamond, Gift, Target, 
  Award, Zap, ChevronRight, ChevronLeft, MapPin,
  TrendingUp, Sparkles, GiftIcon, StarIcon, Check
} from "lucide-react";
import { getRewardsForLevel, getNextReward, getRewardProgress, LevelReward } from "@/pages/home/levelRewards";

interface VisualLevelProgressProps {
  currentLevel: number;
  totalPoints: number;
  achievementsByType?: any;
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
  if (level < currentLevel) return 'bg-emerald-500';
  if (level === currentLevel) return 'bg-emerald-600';
  return 'bg-gray-200';
};

const getLevelBorderColor = (level: number, currentLevel: number) => {
  if (level < currentLevel) return 'border-emerald-500';
  if (level === currentLevel) return 'border-emerald-600';
  return 'border-gray-200';
};

const getGiftBoxLevels = () => [5, 10, 15, 20, 25]; // Niveles con cajas de regalo

const VisualLevelProgress: React.FC<VisualLevelProgressProps> = ({ 
  currentLevel, 
  totalPoints,
  achievementsByType 
}) => {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [timelineOffset, setTimelineOffset] = useState(0);
  
  // Generar niveles para mostrar (desde nivel actual hasta 25)
  const timelineLevels = useMemo(() => {
    const levels = [];
    const startLevel = Math.max(1, currentLevel - 1 + timelineOffset);
    const endLevel = Math.min(25, startLevel + 8);
    
    for (let level = startLevel; level <= endLevel; level++) {
      const rewards = getRewardsForLevel(level);
      const nextReward = getNextReward(level);
      const progress = getRewardProgress(level);
      const giftBoxLevels = getGiftBoxLevels();
      const hasGiftBox = giftBoxLevels.includes(level);
      
      levels.push({
        level,
        rewards,
        nextReward,
        progress,
        isCurrent: level === currentLevel,
        isCompleted: level < currentLevel,
        isUpcoming: level > currentLevel,
        hasGiftBox
      });
    }
    
    return levels;
  }, [currentLevel, timelineOffset]);

  // Calcular progreso preciso para el slider - POSICIÓN EXACTA
  const totalProgressPercentage = useMemo(() => {
    // Encontrar el índice del nivel actual en la timeline visible
    const currentLevelIndex = timelineLevels.findIndex(level => level.level === currentLevel);
    
    if (currentLevelIndex === -1) {
      console.log('🎯 [Progreso] Nivel actual no encontrado en timeline');
      return 0;
    }
    
    // Calcular progreso dentro del nivel actual (0-100%)
    const pointsInCurrentLevel = totalPoints % 100;
    const progressInCurrentLevel = pointsInCurrentLevel / 100;
    
    // Calcular posición: índice del nivel actual + progreso dentro del nivel
    const totalProgress = currentLevelIndex + progressInCurrentLevel;
    
    // Convertir a porcentaje basado en el número total de segmentos
    const numVisibleSegments = timelineLevels.length - 1;
    const percentage = (totalProgress / numVisibleSegments) * 100;
    
    
    return Math.min(100, Math.max(0, percentage));
  }, [currentLevel, totalPoints, timelineLevels]);
  

  const handlePrevious = () => {
    const newOffset = Math.max(-currentLevel + 2, timelineOffset - 1);
    setTimelineOffset(newOffset);
  };

  const handleNext = () => {
    const maxOffset = 25 - currentLevel - 7;
    const newOffset = Math.min(maxOffset, timelineOffset + 1);
    setTimelineOffset(newOffset);
  };

  const handleLevelClick = (level: number) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };


  // Calcular estadísticas de logros
  const totalAchievements = achievementsByType ? 
    Object.values(achievementsByType).reduce((sum: number, type: any) => sum + type.total, 0) : 0;
  const earnedAchievements = achievementsByType ? 
    Object.values(achievementsByType).reduce((sum: number, type: any) => sum + type.earned, 0) : 0;

  return (
    <Card 
      className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300"
    >
      <CardHeader className="pb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-left"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <div className="text-emerald-700">
              <div className="text-lg font-semibold">Nivel {currentLevel}</div>
              <div className="text-sm text-emerald-600">
                {totalPoints % 100}/{100} puntos para Nivel {currentLevel + 1}
              </div>
            </div>
          </div>
        </motion.div>
      </CardHeader>
      
      <CardContent className="space-y-4">

        {/* Línea temporal horizontal con cajas de regalo */}
        <div className="relative px-4">
           {/* Línea visual del progreso */}
           <div 
             className="absolute top-8 left-4 right-4 h-2 bg-gray-200 rounded-full z-0"
             style={{ top: '32px' }} // Centrar con los círculos
           >
             {/* Progreso completado */}
             <div 
               className="h-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 rounded-full transition-all duration-1000"
               style={{ 
                 width: `${Math.min(100, totalProgressPercentage)}%` 
               }}
             />
           </div>
           
          {/* Niveles */}
          <div className="flex justify-between items-start relative z-20">
            {timelineLevels.map((levelData, index) => {
              const status = getLevelColor(levelData.level, currentLevel);
              const IconComponent = levelData.rewards.length > 0 
                ? getRewardIcon(levelData.rewards[levelData.rewards.length - 1].type)
                : Target;
              
              return (
                <React.Fragment key={levelData.level}>
                  
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex flex-col items-center cursor-pointer group relative"
                    onClick={() => handleLevelClick(levelData.level)}
                    style={{ marginTop: '16px' }} // Ajustar para alinear con la línea
                  >
                  
                  {/* Caja de regalo para niveles especiales */}
                  {levelData.hasGiftBox && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg z-20 border-2 border-white"
                    >
                      <Gift className="w-2 h-2 text-white" />
                    </motion.div>
                  )}
                  
                  {/* Punto del nivel */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold text-xs
                      ${status} shadow-md transition-all duration-300 cursor-pointer border-2
                      ${getLevelBorderColor(levelData.level, currentLevel)}
                      ${levelData.isCurrent ? 'ring-2 ring-emerald-300 shadow-lg' : ''}
                      ${levelData.isCompleted ? 'ring-1 ring-emerald-400' : ''}
                    `}
                  >
                    {levelData.isCurrent ? (
                      <Target className="w-3 h-3" />
                    ) : levelData.isCompleted ? (
                      <Check className="w-3 h-3" />
                    ) : (
                      levelData.level
                    )}
                  </motion.div>
                  
                  {/* Etiqueta del nivel */}
                  <div className="mt-2 text-center">
                    <div className="text-xs font-medium text-gray-600">
                      {levelData.level}
                    </div>
                    {levelData.isCurrent && (
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        Actual
                      </div>
                    )}
                    {levelData.isCompleted && (
                      <div className="text-xs text-emerald-600 font-medium mt-1">
                        ✓
                      </div>
                    )}
                  </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
          </div>
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
                  <div className="bg-white rounded-lg p-4 space-y-3 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-semibold text-gray-800">Nivel {selectedLevel}</h4>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedLevelData.isCompleted 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : selectedLevelData.isCurrent 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {selectedLevelData.isCompleted ? 'Completado' : selectedLevelData.isCurrent ? 'Actual' : 'Próximo'}
                      </div>
                    </div>
                    
                    {/* Recompensas de este nivel */}
                    {selectedLevelData.rewards.length > 0 && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                          <Trophy className="w-4 h-4" />
                          Obtenidos:
                        </h5>
                        {selectedLevelData.rewards.map((reward, index) => {
                          const IconComponent = getRewardIcon(reward.type);
                          return (
                            <div key={index} className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md">
                              <IconComponent className="w-4 h-4 text-emerald-600" />
                              <div>
                                <span className="text-sm font-medium text-emerald-800">{reward.title}</span>
                                <p className="text-xs text-emerald-600">{reward.description}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {/* Próxima recompensa */}
                    {selectedLevelData.nextReward && (
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-emerald-700 flex items-center gap-2">
                          <Crown className="w-4 h-4" />
                          Próximo nivel:
                        </h5>
                        <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-md">
                          <Crown className="w-4 h-4 text-emerald-600" />
                          <div>
                            <span className="text-sm font-medium text-emerald-800">{selectedLevelData.nextReward.title}</span>
                            <p className="text-xs text-emerald-600">{selectedLevelData.nextReward.description}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navegación simplificada */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex justify-between items-center pt-3"
        >
          <motion.button 
            onClick={handlePrevious}
            disabled={timelineOffset <= -currentLevel + 2}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-emerald-50 disabled:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-200"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Anterior
            </span>
          </motion.button>
          
          <motion.button 
            onClick={handleNext}
            disabled={timelineOffset >= 25 - currentLevel - 7}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-emerald-50 disabled:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg border border-gray-200 hover:border-emerald-300 transition-all duration-200"
          >
            <span className="text-sm font-medium text-gray-700">
              Siguiente
            </span>
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </motion.button>
        </motion.div>
      </CardContent>

    </Card>
  );
};

export default VisualLevelProgress;
