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
  Lightbulb,
  RefreshCw,
  Download,
  Share2,
  Settings,
  BookOpen,
  Activity,
  Moon,
  Sun
} from 'lucide-react';

// Importar componentes del sistema de recomendaciones
import { NutritionalAssessment } from '@/shared/components/NutritionalAssessment';
import { RecommendationSystem } from '@/shared/components/RecommendationSystem';

interface RecommendationsPageProps {
  userProfile?: any;
  nutritionalAnswers?: any;
}

export const RecommendationsPage: React.FC<RecommendationsPageProps> = ({
  userProfile,
  nutritionalAnswers
}) => {
  const [currentView, setCurrentView] = useState<'assessment' | 'recommendations' | 'plan'>('assessment');
  const [assessment, setAssessment] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Datos de ejemplo si no se proporcionan
  const defaultUserProfile = userProfile || {
    id: 'user_123',
    name: 'Usuario',
    age: '30',
    gender: 'man',
    weight: '70',
    height: '175',
    healthGoals: ['Energía', 'Sueño', 'Inmunidad'],
    exerciseHours: 'moderate',
    dietType: 'omnivora',
    monthlySpending: '101-200'
  };

  const defaultNutritionalAnswers = nutritionalAnswers || {
    hasBloodTest: false,
    symptoms: ['fatigue', 'sleep_issues'],
    medicalConditions: [],
    medications: [],
    sleepSchedule: { bedtime: '23:00', wakeTime: '07:00' },
    workType: 'office',
    environment: 'city',
    allergies: [],
    supplementPreferences: ['capsules'],
    currentSupplements: []
  };

  const handleAssessmentComplete = (assessmentData: any) => {
    setAssessment(assessmentData);
    setCurrentView('recommendations');
  };

  const handleRecommendationsComplete = (recommendationsData: any) => {
    setRecommendations(recommendationsData);
    setCurrentView('plan');
  };

  const handleGenerateNewRecommendations = () => {
    setIsGenerating(true);
    // Simular regeneración de recomendaciones
    setTimeout(() => {
      setIsGenerating(false);
      setCurrentView('assessment');
    }, 2000);
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

    return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Recomendaciones IA</h1>
                <p className="text-sm text-gray-500">Análisis nutricional personalizado</p>
        </div>
      </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateNewRecommendations}
                disabled={isGenerating}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Regenerando...' : 'Actualizar'}
              </Button>
              
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </Button>
              
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 py-4">
            {[
              { id: 'assessment', label: 'Evaluación', icon: FlaskConical, description: 'Análisis nutricional' },
              { id: 'recommendations', label: 'Recomendaciones', icon: Target, description: 'Suplementos sugeridos' },
              { id: 'plan', label: 'Plan Personalizado', icon: BookOpen, description: 'Cronograma de seguimiento' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  currentView === tab.id
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </button>
            ))}
          </div>
          </div>
        </div>

        {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'assessment' && (
              <NutritionalAssessment
                userProfile={defaultUserProfile}
                onComplete={handleAssessmentComplete}
              />
            )}

            {currentView === 'recommendations' && (
              <RecommendationSystem
                userProfile={defaultUserProfile}
                nutritionalAnswers={defaultNutritionalAnswers}
                onComplete={handleRecommendationsComplete}
              />
            )}

            {currentView === 'plan' && recommendations && (
        <div className="space-y-8">
                {/* Plan Overview */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-8 bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                        <Award className="w-8 h-8 text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-900">
                        ¡Tu Plan Personalizado está Listo!
                      </h2>
                      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Basado en tu perfil único y análisis de IA, hemos creado un plan de suplementación 
                        diseñado específicamente para tus necesidades y objetivos de salud.
                      </p>
                    </div>
                  </Card>
                </motion.div>

                {/* Plan Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Fase 1 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-red-600">1</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Fase 1: Corrección</h3>
                          <p className="text-sm text-gray-600">Primeros 30 días</p>
                        </div>
              </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="text-sm font-medium">Enfoque: Deficiencias críticas</span>
                        </div>
                        <div className="space-y-2">
                          {recommendations.supplementRecommendations?.slice(0, 3).map((supp: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                              <Pill className="w-4 h-4 text-red-600" />
                              <span className="text-sm">{supp.name}</span>
                              <Badge className="bg-red-100 text-red-600 text-xs">
                                {supp.priority === 'high' ? 'Alta' : 'Media'}
                              </Badge>
                            </div>
                  ))}
                </div>
                      </div>
                    </Card>
                  </motion.div>

                  {/* Fase 2 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-orange-600">2</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Fase 2: Optimización</h3>
                          <p className="text-sm text-gray-600">Días 31-90</p>
                </div>
            </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-medium">Enfoque: Rendimiento</span>
                        </div>
                        <div className="space-y-2">
                          {recommendations.supplementRecommendations?.slice(3, 6).map((supp: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-orange-50 rounded">
                              <Pill className="w-4 h-4 text-orange-600" />
                              <span className="text-sm">{supp.name}</span>
                              <Badge className="bg-orange-100 text-orange-600 text-xs">
                                {supp.priority === 'high' ? 'Alta' : 'Media'}
                              </Badge>
                            </div>
                          ))}
                </div>
            </div>
                    </Card>
                  </motion.div>

                  {/* Fase 3 */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="p-6 h-full">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold text-green-600">3</span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold">Fase 3: Mantenimiento</h3>
                          <p className="text-sm text-gray-600">A largo plazo</p>
                </div>
              </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm font-medium">Enfoque: Prevención</span>
                        </div>
                        <div className="space-y-2">
                          {recommendations.supplementRecommendations?.slice(6).map((supp: any, index: number) => (
                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                              <Pill className="w-4 h-4 text-green-600" />
                              <span className="text-sm">{supp.name}</span>
                              <Badge className="bg-green-100 text-green-600 text-xs">
                                {supp.priority === 'high' ? 'Alta' : 'Media'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                </div>

                {/* Timeline Detallado */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">
                      Cronograma de Seguimiento
                    </h3>
                    
                    <div className="space-y-6">
                      {recommendations.timeline?.map((milestone: any, index: number) => (
                        <div key={index} className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Clock className="w-6 h-6 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="text-lg font-semibold text-gray-900">{milestone.title}</h4>
                              <Badge className="bg-emerald-100 text-emerald-600">
                                Semana {milestone.week}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-4">{milestone.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {milestone.supplements?.map((supp: any, suppIndex: number) => (
                                <div key={suppIndex} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                  <Pill className="w-4 h-4 text-emerald-600" />
                                  <span className="text-sm font-medium">{supp.name || supp.supplement_name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                {/* Insights y Consejos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-6"
                >
                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold">Consejos Importantes</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Clock className="w-4 h-4 text-blue-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Consistencia es clave</p>
                          <p className="text-xs text-gray-600">Toma tus suplementos a la misma hora cada día</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Activity className="w-4 h-4 text-green-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Combina con ejercicio</p>
                          <p className="text-xs text-gray-600">Los suplementos funcionan mejor con actividad física</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Moon className="w-4 h-4 text-purple-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Sueño de calidad</p>
                          <p className="text-xs text-gray-600">El descanso optimiza la absorción de nutrientes</p>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">Precauciones</h3>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-blue-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Consulta con tu médico</p>
                          <p className="text-xs text-gray-600">Especialmente si tomas medicamentos</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-green-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Calidad de suplementos</p>
                          <p className="text-xs text-gray-600">Elige marcas certificadas y de confianza</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Heart className="w-4 h-4 text-red-500 mt-1" />
                        <div>
                          <p className="text-sm font-medium">Escucha a tu cuerpo</p>
                          <p className="text-xs text-gray-600">Ajusta si experimentas efectos adversos</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col sm:flex-row gap-4 justify-center"
                >
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3">
                    <Target className="w-4 h-4 mr-2" />
                    Comenzar mi plan
                  </Button>
                  <Button variant="outline" className="px-8 py-3">
                    <Settings className="w-4 h-4 mr-2" />
                    Personalizar plan
                  </Button>
                  <Button variant="outline" className="px-8 py-3">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar PDF
                  </Button>
                </motion.div>
            </div>
          )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};