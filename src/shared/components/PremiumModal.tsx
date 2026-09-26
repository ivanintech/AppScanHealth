import { Crown, Check, Sparkles, Zap, TrendingUp, Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Card, CardContent } from '@/shared/components/ui/card';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'upgrade' | 'manage';
}

export const PremiumModal = ({ isOpen, onClose, type }: PremiumModalProps) => {
  const premiumFeatures = [
    {
      icon: <Zap className="w-4 h-4" />,
      title: "Recordatorios ∞"
    },
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Analytics Avanzados"
    },
    {
      icon: <Shield className="w-4 h-4" />,
      title: "Alertas Inteligentes"
    },
    {
      icon: <Sparkles className="w-4 h-4" />,
      title: "IA Personalizada"
    },
    {
      icon: <Crown className="w-4 h-4" />,
      title: "Soporte Prioritario"
    }
  ];

  const plans = [
    {
      name: "Mensual",
      price: "$4.99",
      period: "/mes",
      popular: false
    },
    {
      name: "Anual",
      price: "$39.99",
      period: "/año",
      popular: true,
      savings: "Ahorra 33%"
    }
  ];

  const handleSubscribe = (planType: string) => {
    // In a real app, this would integrate with payment processor
    console.log(`Subscribing to ${planType} plan`);
    // Mock subscription flow
    alert(`Redirigiendo a la suscripción ${planType}...`);
  };

  const handleManageSubscription = () => {
    // In a real app, this would open billing portal
    alert("Redirigiendo al portal de facturación...");
  };

  if (type === 'manage') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5 text-yellow-500" />
              Gestionar Suscripción
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white mb-2">
                PREMIUM ACTIVO
              </Badge>
              <h3 className="font-semibold mb-2">
                Suscripción Anual
              </h3>
              <p className="text-sm text-muted-foreground">
                Próxima renovación: 15 de enero, 2025
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleManageSubscription}
                className="w-full"
              >
                Gestionar Facturación
              </Button>
              
              <Button
                variant="outline"
                onClick={handleManageSubscription}
                className="w-full"
              >
                Cancelar Suscripción
              </Button>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg">
              <h4 className="font-medium mb-2">Tu plan incluye:</h4>
              <ul className="text-sm space-y-1">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-600" />
                    {feature.title}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Crown className="w-5 h-5 text-yellow-500" />
            Actualizar a PRO
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-2">
          <div className="text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Crown className="w-6 h-6 text-white" />
            </div>
            <h3 className="font-semibold text-base mb-1">
              Desbloquea ScanHealth PRO
            </h3>
            <p className="text-xs text-muted-foreground">
              Funciones avanzadas para maximizar tu salud
            </p>
          </div>

          {/* Features - Compact Grid */}
          <div className="grid grid-cols-2 gap-2">
            {premiumFeatures.map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <div className="text-primary">{feature.icon}</div>
                <span className="text-xs font-medium">{feature.title}</span>
              </div>
            ))}
          </div>

          {/* Pricing - Mobile Optimized */}
          <div className="space-y-2">
            <h4 className="font-medium text-center text-sm">Elige tu plan</h4>
            <div className="space-y-2">
              {plans.map((plan, index) => (
                <Card key={index} className={`relative ${plan.popular ? 'border-primary' : ''}`}>
                  {plan.popular && (
                    <Badge className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 bg-primary text-xs">
                      MÁS POPULAR
                    </Badge>
                  )}
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h5 className="font-semibold text-sm">{plan.name}</h5>
                        {plan.savings && (
                          <p className="text-xs text-green-600 font-medium">{plan.savings}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{plan.price}</div>
                        <div className="text-xs text-muted-foreground">{plan.period}</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSubscribe(plan.name.toLowerCase())}
                      className="w-full h-10 text-sm"
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      Seleccionar
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground px-2">
            Cancela cuando quieras. Sin compromisos.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
