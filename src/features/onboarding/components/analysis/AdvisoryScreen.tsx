import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/shared/supabase/client';
import { 
  Heart, 
  Brain, 
  Shield, 
  Sun, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  ArrowRight,
  Star,
  TrendingUp,
  Leaf,
  Zap,
  Target,
  Users,
  Clock,
  Award,
  BookOpen,
  BarChart3,
  Loader2,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  MapPin,
  Dumbbell,
  Coffee,
  Moon,
  Sun as SunIcon,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { AdvisoryService } from '@/shared/components/recommendations/AdvisoryService';
import { UserProfile } from '@/shared/lib/recommendation/types';
import { useNavigate } from 'react-router-dom';

interface AdvisoryScreenProps {
  onContinue: () => void;
  onBack: () => void;
  userProfile?: UserProfile;
  onReloadRandomData?: () => void;
}

export const AdvisoryScreen = ({ onContinue, onBack, userProfile, onReloadRandomData }: AdvisoryScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [healthInsights, setHealthInsights] = useState<any[]>([]);
  const [personalizedPlan, setPersonalizedPlan] = useState<any>(null);
  const [lifestyleTips, setLifestyleTips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDataSaved, setIsDataSaved] = useState(false);
  const [isProfileSummaryExpanded, setIsProfileSummaryExpanded] = useState(false);
  const navigate = useNavigate();

  const advisoryService = AdvisoryService.getInstance();

  // Función para generar resumen de datos del usuario
  const generateUserProfileSummary = (profile: UserProfile) => {
    const summary = [];
    
    // Datos básicos
    if (profile.age) summary.push({ icon: Calendar, label: 'Edad', value: `${profile.age} años` });
    if (profile.gender) {
      const genderText = profile.gender === 'male' ? 'Hombre' : profile.gender === 'female' ? 'Mujer' : 'Otro';
      summary.push({ icon: User, label: 'Género', value: genderText });
    }
    
    // Objetivos de salud
    if (profile.health_goals && profile.health_goals.length > 0) {
      const goalsText = profile.health_goals.join(', ');
      summary.push({ icon: Target, label: 'Objetivos de salud', value: goalsText });
    }
    
    // Nivel de actividad
    if (profile.activity_level) {
      const activityText = profile.activity_level === 'low' ? 'Bajo' : 
                          profile.activity_level === 'medium' ? 'Medio' : 'Alto';
      summary.push({ icon: Dumbbell, label: 'Nivel de actividad', value: activityText });
    }
    
    // Datos del onboarding
    if (profile.onboarding_data) {
      const onboarding = profile.onboarding_data;
      
      // Estrés
      if (onboarding.stressLevel) {
        const stressText = onboarding.stressLevel === 'low' ? 'Bajo' :
                          onboarding.stressLevel === 'medium' ? 'Medio' :
                          onboarding.stressLevel === 'high' ? 'Alto' : 'Muy alto';
        summary.push({ icon: Heart, label: 'Nivel de estrés', value: stressText });
      }
      
      // Calidad del sueño
      if (onboarding.sleepQuality) {
        const sleepText = onboarding.sleepQuality === 'poor' ? 'Mala' :
                         onboarding.sleepQuality === 'fair' ? 'Regular' :
                         onboarding.sleepQuality === 'good' ? 'Buena' : 'Excelente';
        summary.push({ icon: Moon, label: 'Calidad del sueño', value: sleepText });
      }
      
      // Exposición solar
      if (onboarding.sunExposure) {
        const sunText = onboarding.sunExposure === 'low' ? 'Baja' :
                       onboarding.sunExposure === 'medium' ? 'Media' : 'Alta';
        summary.push({ icon: SunIcon, label: 'Exposición solar', value: sunText });
      }
      
      // Tipo de ejercicio
      if (onboarding.exerciseType) {
        const exerciseText = onboarding.exerciseType === 'cardio' ? 'Cardio' :
                            onboarding.exerciseType === 'strength' ? 'Fuerza' :
                            onboarding.exerciseType === 'yoga' ? 'Yoga' :
                            onboarding.exerciseType === 'mixed' ? 'Mixto' : onboarding.exerciseType;
        summary.push({ icon: Activity, label: 'Tipo de ejercicio', value: exerciseText });
      }
      
      // Horas de ejercicio
      if (onboarding.exerciseHours) {
        summary.push({ icon: Clock, label: 'Horas de ejercicio/semana', value: onboarding.exerciseHours });
      }
      
      // Consumo de cafeína
      if (onboarding.caffeineConsumption) {
        const caffeineText = onboarding.caffeineConsumption === 'none' ? 'Ninguno' :
                            onboarding.caffeineConsumption === 'low' ? 'Bajo' :
                            onboarding.caffeineConsumption === 'moderate' ? 'Moderado' : 'Alto';
        summary.push({ icon: Coffee, label: 'Consumo de cafeína', value: caffeineText });
      }
      
      // Consumo de pescado
      if (onboarding.fishConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de pescado/semana', value: `${onboarding.fishConsumption} veces` });
      }
      
      // Consumo de verduras
      if (onboarding.vegetableConsumption !== undefined) {
        summary.push({ icon: Leaf, label: 'Consumo de verduras/día', value: `${onboarding.vegetableConsumption} porciones` });
      }
      
      // Tipo de dieta (desde UserProfile, no OnboardingData)
      if (profile.diet_type) {
        const dietText = profile.diet_type === 'balanced' ? 'Equilibrada' :
                        profile.diet_type === 'mediterranean' ? 'Mediterránea' :
                        profile.diet_type === 'vegan' ? 'Vegana' :
                        profile.diet_type === 'vegetarian' ? 'Vegetariana' : profile.diet_type;
        summary.push({ icon: Leaf, label: 'Tipo de dieta', value: dietText });
      }
      
      // Hábitos de fumar
      if (onboarding.smokingHabit) {
        const smokingText = onboarding.smokingHabit === 'never' ? 'Nunca' :
                           onboarding.smokingHabit === 'occasional' ? 'Ocasional' : 'Regular';
        summary.push({ icon: AlertTriangle, label: 'Hábito de fumar', value: smokingText });
      }
      
      // Consumo de alcohol
      if (onboarding.alcoholConsumption) {
        const alcoholText = onboarding.alcoholConsumption === 'never' ? 'Nunca' :
                           onboarding.alcoholConsumption === 'occasional' ? 'Ocasional' :
                           onboarding.alcoholConsumption === 'moderate' ? 'Moderado' : 'Alto';
        summary.push({ icon: Coffee, label: 'Consumo de alcohol', value: alcoholText });
      }
      
      // Consumo de carne
      if (onboarding.meatConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de carne/semana', value: `${onboarding.meatConsumption} veces` });
      }
      
      // Consumo de huevos
      if (onboarding.eggConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de huevos/semana', value: `${onboarding.eggConsumption} veces` });
      }
      
      // Consumo de frutos secos
      if (onboarding.nutsConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de frutos secos/semana', value: `${onboarding.nutsConsumption} veces` });
      }
      
      // Consumo de lácteos
      if (onboarding.dairyConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de lácteos/semana', value: `${onboarding.dairyConsumption} veces` });
      }
      
      // Consumo de frutas
      if (onboarding.fruitConsumption !== undefined) {
        summary.push({ icon: Leaf, label: 'Consumo de frutas/día', value: `${onboarding.fruitConsumption} porciones` });
      }
      
      // Consumo de legumbres
      if (onboarding.legumeConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de legumbres/semana', value: `${onboarding.legumeConsumption} veces` });
      }
      
      // Consumo de patatas
      if (onboarding.potatoConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de patatas/semana', value: `${onboarding.potatoConsumption} veces` });
      }
      
      // Consumo de cereales integrales
      if (onboarding.wholegrainConsumption !== undefined) {
        summary.push({ icon: Activity, label: 'Consumo de cereales integrales/semana', value: `${onboarding.wholegrainConsumption} veces` });
      }
      
      // Uso de antibióticos
      if (onboarding.antibioticsUse) {
        const antibioticsText = onboarding.antibioticsUse === 'never' ? 'Nunca' :
                               onboarding.antibioticsUse === 'rare' ? 'Raramente' :
                               onboarding.antibioticsUse === 'occasional' ? 'Ocasionalmente' : 'Frecuentemente';
        summary.push({ icon: AlertTriangle, label: 'Uso de antibióticos', value: antibioticsText });
      }
      
      // Movimientos intestinales
      if (onboarding.bowelMovements) {
        const bowelText = onboarding.bowelMovements === 'irregular' ? 'Irregulares' :
                         onboarding.bowelMovements === 'regular' ? 'Regulares' : 'Constipación';
        summary.push({ icon: Activity, label: 'Movimientos intestinales', value: bowelText });
      }
      
      // Horario de sueño
      if (onboarding.sleepSchedule && onboarding.sleepSchedule.bedtime && onboarding.sleepSchedule.wakeTime) {
        summary.push({ icon: Clock, label: 'Horario de sueño', value: `${onboarding.sleepSchedule.bedtime} - ${onboarding.sleepSchedule.wakeTime}` });
      }
      
      // Tipo de trabajo
      if (onboarding.workType) {
        const workText = onboarding.workType === 'office' ? 'Oficina' :
                        onboarding.workType === 'physical' ? 'Físico' :
                        onboarding.workType === 'remote' ? 'Remoto' : onboarding.workType;
        summary.push({ icon: Activity, label: 'Tipo de trabajo', value: workText });
      }
      
      // Ambiente de trabajo
      if (onboarding.environment) {
        const envText = onboarding.environment === 'indoor' ? 'Interior' :
                        onboarding.environment === 'outdoor' ? 'Exterior' :
                        onboarding.environment === 'mixed' ? 'Mixto' : onboarding.environment;
        summary.push({ icon: SunIcon, label: 'Ambiente de trabajo', value: envText });
      }
      
      // Alergias
      if (onboarding.allergies && onboarding.allergies.length > 0) {
        summary.push({ icon: AlertTriangle, label: 'Alergias', value: onboarding.allergies.join(', ') });
      }
      
      // Condiciones médicas
      if (onboarding.medicalConditions && onboarding.medicalConditions.length > 0) {
        summary.push({ icon: Heart, label: 'Condiciones médicas', value: onboarding.medicalConditions.join(', ') });
      }
      
      // Medicamentos
      if (onboarding.medications && onboarding.medications.length > 0) {
        summary.push({ icon: Activity, label: 'Medicamentos', value: onboarding.medications.join(', ') });
      }
      
      // Síntomas
      if (onboarding.symptoms && onboarding.symptoms.length > 0) {
        summary.push({ icon: AlertTriangle, label: 'Síntomas', value: onboarding.symptoms.join(', ') });
      }
      
      // Cirugías recientes
      if (onboarding.recentSurgeries) {
        summary.push({ icon: Activity, label: 'Cirugías recientes', value: onboarding.recentSurgeries });
      }
      
      // Medicamentos para el corazón
      if (onboarding.heartMedications) {
        summary.push({ icon: Heart, label: 'Medicamentos cardíacos', value: onboarding.heartMedications });
      }
      
      // Problemas intestinales
      if (onboarding.intestinalIssues) {
        summary.push({ icon: Activity, label: 'Problemas intestinales', value: onboarding.intestinalIssues });
      }
      
      // Historial familiar
      if (onboarding.familyHistory && onboarding.familyHistory.length > 0) {
        summary.push({ icon: User, label: 'Historial familiar', value: onboarding.familyHistory.join(', ') });
      }
      
      // Deficiencias familiares
      if (onboarding.familyDeficiencies) {
        summary.push({ icon: AlertTriangle, label: 'Deficiencias familiares', value: onboarding.familyDeficiencies });
      }
      
      // Trabajo por turnos
      if (onboarding.shiftWork) {
        const shiftText = onboarding.shiftWork === 'yes' ? 'Sí' : 'No';
        summary.push({ icon: Clock, label: 'Trabajo por turnos', value: shiftText });
      }
      
      // Exposición a contaminantes
      if (onboarding.pollutantExposure) {
        const pollutantText = onboarding.pollutantExposure === 'low' ? 'Baja' :
                             onboarding.pollutantExposure === 'medium' ? 'Media' : 'Alta';
        summary.push({ icon: AlertTriangle, label: 'Exposición a contaminantes', value: pollutantText });
      }
      
      // Ayuno intermitente
      if (onboarding.intermittentFasting) {
        const fastingText = onboarding.intermittentFasting === 'yes' ? 'Sí' : 'No';
        summary.push({ icon: Clock, label: 'Ayuno intermitente', value: fastingText });
      }
    }
    
    return summary;
  };

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const checkAuthentication = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuthentication();
  }, []);

  // Guardar datos del onboarding si el usuario no está autenticado
  useEffect(() => {
    console.log('🔄 AdvisoryScreen useEffect - saveOnboardingData');
    console.log('🔄 isAuthenticated:', isAuthenticated);
    console.log('🔄 userProfile:', userProfile ? 'present' : 'null');
    console.log('🔄 isDataSaved:', isDataSaved);
    
    const saveOnboardingData = async () => {
      if (userProfile) {
        console.log('✅ userProfile presente, verificando método de guardado...');
        try {
          // Verificar si el usuario está autenticado
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Usuario autenticado - SIEMPRE guardar en base de datos
            console.log('💾 Usuario autenticado, guardando en base de datos...');
            const onboardingData = {
              ...userProfile,
              timestamp: new Date().toISOString(),
              isTemporary: false
            };
            
            console.log('💾 Guardando en profiles.checkup_results...');
            const { error } = await supabase
              .from('profiles')
              .upsert({
                id: user.id,
                checkup_results: onboardingData as any,
                updated_at: new Date().toISOString()
              });
            
            if (error) {
              console.error('❌ Error guardando en base de datos:', error);
            } else {
              console.log('✅ Datos guardados en base de datos exitosamente');
              // Limpiar localStorage si existía
              localStorage.removeItem('temporary_onboarding_data');
              console.log('🧹 localStorage temporal limpiado');
            }
          } else {
            // Usuario no autenticado - guardar en localStorage
            console.log('💾 Usuario no autenticado, guardando en localStorage...');
            const onboardingData = {
              ...userProfile,
              timestamp: new Date().toISOString(),
              isTemporary: true
            };
            localStorage.setItem('temporary_onboarding_data', JSON.stringify(onboardingData));
            console.log('✅ localStorage.setItem ejecutado');
          }
          
          setIsDataSaved(true);
          console.log('📝 Datos del onboarding guardados');
        } catch (error) {
          console.error('Error guardando datos del onboarding:', error);
        }
      } else {
        console.log('❌ No userProfile disponible');
      }
    };
    saveOnboardingData();
  }, [isAuthenticated, userProfile, isDataSaved]);

  useEffect(() => {
    const loadAdvisoryData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Crear perfil de usuario básico si no se proporciona
        const profile = userProfile || {
          id: 'temp-user',
          age: 30,
          gender: 'other' as const,
          weight: 70,
          height: 170,
          health_goals: [],
          activity_level: 'medium' as const,
          diet_type: 'balanced',
          health_conditions: [],
          allergies: [],
          onboarding_data: {
            stressLevel: 'medium',
            sleepQuality: 'good',
            sunExposure: 'medium',
            exerciseType: 'mixed',
            exerciseHours: '3-5',
            fishConsumption: 2,
            meatConsumption: 3,
            vegetableConsumption: 4,
            nutsConsumption: 2,
            dairyConsumption: 3,
            fruitConsumption: 3,
            caffeineConsumption: 'moderate',
            antibioticsUse: 'rare',
            bowelMovements: 'regular',
            smokingHabit: 'never',
            alcoholConsumption: 'occasional'
          }
        };

        // Cargar datos reales en paralelo
        const [insights, plan, tips] = await Promise.all([
          advisoryService.generateHealthInsights(profile),
          advisoryService.generatePersonalizedPlan(profile),
          advisoryService.generateLifestyleTips(profile)
        ]);

        setHealthInsights(insights);
        setPersonalizedPlan(plan);
        setLifestyleTips(tips);

      } catch (err) {
        console.error('Error cargando datos del advisory:', err);
        setError('Error al cargar tu plan personalizado. Mostrando datos de ejemplo.');
        
        // Fallback a datos de ejemplo
        setHealthInsights(getFallbackInsights());
        setPersonalizedPlan(getFallbackPlan());
        setLifestyleTips(getFallbackTips());
      } finally {
        setIsLoading(false);
      }
    };

    loadAdvisoryData();
  }, [userProfile]);

  // Funciones de fallback para datos de ejemplo
  const getFallbackInsights = () => [
    {
      category: 'Nutrientes Fundamentales',
      icon: Leaf,
      color: 'green',
      score: 75,
      insights: ['Análisis en progreso'],
      recommendations: ['Consulta con tu médico']
    }
  ];

  const getFallbackPlan = () => ({
    phase: 'Evaluación',
    duration: '1-2 meses',
    focus: 'Evaluación inicial',
    supplements: [
      { name: 'Multivitamínico', priority: 'Media', reason: 'Soporte nutricional general' }
    ]
  });

  const getFallbackTips = () => [
    {
      category: 'Salud General',
      tip: 'Mantén una dieta equilibrada y ejercicio regular',
      icon: Heart,
      impact: 'Medio'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', icon: 'text-green-600' },
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: 'text-blue-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', icon: 'text-purple-600' },
      red: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: 'text-red-600' }
    };
    return colors[color as keyof typeof colors] || colors.green;
  };

  // Mostrar estado de carga
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4 flex items-center justify-center"
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Generando tu Plan Personalizado
          </h2>
          <p className="text-gray-600">
            Analizando tu perfil y generando recomendaciones específicas...
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50 p-4"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tu Plan de Salud Personalizado
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Basado en tu perfil único, hemos creado un plan específico para optimizar tu bienestar y abordar tus necesidades particulares.
          </p>
        </motion.div>

        {/* Resumen de Datos del Usuario */}
        {userProfile && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mb-6"
          >
            <Card className="p-4 bg-gray-50 border-gray-200">
              <Button
                variant="ghost"
                onClick={() => setIsProfileSummaryExpanded(!isProfileSummaryExpanded)}
                className="w-full flex items-center justify-between p-3 hover:bg-gray-100"
              >
                <div className="flex items-center space-x-3">
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="font-medium text-gray-700">
                    Ver datos utilizados para tu análisis
                  </span>
                </div>
                {isProfileSummaryExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-500" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                )}
              </Button>
              
              {isProfileSummaryExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-4 pt-4 border-t border-gray-200"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {generateUserProfileSummary(userProfile).map((item, index) => {
                      const IconComponent = item.icon;
                      return (
                        <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                          <IconComponent className="w-4 h-4 text-gray-500 flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {item.label}
                            </p>
                            <p className="text-sm text-gray-500 truncate">
                              {item.value}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-blue-800">
                        Estos datos fueron utilizados para generar tu plan personalizado. 
                        Cada recomendación está basada en tu perfil específico y patrones de salud identificados.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        )}

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-6"
          >
            <Card className="p-4 bg-yellow-50 border-yellow-200 border-2">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-yellow-800 text-sm">{error}</p>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Plan Overview */}
        {personalizedPlan && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-emerald-50 to-blue-50 border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Fase de {personalizedPlan.phase}</h2>
                  <p className="text-gray-600">Duración: {personalizedPlan.duration}</p>
                </div>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                  <Award className="w-4 h-4 mr-1" />
                  Plan Personalizado
                </Badge>
              </div>
              <p className="text-gray-700">
                {personalizedPlan.focus}
              </p>
            </Card>
          </motion.div>
        )}

        {/* Health Insights */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
            Análisis de tu Perfil de Salud
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {healthInsights.map((insight, index) => {
              const colors = getColorClasses(insight.color);
              return (
                <motion.div
                  key={insight.category}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                >
                  <Card className={`p-6 ${colors.bg} ${colors.border} border-2`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {React.createElement(insight.icon, { className: `w-6 h-6 ${colors.icon}` })}
                        <h3 className={`font-semibold ${colors.text}`}>
                          {insight.category}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${colors.text}`}>
                          {insight.score}%
                        </div>
                        <div className="text-sm text-gray-500">Puntuación</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Insights clave:</h4>
                        <ul className="space-y-1">
                          {insight.insights.map((item, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <Info className="w-4 h-4 mt-0.5 text-gray-400 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Recomendaciones:</h4>
                        <ul className="space-y-1">
                          {insight.recommendations.map((item, i) => (
                            <li key={i} className="flex items-start space-x-2 text-sm text-gray-600">
                              <CheckCircle className="w-4 h-4 mt-0.5 text-emerald-500 flex-shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Personalized Plan */}
        {personalizedPlan && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mb-8"
          >
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
              <div className="flex items-center space-x-3 mb-4">
                <BookOpen className="w-6 h-6 text-purple-600" />
                <h2 className="text-xl font-semibold text-gray-900">Tu Plan de Suplementación</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {personalizedPlan.supplements.map((supplement: any, index: number) => (
                  <motion.div
                    key={supplement.name}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.8 + index * 0.1 }}
                    className="bg-white p-4 rounded-lg border border-purple-200"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{supplement.name}</h3>
                      <Badge 
                        variant={supplement.priority === 'Alta' ? 'destructive' : 'secondary'}
                        className={supplement.priority === 'Alta' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}
                      >
                        {supplement.priority}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600">{supplement.reason}</p>
                  </motion.div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}

        {/* Lifestyle Tips */}
        {lifestyleTips.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Consejos de Estilo de Vida
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lifestyleTips.map((tip: any, index: number) => (
                <motion.div
                  key={tip.category}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 1.0 + index * 0.1 }}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center space-x-3 mb-2">
                    {React.createElement(tip.icon, { className: "w-5 h-5 text-emerald-600" })}
                    <h3 className="font-medium text-gray-900">{tip.category}</h3>
                    <Badge 
                      variant={tip.impact === 'Alto' ? 'destructive' : 'secondary'}
                      className={tip.impact === 'Alto' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}
                    >
                      {tip.impact}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{tip.tip}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}


        {/* Navigation */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          className="flex flex-col gap-4 justify-center"
        >
          
        </motion.div>
      </div>
    </motion.div>
  );
};
