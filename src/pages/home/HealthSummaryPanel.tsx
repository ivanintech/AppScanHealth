import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { 
  Heart, 
  Brain, 
  Shield, 
  Leaf, 
  Activity, 
  Eye, 
  RotateCcw, 
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Pill,
  Search
} from 'lucide-react';
import { AdvisoryService } from '../../shared/components/recommendations/AdvisoryService';
import { UserProfile } from '@/shared/lib/recommendation/types';
import { supabase } from '@/shared/supabase/client';

interface HealthSummaryPanelProps {
  userProfile: UserProfile | null;
  onViewDetails: () => void;
  onRestartOnboarding: () => void;
}

export const HealthSummaryPanel: React.FC<HealthSummaryPanelProps> = React.memo(({
  userProfile,
  onViewDetails,
  onRestartOnboarding
}) => {
  const navigate = useNavigate();
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [advisoryService] = useState(() => AdvisoryService.getInstance());

  useEffect(() => {
    
    const loadSummaryData = async () => {
      // Si no hay userProfile, intentar obtener datos de la base de datos
      if (!userProfile) {
        // No userProfile from props, trying to get from database
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            console.log("✅ User authenticated, fetching profile from database...");
            
            // Pequeño delay para asegurar que la operación de upsert haya terminado
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log("⏳ Delay completed, fetching fresh data...");
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('checkup_results, updated_at')
              .eq('id', user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile:', error);
              setLoading(false);
              return;
            }
            
            if (profile?.checkup_results) {
              console.log("✅ Profile data found in database:", profile.checkup_results);
              console.log("📅 Profile updated_at:", profile.updated_at);
              
              // Siempre buscar datos frescos del análisis, no usar caché
              console.log("🔄 Buscando datos frescos del análisis de salud...");
              
              // Usar los datos de la base de datos como userProfile
              const dbUserProfile = profile.checkup_results as any;
              await processUserProfile(dbUserProfile);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching profile from database:', error);
        }
        
        // No userProfile available
        setLoading(false);
        return;
      }

      // userProfile found, loading summary data
      await processUserProfile(userProfile);
    };

    const processUserProfile = async (profile: any) => {
      try {
        setLoading(true);
        
        // Solo mostrar datos existentes, NO generar nuevos análisis
        
        // Obtener datos existentes del perfil sin ejecutar análisis
        const existingData = await advisoryService.getExistingHealthData(profile);
        
        if (existingData) {
          console.log('✅ Datos de análisis encontrados:', existingData);
          setSummaryData(existingData);
        } else {
          console.log('❌ No se encontraron datos de análisis, usando fallback');
          setSummaryData(null);
        }

        // Los datos ya vienen procesados desde getExistingHealthData

      } catch (error) {
        console.error('❌ Error cargando resumen de salud:', error);
        const fallbackData = {
          overallHealthScore: 75,
          criticalAreas: 0,
          strengths: 2,
          totalAreas: 6,
          topInsights: [],
          planPhase: 'Optimización',
          planDuration: '2-3 meses',
          topSupplements: [],
          lifestyleTips: []
        };
        console.log("🔄 Using fallback data:", fallbackData);
        setSummaryData(fallbackData);
      } finally {
        // Loading completed
        setLoading(false);
      }
    };

    loadSummaryData();
  }, [userProfile, advisoryService]);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summaryData) {
    return (
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No hay datos de salud disponibles</p>
          <Button 
            onClick={onRestartOnboarding}
            variant="outline" 
            className="mt-4"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Completar Onboarding
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 60) return <TrendingUp className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  // Función para navegar al stack con búsqueda automática
  const handleSupplementSearch = (supplementName: string) => {
    // Navegar al stack con el término de búsqueda en la URL
    navigate(`/stack?search=${encodeURIComponent(supplementName)}`);
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Heart className="w-5 h-5 text-primary" />
              Resumen de Salud
            </CardTitle>
            <Badge 
              variant={summaryData.overallHealthScore >= 80 ? "default" : summaryData.overallHealthScore >= 60 ? "secondary" : "destructive"}
              className="text-sm"
            >
              {summaryData.overallHealthScore}%
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Score y Estado General - Informativo basado en datos reales */}
          <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {getScoreIcon(summaryData.overallHealthScore)}
                <div>
                  <p className="font-semibold text-sm text-foreground">Estado General</p>
                  <p className="text-xs text-muted-foreground">
                    {userProfile?.age} años, {userProfile?.gender === 'male' ? 'hombre' : userProfile?.gender === 'female' ? 'mujer' : 'persona'} • {userProfile?.activity_level} actividad
                  </p>
                </div>
              </div>
              <div className={`text-xl font-bold ${getScoreColor(summaryData.overallHealthScore)}`}>
                {summaryData.overallHealthScore}%
              </div>
            </div>
            
            {/* Análisis personalizado basado en el perfil */}
            <div className="space-y-2">
              {/* Información específica del perfil */}
              <div className="p-2 bg-white/50 rounded border-l-4 border-primary/30">
                <p className="text-xs text-foreground font-medium mb-1">
                  {userProfile?.onboarding_data?.stressLevel === 'high' || userProfile?.onboarding_data?.stressLevel === 'very_high' 
                    ? "⚠️ Tu nivel de estrés alto puede estar afectando tu salud general. Los suplementos adaptógenos son prioritarios."
                    : userProfile?.onboarding_data?.sleepQuality === 'poor' || userProfile?.onboarding_data?.sleepQuality === 'fair'
                    ? "😴 La calidad del sueño puede optimizarse. Considera magnesio y melatonina."
                    : userProfile?.onboarding_data?.exerciseHours === '0-1' || userProfile?.onboarding_data?.exerciseHours === '1-3'
                    ? "🏃 Tu nivel de actividad es bajo. Los antioxidantes y omega-3 son clave para compensar."
                    : userProfile?.diet_type === 'vegan' || userProfile?.diet_type === 'vegetarian'
                    ? "🌱 Tu dieta plant-based requiere atención especial a B12, hierro y zinc."
                    : userProfile?.age && userProfile.age > 50
                    ? "👴 A partir de los 50, la absorción de nutrientes disminuye. Los suplementos son más importantes."
                    : "📊 Tu perfil muestra un balance general. Pequeños ajustes pueden optimizar tu salud."
                  }
                </p>
              </div>
              
              {/* Resumen de fortalezas y mejoras */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-medium">{summaryData.strengths} fortalezas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-orange-700 font-medium">{summaryData.totalAreas - summaryData.strengths} mejoras</span>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  {summaryData.overallHealthScore >= 80 
                    ? "🎉 Excelente"
                    : summaryData.overallHealthScore >= 60 
                    ? "📈 Bueno"
                    : "⚠️ Atención"
                  }
                </div>
              </div>
            </div>
          </div>

          {/* Suplementos Recomendados - Formato de tarjetas como completar suplementación */}
          {summaryData.topSupplements.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-foreground text-sm">Suplementos Recomendados</h4>
                <Badge variant="outline" className="text-xs">
                  {summaryData.topSupplements.length} suplementos
                </Badge>
              </div>
              <div className="space-y-2">
                {summaryData.topSupplements.slice(0, 3).map((supplement: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-card rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Pill className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-foreground truncate">{supplement.name}</p>
                        <p className="text-xs text-muted-foreground">{supplement.priority}</p>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-xs px-3 py-1 h-7"
                      onClick={() => handleSupplementSearch(supplement.name)}
                    >
                      <Search className="w-3 h-3 mr-1" />
                      Buscar
                    </Button>
                  </div>
                ))}
                {summaryData.topSupplements.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-1">
                    +{summaryData.topSupplements.length - 3} suplementos más
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Insights Críticos - Comprimido pero Informativo */}
          {summaryData.topInsights.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-purple-600" />
                <h4 className="font-semibold text-foreground text-sm">Lo que debes saber</h4>
              </div>
              <div className="space-y-2">
                {summaryData.topInsights.slice(0, 2).map((insight: any, index: number) => (
                  <div key={index} className={`p-3 rounded-lg border-l-4 ${
                    insight.score < 60 
                      ? 'bg-red-50 border-red-400' 
                      : insight.score < 80 
                      ? 'bg-yellow-50 border-yellow-400'
                      : 'bg-green-50 border-green-400'
                  }`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {insight.score < 60 ? (
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                        ) : insight.score < 80 ? (
                          <TrendingUp className="w-3 h-3 text-yellow-600" />
                        ) : (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        )}
                        <span className="font-medium text-sm text-foreground">{insight.category}</span>
                        {insight.score < 60 && (
                          <Badge variant="outline" className="text-xs bg-red-100 text-red-700 border-red-300">
                            Crítico
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        variant={insight.score < 60 ? "destructive" : insight.score < 80 ? "secondary" : "default"}
                        className="text-xs"
                      >
                        {insight.score}%
                      </Badge>
                    </div>
                    {/* Información explicativa y útil */}
                    <div className="mt-2 space-y-1">
                      {insight.insights && insight.insights.length > 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {insight.insights[0]}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? `✅ Excelente estado en ${insight.category.toLowerCase()}. Mantén tus buenos hábitos.`
                            : insight.score >= 60 
                            ? `📈 Hay oportunidades de mejora en ${insight.category.toLowerCase()}. Pequeños cambios pueden tener gran impacto.`
                            : `⚠️ ${insight.category} requiere atención. Considera consultar con un profesional de la salud.`
                          }
                        </p>
                      )}
                      
                      {/* Información específica basada en datos del onboarding */}
                      {insight.category === 'Deficiencias Nutricionales' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Tu perfil nutricional está bien balanceado. Continúa con tu dieta actual."
                            : insight.score >= 60 
                            ? `Algunos nutrientes podrían optimizarse. ${userProfile?.diet_type === 'vegan' || userProfile?.diet_type === 'vegetarian' ? 'Tu dieta plant-based requiere atención especial a B12, hierro y zinc.' : 'Los suplementos recomendados te ayudarán.'}`
                            : `Hay deficiencias importantes que requieren atención. ${userProfile?.onboarding_data?.exerciseHours === '0-1' || userProfile?.onboarding_data?.exerciseHours === '1-3' ? 'Tu bajo nivel de actividad aumenta el riesgo de deficiencias.' : 'Los suplementos son prioritarios.'}`
                          }
                        </div>
                      )}
                      
                      {insight.category === 'Objetivos de Salud' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Estás en el camino correcto hacia tus objetivos. Mantén la consistencia."
                            : insight.score >= 60 
                            ? `Buen progreso hacia tus objetivos. ${userProfile?.onboarding_data?.stressLevel === 'high' || userProfile?.onboarding_data?.stressLevel === 'very_high' ? 'El estrés puede estar afectando tu progreso.' : 'Algunos ajustes pueden acelerar los resultados.'}`
                            : `Necesitas un enfoque más específico para alcanzar tus objetivos. ${userProfile?.onboarding_data?.sleepQuality === 'poor' || userProfile?.onboarding_data?.sleepQuality === 'fair' ? 'La calidad del sueño es fundamental para tus objetivos.' : 'Revisa tu plan.'}`
                          }
                        </div>
                      )}
                      
                      {insight.category === 'Sistema Cardiovascular' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Excelente salud cardiovascular. Continúa con tu rutina de ejercicio."
                            : insight.score >= 60 
                            ? `Tu corazón está en buen estado. ${userProfile?.onboarding_data?.exerciseHours === '0-1' || userProfile?.onboarding_data?.exerciseHours === '1-3' ? 'Aumentar tu actividad física mejorará tu salud cardiovascular.' : 'Optimiza tu ejercicio y nutrición.'}`
                            : `Tu sistema cardiovascular necesita atención. ${userProfile?.onboarding_data?.smokingHabit === 'regular' || userProfile?.onboarding_data?.smokingHabit === 'occasional' ? 'El tabaquismo está afectando tu salud cardiovascular.' : 'Consulta con un cardiólogo.'}`
                          }
                        </div>
                      )}
                      
                      {insight.category === 'Función Cognitiva' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Tu función cognitiva está excelente. Mantén la actividad mental."
                            : insight.score >= 60 
                            ? `Buena función cognitiva. ${userProfile?.onboarding_data?.stressLevel === 'high' || userProfile?.onboarding_data?.stressLevel === 'very_high' ? 'El estrés crónico puede afectar tu función cognitiva.' : 'Algunos nutrientes pueden potenciar tu cerebro.'}`
                            : `Tu función cognitiva necesita apoyo. ${userProfile?.onboarding_data?.sleepQuality === 'poor' || userProfile?.onboarding_data?.sleepQuality === 'fair' ? 'La calidad del sueño es crucial para la función cognitiva.' : 'Los suplementos neuroprotectores son clave.'}`
                          }
                        </div>
                      )}
                      
                      {insight.category === 'Sistema Inmunológico' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Tu sistema inmunológico está fuerte. Mantén tus hábitos saludables."
                            : insight.score >= 60 
                            ? `Tu sistema inmunológico está bien. ${userProfile?.onboarding_data?.stressLevel === 'high' || userProfile?.onboarding_data?.stressLevel === 'very_high' ? 'El estrés crónico debilita tu sistema inmunológico.' : 'Algunos nutrientes pueden fortalecerlo.'}`
                            : `Tu sistema inmunológico necesita apoyo. ${userProfile?.onboarding_data?.sleepQuality === 'poor' || userProfile?.onboarding_data?.sleepQuality === 'fair' ? 'El sueño de calidad es fundamental para tu inmunidad.' : 'Los suplementos inmunológicos son prioritarios.'}`
                          }
                        </div>
                      )}
                      
                      {insight.category === 'Salud Digestiva' && (
                        <div className="text-xs text-muted-foreground">
                          {insight.score >= 80 
                            ? "Tu salud digestiva está excelente. Continúa con tu dieta actual."
                            : insight.score >= 60 
                            ? `Tu salud digestiva está bien. ${userProfile?.diet_type === 'vegan' || userProfile?.diet_type === 'vegetarian' ? 'Tu dieta plant-based puede beneficiarse de probióticos.' : 'Algunos ajustes en tu dieta pueden mejorarla.'}`
                            : `Tu salud digestiva necesita atención. ${userProfile?.onboarding_data?.bowelMovements === 'irregular' || userProfile?.onboarding_data?.bowelMovements === 'constipation' ? 'Los problemas intestinales requieren atención inmediata.' : 'Los probióticos y fibra son prioritarios.'}`
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones Personalizadas - Basadas en datos reales del onboarding */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h4 className="font-semibold text-foreground text-sm">Acciones Personalizadas</h4>
            </div>
            <div className="space-y-2">
              {/* Generar consejos específicos basados en el perfil */}
              {(() => {
                const personalizedTips = [];
                
                // Consejo basado en estrés
                if (userProfile?.onboarding_data?.stressLevel === 'high' || userProfile?.onboarding_data?.stressLevel === 'very_high') {
                  personalizedTips.push({
                    tip: "Incorpora técnicas de mindfulness en tu rutina diaria para prevenir acumulación de estrés",
                    category: "Gestión del Estrés",
                    priority: "Alta"
                  });
                }
                
                // Consejo basado en sueño
                if (userProfile?.onboarding_data?.sleepQuality === 'poor' || userProfile?.onboarding_data?.sleepQuality === 'fair') {
                  personalizedTips.push({
                    tip: "Optimiza tu rutina de sueño con horarios regulares y ambiente relajante",
                    category: "Calidad del Sueño",
                    priority: "Alta"
                  });
                }
                
                // Consejo basado en actividad física
                if (userProfile?.onboarding_data?.exerciseHours === '0-1' || userProfile?.onboarding_data?.exerciseHours === '1-3') {
                  personalizedTips.push({
                    tip: "Aumenta gradualmente tu actividad física para mejorar tu salud general",
                    category: "Actividad Física",
                    priority: "Media"
                  });
                }
                
                // Consejo basado en dieta
                if (userProfile?.diet_type === 'vegan' || userProfile?.diet_type === 'vegetarian') {
                  personalizedTips.push({
                    tip: "Asegúrate de obtener suficientes proteínas completas y vitamina B12",
                    category: "Nutrición",
                    priority: "Alta"
                  });
                }
                
                // Consejo basado en edad
                if (userProfile?.age && userProfile.age > 50) {
                  personalizedTips.push({
                    tip: "Prioriza la salud ósea con calcio, vitamina D y ejercicio de resistencia",
                    category: "Salud Ósea",
                    priority: "Alta"
                  });
                }
                
                // Consejo basado en exposición solar
                if (userProfile?.onboarding_data?.sunExposure === 'low') {
                  personalizedTips.push({
                    tip: "Aumenta tu exposición solar segura o considera suplementos de vitamina D",
                    category: "Vitamina D",
                    priority: "Media"
                  });
                }
                
                // Usar consejos del sistema si están disponibles, sino usar los personalizados
                const tipsToShow = summaryData.lifestyleTips.length > 0 
                  ? summaryData.lifestyleTips.slice(0, 2)
                  : personalizedTips.slice(0, 2);
                
                return tipsToShow.map((tip: any, index: number) => (
                  <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start gap-2">
                      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-blue-900 font-medium">{tip.tip}</p>
                        {tip.category && (
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                              {tip.category}
                            </Badge>
                            {tip.priority && (
                              <Badge variant="outline" className={`text-xs ${
                                tip.priority === 'Alta' 
                                  ? 'bg-red-100 text-red-700 border-red-300' 
                                  : tip.priority === 'Media'
                                  ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                  : 'bg-green-100 text-green-700 border-green-300'
                              }`}>
                                {tip.priority}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* Botón de Acción Principal */}
          <div className="pt-3 border-t">
            <Button 
              onClick={onViewDetails}
              className="w-full"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              Ver Análisis Completo
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
});
