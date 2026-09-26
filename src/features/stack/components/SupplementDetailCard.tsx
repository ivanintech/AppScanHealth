import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Pill, Clock, Leaf, Shield, Info, Share2, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { Supplement } from '@/features/stack/hooks/useSupplements';

interface SupplementDetailCardProps {
  supplement: Supplement;
  onBack: () => void;
  onShare: () => void;
  onMore: () => void;
}

const getHealthGoalColor = (goal: string) => {
  switch (goal.toLowerCase()) {
    case 'fuerza muscular': return 'bg-red-100 text-red-800';
    case 'rendimiento': return 'bg-orange-100 text-orange-800';
    case 'recuperación': return 'bg-blue-100 text-blue-800';
    case 'salud cardiovascular': return 'bg-green-100 text-green-800';
    case 'inmunidad': return 'bg-yellow-100 text-yellow-800';
    case 'salud ósea': return 'bg-purple-100 text-purple-800';
    case 'piel': return 'bg-pink-100 text-pink-800';
    case 'energía': return 'bg-teal-100 text-teal-800';
    case 'relajación': return 'bg-indigo-100 text-indigo-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const SupplementDetailCard: React.FC<SupplementDetailCardProps> = ({
  supplement,
  onBack,
  onShare,
  onMore,
}) => {
  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 bg-background z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-background/90 backdrop-blur-sm z-10 p-4 flex items-center justify-between border-b">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold truncate max-w-[60%]">{supplement.name}</h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={onShare}>
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onMore}>
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Image and Basic Info */}
          <div className="flex flex-col items-center mb-6">
            <img
              src={supplement.image_url || "/placeholder.svg"}
              alt={supplement.name}
              className="w-48 h-48 object-contain rounded-lg mb-4 shadow-lg"
            />
            <h2 className="text-2xl font-bold text-foreground text-center mb-2">{supplement.name}</h2>
            <p className="text-muted-foreground text-center mb-4">{supplement.brand}</p>
            <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-4">{supplement.description}</p>
          </div>

          <Separator className="my-6" />

          {/* Health Goals */}
          {supplement.health_goals && supplement.health_goals.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Objetivos de Salud</h3>
              <div className="flex flex-wrap gap-2">
                {supplement.health_goals.map((goal, index) => (
                  <Badge key={index} className={`${getHealthGoalColor(goal)} px-3 py-1 text-xs font-medium`}>
                    {goal}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator className="my-6" />

          {/* Key Considerations */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Consideraciones Clave</h3>
            <div className="space-y-3">
              {supplement.momento_recomendado && (
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Momento Recomendado:</p>
                    <p className="text-sm text-muted-foreground">{supplement.momento_recomendado}</p>
                  </div>
                </div>
              )}
              {supplement.impacto_ayuno && (
                <div className="flex items-start space-x-3">
                  <Leaf className="h-5 w-5 text-green-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Impacto en Ayuno:</p>
                    <p className="text-sm text-muted-foreground">{supplement.impacto_ayuno}</p>
                  </div>
                </div>
              )}
              {supplement.efectos_secundarios && (
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-red-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Efectos Secundarios:</p>
                    <p className="text-sm text-muted-foreground">{supplement.efectos_secundarios}</p>
                  </div>
                </div>
              )}
              {supplement.interacciones && (
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-1" />
                  <div>
                    <p className="font-medium text-foreground">Interacciones:</p>
                    <p className="text-sm text-muted-foreground">{supplement.interacciones}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Usage Instructions */}
          {supplement.usage_instructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Instrucciones de Uso</h3>
              <p className="text-sm text-muted-foreground">{supplement.usage_instructions}</p>
            </div>
          )}

          {/* Storage Instructions */}
          {supplement.storage_instructions && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">Instrucciones de Almacenamiento</h3>
              <p className="text-sm text-muted-foreground">{supplement.storage_instructions}</p>
            </div>
          )}

          <Separator className="my-6" />

          {/* Important Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-center">
              <Info className="h-5 w-5 text-yellow-600 mr-3" />
              <p className="font-medium text-yellow-800 dark:text-yellow-200">Aviso Importante</p>
            </div>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
              La información proporcionada es solo para fines educativos y no sustituye el consejo médico profesional. Consulta siempre a un profesional de la salud antes de iniciar cualquier suplemento.
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
