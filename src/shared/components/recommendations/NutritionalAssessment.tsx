import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  Shield,
  Zap,
  Moon,
  Activity,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Star,
  Pill,
  FlaskConical,
  BarChart3,
  Users,
  Award,
  Lightbulb,
  ArrowRight,
  Info,
  Plus,
  Minus
} from 'lucide-react';

interface NutritionalDeficiency {
  nutrient: string;
  level: number; // 0-100
  status: 'excellent' | 'good' | 'deficient' | 'critical';
  symptoms: string[];
  recommendations: string[];
  priority: 'high' | 'medium' | 'low';
}

interface NutritionalStrength {
  nutrient: string;
  level: number;
  status: 'excellent' | 'good';
  benefits: string[];
}

interface SupplementRecommendation {
  name: string;
  category: string;
  dosage: string;
  timing: string;
  duration: string;
  reason: string;
  benefits: string[];
  interactions: string[];
  priority: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
}

interface NutritionalAssessmentProps {
  userProfile: any;
  onComplete?: (assessment: any) => void;
}

export const NutritionalAssessment: React.FC<NutritionalAssessmentProps> = ({
  userProfile,
  onComplete
}) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [currentView, setCurrentView] = useState<'overview' | 'deficiencies' | 'strengths' | 'recommendations'>('overview');

  // Simular análisis nutricional basado en el perfil del usuario
  const analyzeNutritionalStatus = async () => {
    setIsAnalyzing(true);
    
    // Simular tiempo de análisis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Generar análisis basado en el perfil del usuario
    const mockAssessment = {
      overallScore: 72,
      deficiencies: [
        {
          nutrient: 'Vitamina D',
          level: 35,
          status: 'critical' as const,
          symptoms: ['Fatiga', 'Debilidad muscular', 'Bajo estado de ánimo'],
          recommendations: ['Suplemento de Vitamina D3', 'Exposición solar controlada'],
          priority: 'high' as const
        },
        {
          nutrient: 'Magnesio',
          level: 45,
          status: 'deficient' as const,
          symptoms: ['Calambres musculares', 'Ansiedad', 'Problemas de sueño'],
          recommendations: ['Magnesio bisglicinato', 'Alimentos ricos en magnesio'],
          priority: 'high' as const
        },
        {
          nutrient: 'Omega-3',
          level: 60,
          status: 'deficient' as const,
          symptoms: ['Inflamación', 'Problemas de memoria'],
          recommendations: ['Aceite de pescado', 'Semillas de chía'],
          priority: 'medium' as const
        }
      ],
      strengths: [
        {
          nutrient: 'Vitamina C',
          level: 95,
          status: 'excellent' as const,
          benefits: ['Sistema inmune fuerte', 'Antioxidante natural']
        },
        {
          nutrient: 'Hierro',
          level: 88,
          status: 'good' as const,
          benefits: ['Energía óptima', 'Transporte de oxígeno']
        }
      ],
      supplementRecommendations: [
        {
          name: 'Vitamina D3 + K2',
          category: 'Vitaminas',
          dosage: '2000 UI/día',
          timing: 'Con desayuno',
          duration: '3 meses',
          reason: 'Deficiencia crítica detectada',
          benefits: ['Salud ósea', 'Sistema inmune', 'Estado de ánimo'],
          interactions: ['Evitar con calcio en exceso'],
          priority: 'high' as const,
          confidence: 95
        },
        {
          name: 'Magnesio Bisglicinato',
          category: 'Minerales',
          dosage: '400mg/día',
          timing: 'Antes de dormir',
          duration: '6 meses',
          reason: 'Niveles bajos afectan sueño y músculos',
          benefits: ['Relajación muscular', 'Mejor sueño', 'Reducción de ansiedad'],
          interactions: ['Tomar separado de calcio'],
          priority: 'high' as const,
          confidence: 90
        },
        {
          name: 'Omega-3 EPA/DHA',
          category: 'Ácidos grasos',
          dosage: '1000mg/día',
          timing: 'Con comida',
          duration: 'Indefinido',
          reason: 'Bajo consumo de pescado',
          benefits: ['Salud cardiovascular', 'Función cerebral', 'Antiinflamatorio'],
          interactions: ['Evitar con anticoagulantes'],
          priority: 'medium' as const,
          confidence: 85
        }
      ]
    };
    
    setAssessment(mockAssessment);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    if (userProfile) {
      analyzeNutritionalStatus();
    }
  }, [userProfile]);

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

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center"
          >
            <FlaskConical className="w-8 h-8 text-white" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Analizando tu perfil nutricional
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span>Evaluando deficiencias nutricionales</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>Analizando patrones de salud</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
              <span>Generando recomendaciones personalizadas</span>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!assessment) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <Pill className="w-6 h-6" />
            <span className="text-sm font-medium">PRO</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Tu Perfil Nutricional
          </h1>
          <p className="text-gray-600">
            Análisis personalizado basado en tu estilo de vida y necesidades
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
                Puntuación General de Salud
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
                    strokeDasharray={`${assessment.overallScore * 2.51} 251`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-emerald-600">
                    {assessment.overallScore}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Basado en análisis de {assessment.deficiencies.length + assessment.strengths.length} nutrientes
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
            { id: 'strengths', label: 'Fortalezas', icon: CheckCircle },
            { id: 'recommendations', label: 'Recomendaciones', icon: Target }
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
                    <h3 className="text-lg font-semibold">Deficiencias Críticas</h3>
                  </div>
                  <div className="space-y-3">
                    {assessment.deficiencies.slice(0, 3).map((def: any, index: number) => (
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
                    {assessment.strengths.slice(0, 3).map((strength: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{strength.nutrient}</span>
                        <Badge className={getStatusColor(strength.status)}>
                          {strength.level}%
                        </Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {currentView === 'deficiencies' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Deficiencias Nutricionales Detectadas
                </h3>
                {assessment.deficiencies.map((def: any, index: number) => (
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

            {currentView === 'strengths' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Fortalezas Nutricionales
                </h3>
                {assessment.strengths.map((strength: any, index: number) => (
                  <Card key={index} className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center gap-3 mb-4">
                      {getStatusIcon(strength.status)}
                      <h4 className="text-lg font-semibold">{strength.nutrient}</h4>
                      <Badge className={getStatusColor(strength.status)}>
                        {strength.level}%
                      </Badge>
                    </div>
                    
                    <div className="mb-4">
                      <Progress value={strength.level} className="h-2" />
                    </div>
                    
                    <div>
                      <h5 className="font-medium text-gray-900 mb-2">Beneficios:</h5>
                      <ul className="space-y-1">
                        {strength.benefits.map((benefit: string, i: number) => (
                          <li key={i} className="text-sm text-gray-600 flex items-center gap-2">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {currentView === 'recommendations' && (
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Recomendaciones de Suplementos
                </h3>
                {assessment.supplementRecommendations.map((rec: any, index: number) => (
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
            onClick={() => onComplete?.(assessment)}
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
