import { motion } from "framer-motion";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Clock, Users, Star } from "lucide-react";
import * as Icons from "lucide-react";
import { Protocol } from "@/shared/types/protocols";

interface ProtocolCardProps {
  protocol: Protocol;
  onClick: () => void;
}

export const ProtocolCard = ({ protocol, onClick }: ProtocolCardProps) => {
  const Icon = Icons[protocol.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> || Icons.BookOpen;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Principiante':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermedio':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Avanzado':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Descanso y Recuperación':
        return 'from-purple-500 to-purple-700';
      case 'Fitness y Músculo':
        return 'from-blue-500 to-blue-700';
      case 'Salud y Bienestar':
        return 'from-green-500 to-green-700';
      default:
        return 'from-gray-500 to-gray-700';
    }
  };

  const getProtocolRating = (protocol: Protocol) => {
    // Rating base por categoría
    const categoryRatings: { [key: string]: number } = {
      'Descanso y Recuperación': 4.3,
      'Fitness y Músculo': 4.5,
      'Salud y Bienestar': 4.1,
      'Longevidad': 4.4,
      'Cognición': 4.2,
      'Sueño': 4.6,
      'Energía': 4.3,
      'Digestión': 3.9,
      'Inmunidad': 4.0,
      'Hormonal': 4.2
    };

    // Ajuste por dificultad
    const difficultyAdjustment: { [key: string]: number } = {
      'Principiante': 0.2,
      'Intermedio': 0.0,
      'Avanzado': -0.1
    };

    // Ajuste por duración (protocolos más largos tienden a tener mejor rating)
    const durationAdjustment = protocol.duration.includes('meses') ? 0.1 : 0.0;

    const baseRating = categoryRatings[protocol.category] || 4.0;
    const adjustment = difficultyAdjustment[protocol.difficulty] || 0.0;
    const finalRating = baseRating + adjustment + durationAdjustment;

    // Redondear a 1 decimal y asegurar que esté entre 3.0 y 5.0
    return Math.max(3.0, Math.min(5.0, Math.round(finalRating * 10) / 10));
  };

  const gradientClass = getCategoryColor(protocol.category);

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className="relative overflow-hidden rounded-xl cursor-pointer group bg-card border border-border/50 shadow-sm hover:shadow-md transition-all duration-200"
      onClick={onClick}
    >
      {/* Imagen de fondo con overlay mejorado */}
      <div className="relative h-28 w-full">
        <img 
          src={protocol.coverImage} 
          alt={protocol.title} 
          className="w-full h-full object-cover"
        />
        {/* Overlay con gradiente más sutil */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
        
        {/* Contenido superpuesto en la imagen */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          {/* Categoría e icono */}
          <div className="flex items-center gap-1.5 mb-1">
            <Icon className="w-3.5 h-3.5" />
            <p className="text-xs font-medium opacity-90">{protocol.category}</p>
          </div>
          
          {/* Título */}
          <h3 className="text-base font-bold group-hover:text-primary/90 transition-colors line-clamp-1">
            {protocol.title}
          </h3>
        </div>
      </div>
      
      {/* Contenido en fondo de tarjeta */}
      <div className="p-4 bg-card">
        {/* Descripción */}
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2 leading-relaxed">
          {protocol.description}
        </p>
        
        {/* Badges y info en una fila más compacta */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge className={`${getDifficultyColor(protocol.difficulty)} text-xs px-2 py-0.5`}>
              {protocol.difficulty}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className="line-clamp-1">{protocol.duration}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            <span>{protocol.supplements.length}</span>
          </div>
        </div>
        
        {/* Rating y acción */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => {
                const rating = getProtocolRating(protocol);
                const filledStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                
                return (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${
                      i < filledStars 
                        ? 'text-yellow-400 fill-current' 
                        : i === filledStars && hasHalfStar
                        ? 'text-yellow-400 fill-current opacity-50'
                        : 'text-muted-foreground/30'
                    }`} 
                  />
                );
              })}
            </div>
            <span className="text-xs text-muted-foreground font-medium">{getProtocolRating(protocol)}</span>
          </div>
          
          {/* Indicador de acción */}
          <div className="text-xs text-primary font-medium group-hover:text-primary/80 transition-colors">
            Ver protocolo →
          </div>
        </div>
      </div>
    </motion.div>
  );
};
