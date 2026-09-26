import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { 
  ChevronRight, 
  Layers, 
  Heart, 
  Brain, 
  Dumbbell, 
  Shield, 
  Leaf, 
  Zap, 
  Moon, 
  Sun, 
  Pill, 
  Activity,
  Sparkles,
  Target,
  Flame
} from 'lucide-react';

interface CategoryCardProps {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  iconUrl?: string;
  color?: string;
  onClick: () => void;
  onSubcategoriesClick?: () => void;
  isSubcategory?: boolean;
  parentCategoryName?: string;
  hasSubcategories?: boolean;
  subcategoryCount?: number;
  countLabel?: string;
}

// Función para obtener icono y color basado en el nombre de la categoría
const getCategoryIconAndColor = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  
  // Mapeo de categorías a iconos y colores
  const categoryMap: Record<string, { icon: React.ComponentType<any>, color: string, bgColor: string }> = {
    // Vitaminas y Minerales
    'vitaminas': { icon: Sun, color: '#F59E0B', bgColor: '#FEF3C7' },
    'vitamin': { icon: Sun, color: '#F59E0B', bgColor: '#FEF3C7' },
    'minerales': { icon: Zap, color: '#8B5CF6', bgColor: '#EDE9FE' },
    'mineral': { icon: Zap, color: '#8B5CF6', bgColor: '#EDE9FE' },
    
    // Salud Cardiovascular
    'cardiovascular': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
    'corazón': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
    'heart': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
    'circulación': { icon: Heart, color: '#EF4444', bgColor: '#FEE2E2' },
    
    // Salud Mental y Cognitiva
    'mental': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    'cognitivo': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    'cerebro': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    'brain': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    'memoria': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    'concentración': { icon: Brain, color: '#3B82F6', bgColor: '#DBEAFE' },
    
    // Deportes y Fitness
    'deportes': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'fitness': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'deporte': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'musculación': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'proteína': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'protein': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'creatina': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    'creatine': { icon: Dumbbell, color: '#10B981', bgColor: '#D1FAE5' },
    
    // Sistema Inmune
    'inmune': { icon: Shield, color: '#06B6D4', bgColor: '#CFFAFE' },
    'inmunidad': { icon: Shield, color: '#06B6D4', bgColor: '#CFFAFE' },
    'immune': { icon: Shield, color: '#06B6D4', bgColor: '#CFFAFE' },
    'defensas': { icon: Shield, color: '#06B6D4', bgColor: '#CFFAFE' },
    
    // Natural y Orgánico
    'natural': { icon: Leaf, color: '#22C55E', bgColor: '#DCFCE7' },
    'orgánico': { icon: Leaf, color: '#22C55E', bgColor: '#DCFCE7' },
    'organic': { icon: Leaf, color: '#22C55E', bgColor: '#DCFCE7' },
    'plantas': { icon: Leaf, color: '#22C55E', bgColor: '#DCFCE7' },
    'herbal': { icon: Leaf, color: '#22C55E', bgColor: '#DCFCE7' },
    
    // Energía y Vitalidad
    'energía': { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
    'energy': { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
    'vitalidad': { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
    'vitality': { icon: Zap, color: '#F59E0B', bgColor: '#FEF3C7' },
    
    // Sueño y Relajación
    'sueño': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    'sleep': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    'relajación': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    'relax': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    'melatonina': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    'melatonin': { icon: Moon, color: '#6366F1', bgColor: '#E0E7FF' },
    
    // Digestión
    'digestión': { icon: Activity, color: '#8B5CF6', bgColor: '#EDE9FE' },
    'digestivo': { icon: Activity, color: '#8B5CF6', bgColor: '#EDE9FE' },
    'digestive': { icon: Activity, color: '#8B5CF6', bgColor: '#EDE9FE' },
    'probióticos': { icon: Activity, color: '#8B5CF6', bgColor: '#EDE9FE' },
    'probiotics': { icon: Activity, color: '#8B5CF6', bgColor: '#EDE9FE' },
    
    // Belleza y Piel
    'belleza': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'piel': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'beauty': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'skin': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'colágeno': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    'collagen': { icon: Sparkles, color: '#EC4899', bgColor: '#FCE7F3' },
    
    // Pérdida de Peso
    'peso': { icon: Target, color: '#F97316', bgColor: '#FED7AA' },
    'weight': { icon: Target, color: '#F97316', bgColor: '#FED7AA' },
    'adelgazar': { icon: Target, color: '#F97316', bgColor: '#FED7AA' },
    'quemar': { icon: Flame, color: '#F97316', bgColor: '#FED7AA' },
    'burn': { icon: Flame, color: '#F97316', bgColor: '#FED7AA' },
    
    // Antioxidantes
    'antioxidante': { icon: Shield, color: '#059669', bgColor: '#D1FAE5' },
    'antioxidant': { icon: Shield, color: '#059669', bgColor: '#D1FAE5' },
    
    // Omega y Grasas
    'omega': { icon: Heart, color: '#0EA5E9', bgColor: '#E0F2FE' },
    'grasas': { icon: Heart, color: '#0EA5E9', bgColor: '#E0F2FE' },
    'fat': { icon: Heart, color: '#0EA5E9', bgColor: '#E0F2FE' },
  };
  
  // Buscar coincidencia exacta primero
  for (const [key, value] of Object.entries(categoryMap)) {
    if (name.includes(key)) {
      return value;
    }
  }
  
  // Si no hay coincidencia, usar icono por defecto
  return { 
    icon: Pill, 
    color: '#6B7280', 
    bgColor: '#F3F4F6' 
  };
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  description,
  iconUrl,
  color = '#3B82F6',
  onClick,
  onSubcategoriesClick,
  isSubcategory = false,
  parentCategoryName,
  hasSubcategories = false,
  subcategoryCount = 0,
  countLabel = 'subcategorías'
}) => {
  // Obtener icono y color basado en el nombre de la categoría
  const { icon: CategoryIcon, color: iconColor, bgColor } = getCategoryIconAndColor(name);
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={(e) => {
        console.log('🔍 [CategoryCard] onClick triggered for:', name);
        onClick();
      }}
      className="cursor-pointer"
    >
      <Card className="h-full border-0 shadow-sm hover:shadow-md transition-all duration-200 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: bgColor }}
            >
              {iconUrl ? (
                <img 
                  src={iconUrl} 
                  alt={name}
                  className="w-6 h-6"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <CategoryIcon 
                className={`w-6 h-6 ${iconUrl ? 'hidden' : ''}`} 
                style={{ color: iconColor }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground text-sm leading-tight">
                  {name}
                </h3>
                {isSubcategory && parentCategoryName && (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {parentCategoryName}
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground text-xs leading-relaxed mb-2 line-clamp-2">
                {description || 'Categoría de suplementos especializados'}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  
                  {/* Indicador de subcategorías/suplementos - solo visual */}
                  {(hasSubcategories || (isSubcategory && subcategoryCount !== undefined)) && (
                    <div className="flex items-center gap-1">
                      <Badge 
                        variant="secondary" 
                        className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200"
                      >
                        <Layers className="w-3 h-3 mr-1" />
                        {subcategoryCount > 0
                          ? `${subcategoryCount} ${subcategoryCount === 1
                              ? countLabel.replace(/s$/, '')
                              : countLabel}`
                          : `No tiene ${countLabel}`}
                      </Badge>
                    </div>
                  )}
                </div>
                
                {/* Una sola acción clara */}
                <div 
                  className="text-xs text-primary hover:text-primary/80 cursor-pointer transition-colors flex items-center gap-1 font-medium"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (hasSubcategories && onSubcategoriesClick) {
                      console.log('🔍 [CategoryCard] "Explorar" clicked for:', name);
                      onSubcategoriesClick();
                    } else {
                      console.log('🔍 [CategoryCard] "Ver detalles" clicked for:', name);
                      onClick();
                    }
                  }}
                >
                  {hasSubcategories ? 'Explorar' : 'Ver detalles'}
                  <ChevronRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
