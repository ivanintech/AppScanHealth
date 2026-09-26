import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

export const PullToRefresh = ({ 
  onRefresh, 
  children, 
  threshold = 80 
}: PullToRefreshProps) => {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let startY = 0;
    let currentY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (window.scrollY === 0 && startY > 0) {
        currentY = e.touches[0].clientY;
        const distance = Math.max(0, currentY - startY);
        
        if (distance > 10) {
          e.preventDefault();
          setIsPulling(true);
          setPullDistance(Math.min(distance, threshold * 1.5));
        }
      }
    };

    const handleTouchEnd = async () => {
      if (isPulling && pullDistance >= threshold) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      }
      
      setIsPulling(false);
      setPullDistance(0);
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, pullDistance, threshold, onRefresh]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div className="relative">
      {/* Pull to refresh indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 flex justify-center items-center z-50"
        initial={{ y: -60, opacity: 0 }}
        animate={{ 
          y: isPulling || isRefreshing ? pullDistance - 60 : -60,
          opacity: isPulling || isRefreshing ? 1 : 0
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-background/90 backdrop-blur-md rounded-full p-3 shadow-lg border border-border/50">
          <motion.div
            animate={{ 
              rotate: isRefreshing ? 360 : refreshProgress * 180,
              scale: refreshProgress
            }}
            transition={{ 
              rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : { duration: 0.2 },
              scale: { duration: 0.2 }
            }}
          >
            <RefreshCw className={`w-5 h-5 ${refreshProgress >= 1 ? 'text-primary' : 'text-muted-foreground'}`} />
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={{ 
          y: isPulling ? Math.min(pullDistance * 0.5, threshold * 0.5) : 0 
        }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.div>
    </div>
  );
};
