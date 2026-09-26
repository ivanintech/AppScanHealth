import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Heart,
  Shield,
  Zap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Star,
  Pill,
  FlaskConical,
  BarChart3,
  Users,
  Award,
  ArrowRight,
  Info,
  Plus,
  Minus,
  Clock,
  DollarSign,
  Lightbulb
} from 'lucide-react';

// Importar el motor de recomendaciones
import { RecommendationEngine } from '@/shared/lib/recommendation/core/RecommendationEngine';

interface RecommendationSystemProps {
  userProfile: any;
  nutritionalAnswers: any;
  onComplete?: (recommendations: any) => void;
}

export const RecommendationSystem: React.FC<RecommendationSystemProps> = ({
  userProfile,
  nutritionalAnswers,
  onComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'deficiencies' | 'supplements' | 'plan'>('overview');
  const [recommendationEngine, setRecommendationEngine] = useState<RecommendationEngine | null>(null);

  useEffect(() => {
    initializeRecommendationEngine();
  }, []);

  const initializeRecommendationEngine = async () => {
    try {
      const engine = new RecommendationEngine({
        enableMLModels: true,
        enableDataIntegration: true,
        enableRealTimeLearning: false,
        enablePersonalization: true,
        enableBiomarkerAnalysis: true,
        confidenceThreshold: 0.7,
        maxRecommendations: 20,
      });

      // Intentar cargar modelos persistidos primero
      await engine.initializeWithPersistence();
      setRecommendationEngine(engine);
    } catch (error) {
      console.error('Error inicializando motor de recomendaciones:', error);
    }
  };

  const generateRecommendations = async () => {
    if (!recommendationEngine) return;

    setIsLoading(true);
    
    try {
      // Crear perfil de usuario para el motor de recomendaciones
      const userProfileForML = {
        id: userProfile.id || 'user_' + Date.now(),
        name: userProfile.name,
        age: parseInt(userProfile.age),
        gender: userProfile.gender,
        fitnessLevel: userProfile.fitnessLevel || 'intermediate',
        goals: userProfile.healthGoals || [],
        currentSupplements: nutritionalAnswers.currentSupplements || [],
        healthConditions: nutritionalAnswers.medicalConditions || [],
        preferences: {
          priceRange: userProfile.monthlySpending || 'medium',
          brandPreference: 'natural',
          formPreference: nutritionalAnswers.supplementPreferences?.[0] || 'capsules',
        },
        lifestyle: {
          exerciseFrequency: userProfile.exerciseHours || '2-3 times/week',
          diet: userProfile.dietType || 'balanced',
          sleep: `${nutritionalAnswers.sleepSchedule?.bedtime || '22:00'} - ${nutritionalAnswers.sleepSchedule?.wakeTime || '07:00'}`,
        },
        // Datos nutricionales específicos
        nutritionalData: {
          hasBloodTest: nutritionalAnswers.hasBloodTest,
          bloodTestResults: nutritionalAnswers.bloodTestResults,
          symptoms: nutritionalAnswers.symptoms,
          medicalConditions: nutritionalAnswers.medicalConditions,
          medications: nutritionalAnswers.medications,
          allergies: nutritionalAnswers.allergies,
          workType: nutritionalAnswers.workType,
          environment: nutritionalAnswers.environment,
        }
      };

      // Generar recomendaciones usando el motor ML
      const mlRecommendations = await recommendationEngine.generateRecommendations(userProfileForML);
      
      // Procesar y estructurar las recomendaciones
      const processedRecommendations = {
        overallScore: calculateOverallScore(userProfileForML, nutritionalAnswers),
        deficiencies: analyzeDeficiencies(userProfileForML, nutritionalAnswers),
        strengths: analyzeStrengths(userProfileForML, nutritionalAnswers),
        supplementRecommendations: processSupplementRecommendations(mlRecommendations),
        personalizedPlan: createPersonalizedPlan(mlRecommendations, userProfileForML),
        insights: generateInsights(userProfileForML, nutritionalAnswers),
        timeline: createTimeline(mlRecommendations)
      };

      setRecommendations(processedRecommendations);
      onComplete?.(processedRecommendations);
    } catch (error) {
      console.error('Error generando recomendaciones:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateOverallScore = (profile: any, nutritional: any) => {
    let score = 70; // Base score
    
    // Ajustar basado en síntomas
    if (nutritional.symptoms?.length > 0) {
      score -= nutritional.symptoms.length * 5;
    }
    
    // Ajustar basado en condiciones médicas
    if (nutritional.medicalConditions?.length > 0) {
      score -= nutritional.medicalConditions.length * 3;
    }
    
    // Ajustar basado en análisis de sangre
    if (nutritional.hasBloodTest) {
      score += 10;
    }
    
    // Ajustar basado en ejercicio
    if (profile.lifestyle?.exerciseFrequency?.includes('6-7')) {
      score += 15;
    } else if (profile.lifestyle?.exerciseFrequency?.includes('4-5')) {
      score += 10;
    }
    
    return Math.max(0, Math.min(100, score));
  };

  const analyzeDeficiencies = (profile: any, nutritional: any) => {
    const deficiencies = [];
    
    // Análisis basado en síntomas
    if (nutritional.symptoms?.includes('fatigue')) {
      deficiencies.push({
        nutrient: 'Hierro',
        level: 45,
        status: 'deficient',
        symptoms: ['Fatiga', 'Debilidad'],
        recommendations: ['Suplemento de hierro', 'Alimentos ricos en hierro'],
        priority: 'high'
      });
    }
    
    if (nutritional.symptoms?.includes('muscle_cramps')) {
      deficiencies.push({
        nutrient: 'Magnesio',
        level: 40,
        status: 'deficient',
        symptoms: ['Calambres musculares', 'Ansiedad'],
        recommendations: ['Magnesio bisglicinato', 'Alimentos ricos en magnesio'],
        priority: 'high'
      });
    }
    
    if (nutritional.symptoms?.includes('sleep_issues')) {
      deficiencies.push({
        nutrient: 'Melatonina',
        level: 35,
        status: 'critical',
        symptoms: ['Problemas de sueño', 'Insomnio'],
        recommendations: ['Suplemento de melatonina', 'Rutina de sueño'],
        priority: 'high'
      });
    }
    
    // Análisis basado en estilo de vida
    if (nutritional.workType === 'night') {
      deficiencies.push({
        nutrient: 'Vitamina D',
        level: 30,
        status: 'critical',
        symptoms: ['Bajo estado de ánimo', 'Debilidad ósea'],
        recommendations: ['Vitamina D3', 'Exposición solar'],
        priority: 'high'
      });
    }
    
    if (nutritional.environment === 'city') {
      deficiencies.push({
        nutrient: 'Antioxidantes',
        level: 50,
        status: 'deficient',
        symptoms: ['Estrés oxidativo'],
        recommendations: ['Vitamina C', 'Resveratrol'],
        priority: 'medium'
      });
    }
    
    return deficiencies;
  };

  const analyzeStrengths = (profile: any, nutritional: any) => {
    const strengths = [];
    
    // Si no tiene síntomas críticos
    if (!nutritional.symptoms?.includes('fatigue') && !nutritional.symptoms?.includes('muscle_cramps')) {
      strengths.push({
        nutrient: 'Energía general',
        level: 85,
        status: 'good',
        benefits: ['Niveles de energía estables', 'Resistencia física']
      });
    }
    
    // Si hace ejercicio regular
    if (profile.lifestyle?.exerciseFrequency?.includes('4-5') || profile.lifestyle?.exerciseFrequency?.includes('6-7')) {
      strengths.push({
        nutrient: 'Condición física',
        level: 90,
        status: 'excellent',
        benefits: ['Sistema cardiovascular fuerte', 'Masa muscular mantenida']
      });
    }
    
    // Si tiene análisis de sangre
    if (nutritional.hasBloodTest) {
      strengths.push({
        nutrient: 'Monitoreo de salud',
        level: 95,
        status: 'excellent',
        benefits: ['Control preventivo', 'Detección temprana']
      });
    }
    
    return strengths;
  };

  const processSupplementRecommendations = (mlRecommendations: any[]) => {
    if (!mlRecommendations || mlRecommendations.length === 0) {
      return [];
    }
    
    return mlRecommendations.map((rec, index) => ({
      name: rec.supplement_name || `Suplemento ${index + 1}`,
      category: rec.category || 'General',
      dosage: rec.dosage_recommendation || 'Según indicación',
      timing: rec.timing_recommendation || 'Con comida',
      duration: '3-6 meses',
      reason: rec.reasons?.[0]?.description || 'Recomendación personalizada',
      benefits: rec.benefits || ['Beneficio general'],
      interactions: rec.interactions_warnings || ['Sin interacciones conocidas'],
      priority: rec.score > 0.8 ? 'high' : rec.score > 0.6 ? 'medium' : 'low',
      confidence: Math.round(rec.confidence * 100),
      score: Math.round(rec.score * 100)
    }));
  };

  const createPersonalizedPlan = (mlRecommendations: any[], profile: any) => {
    return {
      phase1: {
        duration: 'Primeros 30 días',
        focus: 'Corregir deficiencias críticas',
        supplements: mlRecommendations.slice(0, 3),
        goals: ['Reducir síntomas', 'Establecer rutina']
      },
      phase2: {
        duration: 'Días 31-90',
        focus: 'Optimización y mantenimiento',
        supplements: mlRecommendations.slice(3, 6),
        goals: ['Mejorar rendimiento', 'Prevención']
      },
      phase3: {
        duration: 'Mantenimiento',
        focus: 'Salud óptima a largo plazo',
        supplements: mlRecommendations.slice(6),
        goals: ['Bienestar general', 'Prevención de enfermedades']
      }
    };
  };

  const generateInsights = (profile: any, nutritional: any) => {
    const insights = [];
    
    if (nutritional.symptoms?.length > 3) {
      insights.push({
        type: 'warning',
        title: 'Múltiples síntomas detectados',
        description: 'Tienes varios síntomas que sugieren deficiencias nutricionales. Te recomendamos priorizar los suplementos de alta prioridad.',
        icon: AlertTriangle
      });
    }
    
    if (nutritional.workType === 'night') {
      insights.push({
        type: 'info',
        title: 'Trabajo nocturno detectado',
        description: 'Tu horario de trabajo puede afectar la producción de melatonina y vitamina D. Considera suplementos específicos.',
        icon: Moon
      });
    }
    
    if (profile.lifestyle?.exerciseFrequency?.includes('6-7')) {
      insights.push({
        type: 'success',
        title: 'Excelente nivel de actividad',
        description: 'Tu nivel de ejercicio es óptimo. Considera suplementos para optimizar el rendimiento y la recuperación.',
        icon: Activity
      });
    }
    
    return insights;
  };

  const createTimeline = (mlRecommendations: any[]) => {
    return [
      {
        week: 1,
        title: 'Inicio del programa',
        description: 'Comienza con los suplementos de alta prioridad',
        supplements: mlRecommendations.slice(0, 2)
      },
      {
        week: 4,
        title: 'Primera evaluación',
        description: 'Evalúa los primeros cambios y ajusta si es necesario',
        supplements: mlRecommendations.slice(2, 4)
      },
      {
        week: 12,
        title: 'Optimización',
        description: 'Añade suplementos de optimización y mantenimiento',
        supplements: mlRecommendations.slice(4)
      }
    ];
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'deficient': return 'text-orange-600 bg-orange-50';
      case 'critical': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent': return <CheckCircle className="w-4 h-4" />;
      case 'good': return <TrendingUp className="w-4 h-4" />;
      case 'deficient': return <TrendingDown className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Info className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center"
          >
            <Brain className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Generando recomendaciones personalizadas
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Analizando tu perfil nutricional</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>Procesando con modelos ML</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span>Creando plan personalizado</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Listo para generar recomendaciones
          </h2>
          
          <p className="text-gray-600 mb-6">
            Basándome en tu perfil y respuestas, crearé un plan personalizado de suplementación
          </p>
          
          <Button
            onClick={generateRecommendations}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3"
          >
            <Brain className="w-4 h-4 mr-2" />
            Generar mi plan personalizado
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <Pill className="w-6 h-6" />
            <span className="text-sm font-medium">PLAN PERSONALIZADO</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tu Plan de Suplementación Inteligente
          </h1>
          <p className="text-gray-600">
            Basado en análisis ML y tu perfil único
          </p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Puntuación de Salud Actual
              </h2>
              <div className="relative w-32 h-32 mx-auto">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    stroke="#10b981"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${recommendations.overallScore * 2.51} 251`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-600">
                    {recommendations.overallScore}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Basado en análisis de {recommendations.deficiencies.length + recommendations.strengths.length} factores
              </p>
            </div>
          </Card>
        </motion.div>

        {/* Navigation Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex space-x-1 bg-gray-100 p-1 rounded-lg"
        >
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'deficiencies', label: 'Deficiencias', icon: AlertTriangle },
            { id: 'supplements', label: 'Suplementos', icon: Pill },
            { id: 'plan', label: 'Plan', icon: Target }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-all ${
                currentView === tab.id
                  ? 'bg-white text-emerald-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Deficiencies Summary */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <h3 className="text-lg font-semibold">Deficiencias Detectadas</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendations.deficiencies.slice(0, 3).map((def: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{def.nutrient}</span>
                        <Badge className={getStatusColor(def.status)}>
                          {def.level}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Strengths Summary */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <h3 className="text-lg font-semibold">Fortalezas</h3>
                  </div>
                  <div className="space-y-3">
                    {recommendations.strengths.slice(0, 3).map((strength: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{strength.nutrient}</span>
                        <Badge className={getStatusColor(strength.status)}>
                          {strength.level}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Insights */}
                <Card className="p-6 md:col-span-2">
                  <div className="flex items-center gap-3 mb-4">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <h3 className="text-lg font-semibold">Insights Personalizados</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recommendations.insights.map((insight: any, index: number) => (
                      <div key={index} className={`p-4 rounded-lg ${
                        insight.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
                        insight.type === 'info' ? 'bg-blue-50 border border-blue-200' :
                        'bg-green-50 border border-green-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          <insight.icon className="w-4 h-4" />
                          <span className="font-medium text-sm">{insight.title}</span>
                        </div>
                        <p className="text-xs text-gray-600">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {currentView === 'deficiencies' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Análisis de Deficiencias
                </h3>
                {recommendations.deficiencies.map((def: any, index: number) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(def.status)}
                        <h4 className="text-lg font-semibold">{def.nutrient}</h4>
                        <Badge className={getStatusColor(def.status)}>
                          {def.level}%
                        </Badge>
                      </div>
                      <Badge variant="outline" className={
                        def.priority === 'high' ? 'border-red-200 text-red-600' :
                        def.priority === 'medium' ? 'border-orange-200 text-orange-600' :
                        'border-yellow-200 text-yellow-600'
                      }>
                        {def.priority === 'high' ? 'Alta prioridad' :
                         def.priority === 'medium' ? 'Media prioridad' : 'Baja prioridad'}
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <Progress value={def.level} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Síntomas asociados:</h5>
                        <ul className="space-y-1">
                          {def.symptoms.map((symptom: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <Minus className="w-3 h-3 text-red-500" />
                              {symptom}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Recomendaciones:</h5>
                        <ul className="space-y-1">
                          {def.recommendations.map((rec: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <Plus className="w-3 h-3 text-emerald-500" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {currentView === 'supplements' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Recomendaciones de Suplementos
                </h3>
                {recommendations.supplementRecommendations.map((rec: any, index: number) => (
                  <Card key={index} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Pill className="w-5 h-5 text-emerald-600" />
                        <div>
                          <h4 className="text-lg font-semibold">{rec.name}</h4>
                          <p className="text-sm text-gray-600">{rec.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={
                          rec.priority === 'high' ? 'bg-red-100 text-red-600' :
                          rec.priority === 'medium' ? 'bg-orange-100 text-orange-600' :
                          'bg-yellow-100 text-yellow-600'
                        }>
                          {rec.priority === 'high' ? 'Alta prioridad' :
                           rec.priority === 'medium' ? 'Media prioridad' : 'Baja prioridad'}
                        </Badge>
                        <p className="text-xs text-gray-500 mt-1">
                          Confianza: {rec.confidence}%
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Dosis:</span>
                          <span className="text-sm text-gray-600">{rec.dosage}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Momento:</span>
                          <span className="text-sm text-gray-600">{rec.timing}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Duración:</span>
                          <span className="text-sm text-gray-600">{rec.duration}</span>
                        </div>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Razón:</h5>
                        <p className="text-sm text-gray-600">{rec.reason}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Beneficios:</h5>
                        <ul className="space-y-1">
                          {rec.benefits.map((benefit: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2">Interacciones:</h5>
                        <ul className="space-y-1">
                          {rec.interactions.map((interaction: string, i: number) => (
                            <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-orange-500" />
                              {interaction}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t">
                      <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir a mi programa
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {currentView === 'plan' && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Plan Personalizado por Fases
                </h3>
                
                {Object.entries(recommendations.personalizedPlan).map(([phase, plan]: [string, any]) => (
                  <Card key={phase} className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-emerald-600">
                          {phase === 'phase1' ? '1' : phase === 'phase2' ? '2' : '3'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold">{plan.duration}</h4>
                        <p className="text-sm text-gray-600">{plan.focus}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <h5 className="font-medium text-gray-900 mb-2">Objetivos:</h5>
                      <ul className="space-y-1">
                        {plan.goals.map((goal: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                            <Target className="w-3 h-3 text-emerald-500" />
                            {goal}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Suplementos recomendados:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {plan.supplements.map((supp: any, i: number) => (
                          <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Pill className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm">{supp.name || supp.supplement_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
                
                {/* Timeline */}
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Cronograma de Seguimiento</h4>
                  <div className="space-y-4">
                    {recommendations.timeline.map((milestone: any, index: number) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <Clock className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <h5 className="font-medium text-gray-900">{milestone.title}</h5>
                          <p className="text-sm text-gray-600 mb-2">{milestone.description}</p>
                          <div className="flex flex-wrap gap-2">
                            {milestone.supplements.map((supp: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {supp.name || supp.supplement_name}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <Button
            onClick={() => onComplete?.(recommendations)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3"
          >
            <Target className="w-4 h-4 mr-2" />
            Crear mi plan personalizado
          </Button>
          <Button variant="outline" className="px-8 py-3">
            <ArrowRight className="w-4 h-4 mr-2" />
            Ver análisis detallado
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
