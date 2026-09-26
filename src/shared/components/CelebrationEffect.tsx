import React, { useState, useEffect, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface CompletionState {
  supplementName: string;
  count: number;
}

interface CelebrationEffectProps {
  completionState: CompletionState | null;
  onComplete?: () => void;
}

export const CelebrationEffect = memo(({ 
  completionState, 
  onComplete, 
}: CelebrationEffectProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [lastCompletionId, setLastCompletionId] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (completionState && completionState.count !== lastCompletionId) {
      setLastCompletionId(completionState.count);
      setIsVisible(true);
      
      // Standard celebration - more festive!
      const colors = ['#10b981', '#f59e0b', '#ffffff', '#34d399'];
      
      // Explosion effect
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: colors,
        shapes: ['star', 'circle', 'square'],
        scalar: 1.2,
        drift: 0,
        gravity: 1,
      });
      
      // Second burst for more impact
      setTimeout(() => {
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.8, x: 0.2 },
          colors: colors,
          shapes: ['star'],
          scalar: 0.8
        });
        confetti({
          particleCount: 50,
          spread: 120,
          origin: { y: 0.8, x: 0.8 },
          colors: colors,
          shapes: ['star'],
          scalar: 0.8
        });
      }, 150);
      
      // Hide after animation
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      timerRef.current = setTimeout(() => {
        setIsVisible(false);
        // Call onComplete after a small delay to ensure animation completes
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 100);
      }, 2000);
    }
  }, [completionState?.count, onComplete, lastCompletionId]);

  // Clean up when completionState becomes null
  useEffect(() => {
    if (!completionState) {
      setIsVisible(false);
    }
  }, [completionState]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return (
    <AnimatePresence>
      {isVisible && completionState && (
        <motion.div
          key={completionState.count} // Use count as key to force re-render on new completion
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/90 backdrop-blur-md rounded-2xl p-6 shadow-2xl border border-white/20"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 0.6,
                ease: "easeInOut"
              }}
              className="text-center"
            >
              <div className="text-4xl mb-2">
                ✨
              </div>
              <p className="font-heading font-semibold text-lg text-foreground">
                ¡{completionState.supplementName} completado!
              </p>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
