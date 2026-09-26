// Sistema de recompensas por niveles
export interface LevelReward {
  level: number;
  title: string;
  description: string;
  icon: string;
  type: 'badge' | 'unlock' | 'bonus';
  benefits: string[];
}

export const LEVEL_REWARDS: LevelReward[] = [
  {
    level: 5,
    title: "🏆 Primer Hito",
    description: "¡Has alcanzado el nivel 5!",
    icon: "🏆",
    type: "badge",
    benefits: [
      "Badge especial 'Primer Hito'",
      "Acceso a análisis avanzados",
      "Estadísticas detalladas de progreso"
    ]
  },
  {
    level: 10,
    title: "⭐ Consistencia Pro",
    description: "¡Nivel 10 alcanzado!",
    icon: "⭐",
    type: "unlock",
    benefits: [
      "Desbloqueo de métricas avanzadas",
      "Comparativas con otros usuarios",
      "Insights personalizados de IA"
    ]
  },
  {
    level: 15,
    title: "🔥 Máquina de Hábitos",
    description: "¡Nivel 15! Eres una máquina",
    icon: "🔥",
    type: "bonus",
    benefits: [
      "Multiplicador de puntos x1.5",
      "Acceso a protocolos premium",
      "Recordatorios inteligentes"
    ]
  },
  {
    level: 20,
    title: "💎 Experto en Salud",
    description: "¡Nivel 20! Eres un experto",
    icon: "💎",
    type: "unlock",
    benefits: [
      "Consultas con expertos",
      "Protocolos personalizados",
      "Análisis de interacciones avanzado"
    ]
  },
  {
    level: 25,
    title: "👑 Maestro del Bienestar",
    description: "¡Nivel 25! Eres un maestro",
    icon: "👑",
    type: "bonus",
    benefits: [
      "Multiplicador de puntos x2",
      "Acceso a beta features",
      "Mentoría para otros usuarios"
    ]
  }
];

export const getRewardsForLevel = (level: number): LevelReward[] => {
  return LEVEL_REWARDS.filter(reward => level >= reward.level);
};

export const getNextReward = (level: number): LevelReward | null => {
  return LEVEL_REWARDS.find(reward => level < reward.level) || null;
};

export const getRewardProgress = (level: number): { current: number; next: number; progress: number } => {
  const nextReward = getNextReward(level);
  if (!nextReward) {
    return { current: level, next: level, progress: 100 };
  }
  
  const currentReward = LEVEL_REWARDS.filter(r => r.level <= level).pop();
  const currentLevel = currentReward?.level || 0;
  const nextLevel = nextReward.level;
  
  return {
    current: currentLevel,
    next: nextLevel,
    progress: ((level - currentLevel) / (nextLevel - currentLevel)) * 100
  };
};
