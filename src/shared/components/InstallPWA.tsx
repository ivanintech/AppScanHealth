import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Download, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const InstallPWA = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    // Check if the app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsAppInstalled(true);
      setShowInstallButton(false);
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
      setShowInstallButton(false);
      setIsAppInstalled(true);
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    setDeferredPrompt(null);
  };

  return (
    <AnimatePresence>
      {showInstallButton && !isAppInstalled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className="p-4"
        >
          <Button onClick={handleInstallClick} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Instalar App en tu dispositivo
          </Button>
        </motion.div>
      )}
      {isAppInstalled && (
         <div className="flex items-center justify-center text-sm text-green-600 p-4 bg-green-50 rounded-lg">
            <CheckCircle className="mr-2 h-4 w-4" />
            La aplicación está instalada.
        </div>
      )}
    </AnimatePresence>
  );
};
