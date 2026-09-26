import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
}

export const useNetworkStatus = (): NetworkStatus => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSlowConnection, setIsSlowConnection] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check connection speed
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    
    if (connection) {
      const checkConnectionSpeed = () => {
        const effectiveType = connection.effectiveType;
        setIsSlowConnection(effectiveType === 'slow-2g' || effectiveType === '2g');
      };

      checkConnectionSpeed();
      connection.addEventListener('change', checkConnectionSpeed);

      return () => {
        connection.removeEventListener('change', checkConnectionSpeed);
      };
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isSlowConnection };
};

export const NetworkStatusIndicator = () => {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    if (!isOnline || isSlowConnection) {
      setShowIndicator(true);
    } else {
      // Hide after a delay when back online
      const timer = setTimeout(() => setShowIndicator(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, isSlowConnection]);

  if (!showIndicator) return null;

  return (
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -50, opacity: 0 }}
      className={`fixed top-16 left-4 right-4 z-50 p-3 rounded-lg shadow-lg text-center text-sm font-medium ${
        !isOnline 
          ? 'bg-destructive text-destructive-foreground' 
          : 'bg-amber-500 text-white'
      }`}
    >
      {!isOnline 
        ? '📡 Sin conexión - Usando modo offline' 
        : '🐌 Conexión lenta detectada'}
    </motion.div>
  );
};
