import React, { useState, useEffect } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Progress } from '@/shared/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  Brain,
  Shield,
  Zap,
  Moon,
  Sun,
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
  ArrowRight,
  Info,
  Plus,
  Minus,
  Clock,
  DollarSign,
  Lightbulb,
  Eye,
  EyeOff,
  Download,
  Share2,
  RefreshCw
} from 'lucide-react';

interface NutritionalVisualizationProps {
  assessment: any;
  recommendations: any;
  onUpdate?: (data: any) => void;
}

export const NutritionalVisualization: React.FC<NutritionalVisualizationProps> = ({
  assessment,
  recommendations,
  onUpdate
}) => {
  const [currentView, setCurrentView] = useState<'overview' | 'deficiencies' | 'strengths' | 'trends' | 'comparison'>('overview');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedNutrient, setSelectedNutrient] = useState<string | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'deficient': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
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

  const getNutrientIcon = (nutrient: string) => {
    const nutrientLower = nutrient.toLowerCase();
    if (nutrientLower.includes('vitamina d') || nutrientLower.includes('vitamin d')) return <Sun className="w-5 h-5" />;
    if (nutrientLower.includes('magnesio') || nutrientLower.includes('magnesium')) return <Zap className="w-5 h-5" />;
    if (nutrientLower.includes('hierro') || nutrientLower.includes('iron')) return <Heart className="w-5 h-5" />;
    if (nutrientLower.includes('omega') || nutrientLower.includes('omega-3')) return <Activity className="w-5 h-5" />;
    if (nutrientLower.includes('melatonina') || nutrientLower.includes('melatonin')) return <Moon className="w-5 h-5" />;
    if (nutrientLower.includes('vitamina c') || nutrientLower.includes('vitamin c')) return <Shield className="w-5 h-5" />;
    if (nutrientLower.includes('b12') || nutrientLower.includes('vitamin b12')) return <Brain className="w-5 h-5" />;
    return <Pill className="w-5 h-5" />;
  };

  const createNutrientChart = (nutrient: any) => {
    const level = nutrient.level;
    const status = nutrient.status;
    
    return (
      <div className="relative w-full h-32 bg-gray-50 rounded-lg p-4">
        <div className="flex items-end justify-between h-full">
          {/* Líneas de referencia */}
          <div className="absolute inset-0 flex flex-col justify-between">
            <div className="border-t border-gray-200"></div>
            <div className="border-t border-gray-200"></div>
            <div className="border-t border-gray-200"></div>
            <div className="border-t border-gray-200"></div>
          </div>
          
          {/* Barra de nivel */}
          <div className="relative w-8">
            <div 
              className={`w-full rounded-t-lg transition-all duration-1000 ${
                status === 'excellent' ? 'bg-green-500' :
                status === 'good' ? 'bg-blue-500' :
                status === 'deficient' ? 'bg-orange-500' :
                'bg-red-500'
              }`}
              style={{ height: `${level}%` }}
            />
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <span className="text-xs font-bold text-gray-700">{level}%</span>
            </div>
          </div>
          
          {/* Etiquetas de referencia */}
          <div className="absolute -left-8 top-0 text-xs text-gray-500">100%</div>
          <div className="absolute -left-8 top-8 text-xs text-gray-500">75%</div>
          <div className="absolute -left-8 top-16 text-xs text-gray-500">50%</div>
          <div className="absolute -left-8 top-24 text-xs text-gray-500">25%</div>
          <div className="absolute -left-8 bottom-0 text-xs text-gray-500">0%</div>
        </div>
      </div>
    );
  };

  const createRadarChart = () => {
    const nutrients = [...(assessment?.deficiencies || []), ...(assessment?.strengths || [])];
    const maxNutrients = 8;
    const selectedNutrients = nutrients.slice(0, maxNutrients);
    
    return (
      <div className="relative w-64 h-64 mx-auto">
        <svg className="w-full h-full" viewBox="0 0 200 200">
          {/* Círculos de referencia */}
          <circle cx="100" cy="100" r="80" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          <circle cx="100" cy="100" r="60" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          <circle cx="100" cy="100" r="40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          <circle cx="100" cy="100" r="20" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
          
          {/* Líneas radiales */}
          {selectedNutrients.map((_, index) => {
            const angle = (index * 360) / selectedNutrients.length;
            const x = 100 + 80 * Math.cos((angle - 90) * Math.PI / 180);
            const y = 100 + 80 * Math.sin((angle - 90) * Math.PI / 180);
            return (
              <line
                key={index}
                x1="100"
                y1="100"
                x2={x}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Datos del radar */}
          <polygon
            points={selectedNutrients.map((nutrient, index) => {
              const angle = (index * 360) / selectedNutrients.length;
              const radius = (nutrient.level / 100) * 80;
              const x = 100 + radius * Math.cos((angle - 90) * Math.PI / 180);
              const y = 100 + radius * Math.sin((angle - 90) * Math.PI / 180);
              return `${x},${y}`;
            }).join(' ')}
            fill="rgba(16, 185, 129, 0.2)"
            stroke="#10b981"
            strokeWidth="2"
          />
          
          {/* Puntos de datos */}
          {selectedNutrients.map((nutrient, index) => {
            const angle = (index * 360) / selectedNutrients.length;
            const radius = (nutrient.level / 100) * 80;
            const x = 100 + radius * Math.cos((angle - 90) * Math.PI / 180);
            const y = 100 + radius * Math.sin((angle - 90) * Math.PI / 180);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="3"
                fill="#10b981"
              />
            );
          })}
        </svg>
        
        {/* Etiquetas de nutrientes */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">
              {Math.round(selectedNutrients.reduce((acc, n) => acc + n.level, 0) / selectedNutrients.length)}
            </div>
            <div className="text-xs text-gray-500">Promedio</div>
          </div>
        </div>
      </div>
    );
  };

  const createTimelineChart = () => {
    const timeline = recommendations?.timeline || [];
    
    return (
      <div className="space-y-4">
        {timeline.map((milestone: any, index: number) => (
          <div key={index} className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-600">{index + 1}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                <Badge className="bg-emerald-100 text-emerald-600">
                  Semana {milestone.week}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mb-3">{milestone.description}</p>
              
              {/* Barra de progreso simulada */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-emerald-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(milestone.week / 12) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Visualización Nutricional</h2>
          <p className="text-gray-600">Análisis visual de tu estado nutricional</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {showDetails ? 'Ocultar detalles' : 'Mostrar detalles'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="w-4 h-4 mr-2" />
            Compartir
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'overview', label: 'Resumen', icon: BarChart3 },
          { id: 'deficiencies', label: 'Deficiencias', icon: AlertTriangle },
          { id: 'strengths', label: 'Fortalezas', icon: CheckCircle },
          { id: 'trends', label: 'Tendencias', icon: TrendingUp },
          { id: 'comparison', label: 'Comparación', icon: Users }
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
      </div>

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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfico de radar */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Perfil Nutricional</h3>
                {createRadarChart()}
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-600">
                    Visualización de {assessment?.deficiencies?.length + assessment?.strengths?.length || 0} nutrientes
                  </p>
                </div>
              </Card>

              {/* Resumen de estado */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Estado General</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Puntuación general</span>
                    <div className="flex items-center gap-2">
                      <Progress value={assessment?.overallScore || 0} className="w-24" />
                      <span className="text-sm font-bold">{assessment?.overallScore || 0}%</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {assessment?.deficiencies?.filter((d: any) => d.status === 'critical').length || 0}
                      </div>
                      <div className="text-xs text-red-600">Críticas</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {assessment?.strengths?.length || 0}
                      </div>
                      <div className="text-xs text-green-600">Fortalezas</div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {currentView === 'deficiencies' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Análisis de Deficiencias
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment?.deficiencies?.map((def: any, index: number) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      {getNutrientIcon(def.nutrient)}
                      <div>
                        <h4 className="font-semibold text-sm">{def.nutrient}</h4>
                        <Badge className={getStatusColor(def.status)}>
                          {def.level}%
                        </Badge>
                      </div>
                    </div>
                    
                    {createNutrientChart(def)}
                    
                    {showDetails && (
                      <div className="mt-3 space-y-2">
                        <div>
                          <p className="text-xs font-medium text-gray-700">Síntomas:</p>
                          <p className="text-xs text-gray-600">{def.symptoms?.join(', ')}</p>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-gray-700">Prioridad:</p>
                          <Badge variant="outline" className={
                            def.priority === 'high' ? 'border-red-200 text-red-600' :
                            def.priority === 'medium' ? 'border-orange-200 text-orange-600' :
                            'border-yellow-200 text-yellow-600'
                          }>
                            {def.priority === 'high' ? 'Alta' : def.priority === 'medium' ? 'Media' : 'Baja'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentView === 'strengths' && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Fortalezas Nutricionales
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assessment?.strengths?.map((strength: any, index: number) => (
                  <Card key={index} className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                    <div className="flex items-center gap-3 mb-3">
                      {getNutrientIcon(strength.nutrient)}
                      <div>
                        <h4 className="font-semibold text-sm">{strength.nutrient}</h4>
                        <Badge className={getStatusColor(strength.status)}>
                          {strength.level}%
                        </Badge>
                      </div>
                    </div>
                    
                    {createNutrientChart(strength)}
                    
                    {showDetails && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-700 mb-1">Beneficios:</p>
                        <p className="text-xs text-gray-600">{strength.benefits?.join(', ')}</p>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}

          {currentView === 'trends' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Tendencias y Progreso
              </h3>
              
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Cronograma de Mejora</h4>
                {createTimelineChart()}
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Proyección de Mejora</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Semana 4</span>
                      <div className="flex items-center gap-2">
                        <Progress value={25} className="w-20" />
                        <span className="text-xs">25%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Semana 8</span>
                      <div className="flex items-center gap-2">
                        <Progress value={50} className="w-20" />
                        <span className="text-xs">50%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Semana 12</span>
                      <div className="flex items-center gap-2">
                        <Progress value={75} className="w-20" />
                        <span className="text-xs">75%</span>
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Impacto Esperado</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-sm">+40% de energía</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Moon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">+2h de sueño profundo</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">+60% de inmunidad</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {currentView === 'comparison' && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Comparación con Población General
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Tu Perfil</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deficiencias críticas</span>
                      <Badge className="bg-red-100 text-red-600">
                        {assessment?.deficiencies?.filter((d: any) => d.status === 'critical').length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fortalezas</span>
                      <Badge className="bg-green-100 text-green-600">
                        {assessment?.strengths?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Puntuación general</span>
                      <Badge className="bg-emerald-100 text-emerald-600">
                        {assessment?.overallScore || 0}%
                      </Badge>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-6">
                  <h4 className="text-lg font-semibold mb-4">Población General</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Deficiencias críticas</span>
                      <Badge className="bg-gray-100 text-gray-600">2.3</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fortalezas</span>
                      <Badge className="bg-gray-100 text-gray-600">1.8</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Puntuación general</span>
                      <Badge className="bg-gray-100 text-gray-600">65%</Badge>
                    </div>
                  </div>
                </Card>
              </div>
              
              <Card className="p-6">
                <h4 className="text-lg font-semibold mb-4">Análisis Comparativo</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-sm">
                      Tu perfil está <strong>{(assessment?.overallScore || 0) - 65} puntos</strong> por encima del promedio
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <span className="text-sm">
                      Tienes <strong>{assessment?.deficiencies?.filter((d: any) => d.status === 'critical').length || 0} deficiencias críticas</strong> que requieren atención inmediata
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                    <span className="text-sm">
                      Con el plan recomendado, podrías alcanzar <strong>85%+ de puntuación</strong> en 12 semanas
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
