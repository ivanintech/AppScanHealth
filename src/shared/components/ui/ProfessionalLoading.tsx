import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ProfessionalLoadingProps {
  title?: string;
  description?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showProgress?: boolean;
  progress?: number;
}

export const ProfessionalLoading: React.FC<ProfessionalLoadingProps> = ({
  title = "Cargando aplicación",
  description = "Preparando tu experiencia personalizada",
  className,
  size = 'lg',
  showProgress = false,
  progress = 0
}) => {
  const sizeClasses = {
    sm: {
      container: "min-h-[200px]",
      spinner: "w-8 h-8",
      title: "text-lg",
      description: "text-sm"
    },
    md: {
      container: "min-h-[300px]",
      spinner: "w-12 h-12",
      title: "text-xl",
      description: "text-base"
    },
    lg: {
      container: "min-h-screen",
      spinner: "w-16 h-16",
      title: "text-2xl",
      description: "text-lg"
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <div className={cn(
      "bg-background flex items-center justify-center",
      currentSize.container,
      className
    )}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-8 max-w-md mx-auto px-6"
      >
        {/* Spinner principal */}
        <div className="relative mx-auto w-fit">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="relative"
          >
            <Loader2 className={cn("text-primary", currentSize.spinner)} />
          </motion.div>
          
          {/* Efecto de brillo */}
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute inset-0"
          >
            <Sparkles className={cn("text-primary/40", currentSize.spinner)} />
          </motion.div>
        </div>
        
        {/* Contenido de texto */}
        <div className="space-y-3">
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={cn("font-semibold text-foreground", currentSize.title)}
          >
            {title}
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={cn("text-muted-foreground", currentSize.description)}
          >
            {description}
          </motion.p>
        </div>
        
        {/* Barra de progreso opcional */}
        {showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs mx-auto"
          >
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="h-full bg-primary rounded-full"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(progress)}% completado
            </p>
          </motion.div>
        )}
        
        {/* Barra de progreso animada por defecto */}
        {!showProgress && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-xs mx-auto"
          >
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeInOut" 
                }}
                className="h-full w-1/3 bg-gradient-to-r from-transparent via-primary to-transparent rounded-full"
              />
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Componente específico para páginas completas
export const LoadingPage: React.FC<Omit<ProfessionalLoadingProps, 'size'>> = (props) => (
  <ProfessionalLoading {...props} size="lg" />
);

// Componente para secciones más pequeñas
export const LoadingSection: React.FC<Omit<ProfessionalLoadingProps, 'size'>> = (props) => (
  <ProfessionalLoading {...props} size="md" />
);

// Componente para elementos pequeños
export const LoadingCard: React.FC<Omit<ProfessionalLoadingProps, 'size'>> = (props) => (
  <ProfessionalLoading {...props} size="sm" />
);

