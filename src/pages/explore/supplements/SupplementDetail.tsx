import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Separator } from '@/shared/components/ui/separator';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { supabase } from '@/shared/supabase/client';
import { AdvisoryService } from '@/shared/components/recommendations/AdvisoryService';
import {
  ArrowLeft,
  Share2,
  MoreHorizontal,
  Clock,
  Calendar,
  AlertTriangle,
  MessageCircle,
  Info,
  ExternalLink,
  Pill,
  Heart,
  Brain,
  Dumbbell,
  Shield,
  Leaf,
  Zap,
  Moon,
  Sun,
  Activity,
  Sparkles,
  Target,
  Flame,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";

interface Category {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  parent_category_id?: string[] | string | null;
  sort_order?: number;
  health_goals?: string;
  considerations?: string;
  usage_instructions?: string;
  recommended_time?: string;
  impact?: string;
  side_effects?: string;
  interactions?: string;
  search_keywords?: string;
  target_audience?: string;
}

interface CategoryDetailCardProps {
  category: Category;
  onBack: () => void;
  onShare: () => void;
  onMore: () => void;
}

interface StoredFeedback {
  id: string;
  userId: string;
  supplementId: string;
  supplementName: string;
  isUseful: boolean;
  utilityScore: number;
  personalizedReasons: string[];
  warnings: string[];
  confidence: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

const getHealthGoalColor = (goal: string) => {
  const goalLower = goal.toLowerCase();
  if (goalLower.includes('fuerza') || goalLower.includes('muscular')) return 'bg-red-100 text-red-800';
  if (goalLower.includes('energía') || goalLower.includes('energia')) return 'bg-yellow-100 text-yellow-800';
  if (goalLower.includes('recuperación') || goalLower.includes('recuperacion')) return 'bg-blue-100 text-blue-800';
  if (goalLower.includes('salud') || goalLower.includes('bienestar')) return 'bg-green-100 text-green-800';
  if (goalLower.includes('inmunidad') || goalLower.includes('defensas')) return 'bg-purple-100 text-purple-800';
  if (goalLower.includes('cardiovascular') || goalLower.includes('corazón')) return 'bg-pink-100 text-pink-800';
  if (goalLower.includes('ósea') || goalLower.includes('osea') || goalLower.includes('articular')) return 'bg-indigo-100 text-indigo-800';
  if (goalLower.includes('piel') || goalLower.includes('cabello')) return 'bg-teal-100 text-teal-800';
  if (goalLower.includes('relajación') || goalLower.includes('relajacion') || goalLower.includes('sueño')) return 'bg-gray-100 text-gray-800';
  return 'bg-gray-100 text-gray-800';
};

const parseHealthGoals = (healthGoals?: string): string[] => {
  if (!healthGoals) return [];

  // Si es un string, intentar dividirlo por comas o puntos
  if (typeof healthGoals === 'string') {
    return healthGoals
      .split(/[,;.]/)
      .map(goal => goal.trim())
      .filter(goal => goal.length > 0)
      .slice(0, 3); // Máximo 3 badges
  }

  return [];
};

const parseConsiderations = (considerations?: string | string[]): string[] => {
  if (!considerations) return [];

  // Si ya es un array, devolverlo directamente
  if (Array.isArray(considerations)) {
    return considerations.slice(0, 3);
  }

  // Si es string, dividir por puntos o saltos de línea
  if (typeof considerations === 'string') {
    return considerations
      .split(/[.\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 3); // Máximo 3 puntos
  }

  return [];
};

const parseUsageInstructions = (usageInstructions?: string): string => {
  if (!usageInstructions) return '';

  // Limpiar y formatear las instrucciones
  return usageInstructions.trim();
};

const parseTargetAudience = (targetAudience?: string | string[]): string[] => {
  if (!targetAudience) return [];

  // Si ya es un array, devolverlo directamente
  if (Array.isArray(targetAudience)) {
    return targetAudience.slice(0, 3);
  }

  // Si es string, dividir por puntos, comas o saltos de línea
  if (typeof targetAudience === 'string') {
    return targetAudience
      .split(/[.,;\n]/)
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 3); // Máximo 3 puntos
  }

  return [];
};

// Función para obtener icono de respaldo basado en el nombre de la categoría
const getFallbackIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  const iconMap: Record<string, React.ComponentType<any>> = {
    'vitamina': Sun,
    'vitamin': Sun,
    'mineral': Shield,
    'proteína': Dumbbell,
    'protein': Dumbbell,
    'omega': Heart,
    'magnesio': Zap,
    'magnesium': Zap,
    'calcio': Shield,
    'calcium': Shield,
    'hierro': Flame,
    'iron': Flame,
    'zinc': Shield,
    'selenio': Sparkles,
    'selenium': Sparkles,
    'colágeno': Leaf,
    'collagen': Leaf,
    'melatonina': Moon,
    'melatonin': Moon,
    'cafeína': Zap,
    'caffeine': Zap,
    'creatina': Dumbbell,
    'creatine': Dumbbell,
    'bcaa': Activity,
    'amino': Activity,
    'prebiótico': Heart,
    'prebiotic': Heart,
    'probiótico': Heart,
    'probiotic': Heart,
    'antioxidante': Sparkles,
    'antioxidant': Sparkles,
    'energía': Zap,
    'energy': Zap,
    'sueño': Moon,
    'sleep': Moon,
    'cognición': Brain,
    'cognition': Brain,
    'inmune': Shield,
    'immune': Shield,
    'digestivo': Heart,
    'digestive': Heart,
    'articular': Target,
    'joint': Target,
    'piel': Sparkles,
    'skin': Sparkles,
    'cabello': Sparkles,
    'hair': Sparkles
  };

  for (const [key, Icon] of Object.entries(iconMap)) {
    if (name.includes(key)) {
      return Icon;
    }
  }

  return Pill; // Icono por defecto
};

// Función para generar URL de Examine.com basada en el nombre de la categoría
const generateExamineUrl = (categoryName: string): string => {
  // Convertir el nombre a formato URL-friendly
  const urlFriendlyName = categoryName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim();

  return `https://examine.com/supplements/${urlFriendlyName}/`;
};

export const SupplementDetail: React.FC<CategoryDetailCardProps> = ({
  category,
  onBack,
  onShare,
  onMore,
}) => {
  const healthGoals = parseHealthGoals(category.health_goals);
  const considerations = parseConsiderations(category.considerations);
  const usageInstructions = parseUsageInstructions(category.usage_instructions);
  const targetAudience = parseTargetAudience(category.target_audience);
  const [imageError, setImageError] = React.useState(false);
  const FallbackIcon = getFallbackIcon(category.name);
  const examineUrl = generateExamineUrl(category.name);

  // Estados para el panel de utilidad
  const [userId, setUserId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<StoredFeedback | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const advisoryService = AdvisoryService.getInstance();

  const handleImageError = () => {
    setImageError(true);
  };

  // Cargar usuario y feedback al montar el componente
  useEffect(() => {
    const loadUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadFeedback();
      }
    };
    loadUser();
  }, []);

  // Cargar feedback cuando cambie el usuario o la categoría
  useEffect(() => {
    if (userId && category.id) {
      loadFeedback();
    }
  }, [userId, category.id]);

  // Funciones para el panel de utilidad
  const loadFeedback = async () => {
    if (!userId || !category.id) return;
    
    try {
      setFeedbackLoading(true);
      console.log('🔍 Cargando feedback para suplemento ID:', category.id, 'usuario:', userId);
      
      // Buscar feedback existente por ID de la categoría
      const { data: existingFeedback, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement')
        .ilike('title', `%${category.name}%`)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error buscando feedback existente:', error);
      }
      
      if (existingFeedback) {
        console.log('✅ Feedback existente encontrado:', existingFeedback);
        const content = existingFeedback.content as any;
        setFeedback({
          id: existingFeedback.id,
          userId: existingFeedback.user_id,
          supplementId: content.supplementId,
          supplementName: existingFeedback.title,
          isUseful: content.isUseful,
          utilityScore: content.utilityScore,
          personalizedReasons: content.personalizedReasons,
          warnings: content.warnings,
          confidence: existingFeedback.confidence_score,
          status: existingFeedback.status as 'pending' | 'accepted' | 'rejected' | 'expired',
          createdAt: new Date(existingFeedback.created_at),
        });
      } else {
        console.log('❌ No hay feedback existente, generando nuevo...');
        await generateNewFeedback();
      }
    } catch (err) {
      setFeedbackError('Error cargando feedback del suplemento');
      console.error('Error loading feedback:', err);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const generateNewFeedback = async () => {
    if (!userId || !category.id) return;
    
    try {
      console.log('🔬 Generando nuevo feedback personalizado para suplemento ID:', category.id);
      
      // Obtener el perfil del usuario desde la base de datos
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError || !profileData) {
        console.error('Error obteniendo perfil del usuario:', profileError);
        return;
      }
      
      // Usar el AdvisoryService para generar feedback personalizado basado en predicciones reales
      const personalizedFeedback = await advisoryService.generatePersonalizedSupplementFeedback(
        profileData,
        category.name,
        0.5 // utilityScore inicial, será calculado por el método
      );
      
      console.log('🎯 Feedback personalizado generado:', personalizedFeedback);
      
      // Obtener predicciones reales para determinar utilidad
      const predictions = await advisoryService.getRealDataPredictions(category.name, profileData);
      console.log('📊 Predicciones reales:', predictions);
      
      // Determinar si es útil basado en las predicciones reales
      const isUseful = predictions.overallPrediction > 0.6; // Umbral más estricto
      const utilityScore = Math.round(predictions.overallPrediction * 100) / 100; // Usar predicción real
      
      console.log(`🎯 Utilidad calculada: ${utilityScore} (${isUseful ? 'Útil' : 'No útil'})`);
      
      const newFeedback = {
        user_id: userId,
        recommendation_type: 'supplement',
        title: `Utilidad de ${category.name}`,
        content: {
          category: category.name,
          categoryId: category.id,
          supplementId: category.id,
          supplementName: category.name,
          isUseful: isUseful,
          utilityScore: utilityScore,
          personalizedReasons: personalizedFeedback.personalizedReasons,
          warnings: personalizedFeedback.warnings,
          recommendedTiming: personalizedFeedback.recommendedTiming,
          recommendedDosage: personalizedFeedback.recommendedDosage,
          interactions: personalizedFeedback.interactions,
          riskLevel: 'low',
          priority: 5,
          confidence: 0.95
        },
        confidence_score: 0.95,
        status: 'pending',
        priority: 5,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
      };
      
      // Guardar el feedback en la base de datos
      const { data: savedFeedback, error } = await supabase
        .from('ai_recommendations')
        .insert(newFeedback)
        .select()
        .single();
      
      if (error) {
        console.error('Error guardando feedback:', error);
        return;
      }
      
      console.log('✅ Feedback personalizado generado y guardado:', savedFeedback);
      
      // Actualizar el estado local
      const content = savedFeedback.content as any;
      setFeedback({
        id: savedFeedback.id,
        userId: savedFeedback.user_id,
        supplementId: content.supplementId,
        supplementName: savedFeedback.title,
        isUseful: content.isUseful,
        utilityScore: content.utilityScore,
        personalizedReasons: content.personalizedReasons,
        warnings: content.warnings,
        confidence: savedFeedback.confidence_score,
        status: savedFeedback.status as 'pending' | 'accepted' | 'rejected' | 'expired',
        createdAt: new Date(savedFeedback.created_at),
      });
    } catch (error) {
      console.error('Error generando nuevo feedback:', error);
    }
  };


  // Funciones auxiliares para el panel
  const getUtilityColor = (score: number) => {
    // Convertir score de 0-1 a porcentaje 0-100
    const percentage = score * 100;
    
    // Sistema de colores más granular
    if (percentage >= 90) return 'bg-emerald-100 text-emerald-800 border-emerald-200'; // Verde esmeralda para excelente
    if (percentage >= 80) return 'bg-green-100 text-green-800 border-green-200';     // Verde para muy bueno
    if (percentage >= 70) return 'bg-lime-100 text-lime-800 border-lime-200';      // Lima para bueno
    if (percentage >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200'; // Amarillo para regular
    if (percentage >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';   // Ámbar para aceptable
    if (percentage >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'; // Naranja para bajo
    if (percentage >= 30) return 'bg-red-100 text-red-800 border-red-200';          // Rojo para malo
    return 'bg-red-200 text-red-900 border-red-300';                                // Rojo intenso para muy malo
  };

  const getUtilityIcon = (isUseful: boolean, score: number) => {
    // Convertir score de 0-1 a porcentaje 0-100
    const percentage = score * 100;
    
    // Iconos más granulares basados en el porcentaje
    if (percentage >= 90) return <CheckCircle className="h-5 w-5 text-emerald-600" />; // Excelente
    if (percentage >= 80) return <CheckCircle className="h-5 w-5 text-green-600" />;  // Muy bueno
    if (percentage >= 70) return <CheckCircle className="h-5 w-5 text-lime-600" />;   // Bueno
    if (percentage >= 60) return <CheckCircle className="h-5 w-5 text-yellow-600" />; // Regular
    if (percentage >= 50) return <CheckCircle className="h-5 w-5 text-amber-600" />;  // Aceptable
    if (percentage >= 40) return <XCircle className="h-5 w-5 text-orange-600" />;     // Bajo
    if (percentage >= 30) return <XCircle className="h-5 w-5 text-red-600" />;        // Malo
    return <XCircle className="h-5 w-5 text-red-700" />;                               // Muy malo
  };

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: '0%' }}
      exit={{ x: '100%' }}
      transition={{ type: 'tween', duration: 0.3 }}
      className="fixed inset-0 bg-white z-50 overflow-y-auto"
    >
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <div className="sticky top-0 bg-white/90 backdrop-blur-sm z-10 p-4 flex items-center justify-between border-b border-gray-200">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="text-gray-600 hover:bg-gray-100 transition-colors"
            title="Volver a categorías"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[60%]">
            {category.name}
          </h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={onShare} className="text-gray-600">
              <Share2 className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onMore} className="text-gray-600">
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Image and Basic Info */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-48 h-48 bg-gray-100 rounded-lg mb-4 shadow-lg flex items-center justify-center">
              {category.icon_url && !imageError ? (
                <img
                  src={category.icon_url}
                  alt={category.name}
                  className="w-full h-full object-contain rounded-lg"
                  onError={handleImageError}
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <FallbackIcon className="w-12 h-12 text-blue-600" />
                </div>
              )}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
              {category.name}
            </h2>
            {category.description && (
              <p className="text-center text-sm text-gray-600 mb-4">
                {category.description}
              </p>
            )}

            {/* Enlace a Examine.com */}
            <Button
              variant="outline"
              size="sm"
              className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              onClick={() => window.open(examineUrl, '_blank', 'noopener,noreferrer')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver más en Examine.com
            </Button>
          </div>


          <div className="mb-6">
            {/* <h3 className="text-lg font-semibold text-gray-900 mb-3">Información Detallada</h3> */}
            <div className="space-y-4">

              {/* Beneficios */}
              {healthGoals.length > 0 && (
                <Card className="mb-2">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-green-600" />
                    </div>
                    <CardTitle className="text-base">Beneficios</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 text-sm text-gray-600">
                      {JSON.parse(category.health_goals || "[]")
                        .slice(0, 3)
                        .map((goal: string, index: number) => (
                          <li key={index}>{goal.trim()}</li>
                        ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Considerations */}
              {considerations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Consideraciones</h3>
                  <div className="space-y-3">
                    {considerations.map((consideration, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                        </div>
                        <p className="text-sm text-gray-700">{consideration}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Momento Recomendado */}
              {category.recommended_time && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Momento Recomendado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {category.recommended_time}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Impacto en el Ayuno */}
              {category.impact && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Calendar className="w-5 h-5 text-orange-600" />
                      Impacto en el Ayuno
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {category.impact}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Efectos Secundarios */}
              {category.side_effects && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                      Efectos Secundarios
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="pl-6 list-disc space-y-1 text-sm text-muted-foreground">
                      {(() => {
                        if (typeof category.side_effects === "string") {
                          return category.side_effects.split(". ").map((item, idx) => {
                            const text = item.trim();
                            return text ? <li key={idx}>{text}</li> : null;
                          });
                        } else if (Array.isArray(category.side_effects)) {
                          return (category.side_effects as string[]).map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ));
                        }
                        return null;
                      })()}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Interacciones */}
              {category.interactions && (
                <Card className="mt-4">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <MessageCircle className="w-5 h-5 text-red-600" />
                      Interacciones
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {Array.isArray(category.interactions) ? (
                      <ul className="pl-6 list-disc space-y-1 text-sm text-muted-foreground">
                        {category.interactions.map((interaction, idx) => (
                          <li key={idx}>{interaction}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {category.interactions}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Panel de Utilidad Personalizada */}
              {userId && (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4"
                >
                  <Card className="w-full">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        ¿Te es útil?
                      </CardTitle>
                      {feedback && (
                        <div className="flex items-center gap-2">
                          {getUtilityIcon(feedback.isUseful, feedback.utilityScore)}
                          <Badge 
                            className={`${getUtilityColor(feedback.utilityScore)} font-semibold`}
                          >
                            {Math.round(feedback.utilityScore * 100)}% de utilidad
                          </Badge>
                        </div>
                      )}
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {feedbackLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        </div>
                      ) : feedbackError ? (
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>{feedbackError}</AlertDescription>
                        </Alert>
                      ) : !feedback ? (
                        <div className="text-center py-4">
                          <p className="text-muted-foreground">
                            No tenemos información personalizada sobre este suplemento para ti.
                          </p>
                          <p className="text-sm text-muted-foreground mt-2">
                            Completa tu perfil de salud para recibir recomendaciones personalizadas.
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Razones personalizadas */}
                          {feedback.personalizedReasons.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                Por qué te puede ayudar:
                              </h4>
                              <ul className="space-y-1">
                                {feedback.personalizedReasons.map((reason, index) => (
                                  <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                    <span className="text-green-600 mt-1">•</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Advertencias */}
                          {feedback.warnings.length > 0 && (
                            <div>
                              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-600" />
                                Consideraciones importantes:
                              </h4>
                              <ul className="space-y-1">
                                {feedback.warnings.map((warning, index) => (
                                  <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                                    <span className="text-amber-600 mt-1">⚠</span>
                                    {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Información de confianza */}
                          <div className="text-xs text-muted-foreground pt-2 border-t">
                            <p>Confianza en la recomendación: {Math.round(feedback.confidence * 100)}%</p>
                            <p>Generado el: {new Date(feedback.createdAt).toLocaleDateString()}</p>
                          </div>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>

          {/* Aviso Importante */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg mb-4">
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-3 pt-4 px-6">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-yellow-800">
                  <Info className="w-5 h-5 text-yellow-600" />
                  Aviso Importante
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-6">
                <p className="text-sm text-yellow-700 leading-relaxed mb-2">
                  La información proporcionada es solo para fines educativos y no sustituye el consejo médico profesional. Consulta siempre a un profesional de la salud antes de iniciar cualquier suplemento.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
