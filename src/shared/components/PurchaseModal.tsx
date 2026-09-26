import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';
import { 
  ShoppingCart, 
  ExternalLink, 
  Star, 
  Euro, 
  Shield, 
  Truck,
  X,
  RefreshCw
} from 'lucide-react';

interface PurchaseOption {
  name: string;
  url: string;
  logo: string;
  description: string;
  isAvailable: boolean;
  price?: string;
  rating?: number;
}

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  options: PurchaseOption[];
  loading: boolean;
  error: string | null;
  productName: string;
  onRefetch: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({
  isOpen,
  onClose,
  options,
  loading,
  error,
  productName,
  onRefetch
}) => {
  const handlePurchase = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            <ShoppingCart className="w-6 h-6 text-primary" />
            Opciones de Compra
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Encuentra {productName} en las mejores tiendas online
          </p>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                      <div className="w-24 h-10 bg-gray-200 rounded"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-6 text-center">
                <div className="text-red-600 mb-4">
                  <Shield className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-semibold">Error al cargar opciones</p>
                  <p className="text-sm text-red-500">{error}</p>
                </div>
                <Button onClick={onRefetch} variant="outline" size="sm">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {options.map((option, index) => (
                <motion.div
                  key={option.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`transition-all duration-200 hover:shadow-md ${
                    option.isAvailable ? 'border-green-200 hover:border-green-300' : 'border-gray-200 opacity-60'
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* Logo */}
                        <div className="text-3xl">{option.logo}</div>
                        
                        {/* Información */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-foreground">{option.name}</h3>
                            {option.rating && (
                              <div className="flex items-center gap-1">
                                {getRatingStars(option.rating)}
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({option.rating})
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {option.description}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            {option.price && (
                              <div className="flex items-center gap-1">
                                <Euro className="w-3 h-3" />
                                <span>{option.price}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Truck className="w-3 h-3" />
                              <span>Envío disponible</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Botón de compra */}
                        <div className="flex flex-col gap-2">
                          {option.isAvailable ? (
                            <Button
                              onClick={() => handlePurchase(option.url)}
                              className="flex items-center gap-2"
                              size="sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Comprar
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              No disponible
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Footer con información adicional */}
        <div className="pt-4 border-t border-muted/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>
              Todos los enlaces son seguros y redirigen a tiendas verificadas
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
