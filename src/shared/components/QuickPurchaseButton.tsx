import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { usePurchaseLinks } from '@/features/stack/hooks/usePurchaseLinks';

interface QuickPurchaseButtonProps {
  ean: string;
  productName: string;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'secondary';
}

export const QuickPurchaseButton: React.FC<QuickPurchaseButtonProps> = ({
  ean,
  productName,
  className = '',
  size = 'sm',
  variant = 'outline'
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const { options } = usePurchaseLinks(ean, productName);

  const handleQuickPurchase = async () => {
    if (options.length === 0) return;
    
    setIsLoading(true);
    
    // Simular delay de carga
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Abrir la primera opción disponible
    const availableOption = options.find(option => option.isAvailable);
    if (availableOption) {
      window.open(availableOption.url, '_blank', 'noopener,noreferrer');
    }
    
    setIsLoading(false);
  };

  const availableOptions = options.filter(option => option.isAvailable);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <Button
        variant={variant}
        size={size}
        className={`flex items-center gap-2 ${className}`}
        onClick={handleQuickPurchase}
        disabled={isLoading || availableOptions.length === 0}
      >
        {isLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Buscando...</span>
          </>
        ) : (
          <>
            <ExternalLink className="w-4 h-4" />
            <span>Comprar</span>
          </>
        )}
      </Button>
    </motion.div>
  );
};
