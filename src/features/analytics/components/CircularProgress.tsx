import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface CircularProgressProps {
  value: number; // 0-100
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showPercentage?: boolean;
  children?: React.ReactNode;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  className = '',
  showPercentage = true,
  children
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (value / max) * circumference;

  // Calcular el porcentaje real de progreso
  const progressPercentage = (value / max) * 100;

  // Determinar el color basado en el porcentaje de progreso
  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'hsl(142 76% 36%)'; // Verde oscuro para 100%
    if (percentage >= 80) return 'hsl(142 71% 45%)'; // Verde para alto progreso
    if (percentage >= 60) return 'hsl(45 93% 47%)'; // Amarillo para progreso medio
    if (percentage >= 40) return 'hsl(25 95% 53%)'; // Naranja para progreso bajo
    return 'hsl(var(--destructive))'; // Rojo para progreso muy bajo
  };

  const progressColor = getProgressColor(progressPercentage);


  const isComplete = progressPercentage >= 100;
  const [playCompleteAnim, setPlayCompleteAnim] = useState(false);
  const wasComplete = useRef(false);

  useEffect(() => {
    if (isComplete && !wasComplete.current) {
      setPlayCompleteAnim(true);
      wasComplete.current = true;
    } else if (!isComplete && wasComplete.current) {
      wasComplete.current = false;
      setPlayCompleteAnim(false);
    }
  }, [isComplete]);

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <motion.div
        animate={playCompleteAnim ? { scale: [1, 1.05, 1] } : {}}
        transition={{
          duration: 0.6,
          repeat: 0,
        }}
        onAnimationComplete={() => setPlayCompleteAnim(false)}
      >
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Gradiente para el efecto de brillo usando colores del sistema */}
          <defs>
            <linearGradient id={`gradient-${Math.round(progressPercentage)}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={progressColor} stopOpacity="0.8" />
              <stop offset="50%" stopColor={progressColor} stopOpacity="1" />
              <stop offset="100%" stopColor={progressColor} stopOpacity="0.8" />
            </linearGradient>
          </defs>
        {/* Círculo de fondo */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="opacity-30"
        />
        
        {/* Círculo de progreso */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={progressColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{
            duration: 0.8,
            ease: "easeInOut"
          }}
          className="shadow-sm"
        />
        
        {/* Efecto de brillo cuando está completo */}
        {/* {isComplete && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={`url(#gradient-${Math.round(progressPercentage)})`}
            strokeWidth={strokeWidth + 2}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.6, 0] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="blur-sm"
          />
        )} */}
        </svg>
      </motion.div>
      
      {/* Contenido central */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children || (
          <>
            {showPercentage && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-2xl font-bold"
                style={{ color: progressColor }}
              >
                {Math.round(value)}%
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CircularProgress;
