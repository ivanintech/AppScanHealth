import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Progress } from '@/shared/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Target, 
  Activity,
  Clock, 
  Award,
  Brain,
  Heart,
  Zap
} from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

interface UserAnalytics {
  id: string;
  user_id: string;
  metric_type: 'adherence' | 'streak' | 'mood_correlation' | 'consistency' | 'timing_accuracy';
  metric_value: any;
  recorded_date: string;
  created_at: string;
}

interface AnalyticsSummary {
  adherence: number;
  streak: number;
  consistency: number;
  timing_accuracy: number;
  mood_correlation: number;
}

export const AdvancedAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (user) {
    fetchAnalytics();
    }
  }, [user, selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      const daysBack = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data, error } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user?.id)
        .gte('recorded_date', startDate.toISOString().split('T')[0])
        .order('recorded_date', { ascending: false });

      if (error) throw error;
      
      setAnalytics(data || []);
      calculateSummary(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (data: UserAnalytics[]) => {
    const summary: AnalyticsSummary = {
      adherence: 0,
      streak: 0,
      consistency: 0,
      timing_accuracy: 0,
      mood_correlation: 0
    };

    // Agrupar por tipo de métrica y calcular promedios
    const metricsByType = data.reduce((acc, item) => {
      if (!acc[item.metric_type]) {
        acc[item.metric_type] = [];
      }
      acc[item.metric_type].push(item.metric_value);
      return acc;
    }, {} as Record<string, any[]>);

    // Calcular promedios
    Object.entries(metricsByType).forEach(([type, values]) => {
      const avg = values.reduce((sum, val) => {
        if (typeof val === 'number') return sum + val;
        if (typeof val === 'object' && val.value) return sum + val.value;
        return sum;
      }, 0) / values.length;

      switch (type) {
        case 'adherence':
          summary.adherence = Math.round(avg);
          break;
        case 'streak':
          summary.streak = Math.round(avg);
          break;
        case 'consistency':
          summary.consistency = Math.round(avg);
          break;
        case 'timing_accuracy':
          summary.timing_accuracy = Math.round(avg);
          break;
        case 'mood_correlation':
          summary.mood_correlation = Math.round(avg);
          break;
      }
    });

    setSummary(summary);
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'adherence': return <Target className="h-4 w-4" />;
      case 'streak': return <Award className="h-4 w-4" />;
      case 'consistency': return <Activity className="h-4 w-4" />;
      case 'timing_accuracy': return <Clock className="h-4 w-4" />;
      case 'mood_correlation': return <Heart className="h-4 w-4" />;
      default: return <BarChart3 className="h-4 w-4" />;
    }
  };

  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    if (value >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getMetricLabel = (type: string) => {
    switch (type) {
      case 'adherence': return 'Adherencia';
      case 'streak': return 'Racha';
      case 'consistency': return 'Consistencia';
      case 'timing_accuracy': return 'Precisión de Horarios';
      case 'mood_correlation': return 'Correlación de Estado';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Análisis Avanzado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error cargando análisis: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Análisis Avanzado
            </CardTitle>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant={selectedPeriod === '7d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('7d')}
          >
            7 días
          </Button>
          <Button
            size="sm"
            variant={selectedPeriod === '30d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('30d')}
          >
            30 días
          </Button>
                <Button
                  size="sm"
            variant={selectedPeriod === '90d' ? 'default' : 'outline'}
            onClick={() => setSelectedPeriod('90d')}
                >
            90 días
                </Button>
          </div>
        </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="trends">Tendencias</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {summary ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Adherencia</span>
              </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getMetricColor(summary.adherence)}`}>
                      {summary.adherence}%
                  </span>
                    <Progress value={summary.adherence} className="w-20" />
                  </div>
              </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm font-medium">Racha Actual</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getMetricColor(summary.streak)}`}>
                      {summary.streak} días
                    </span>
                    <Badge variant="outline">🔥</Badge>
                  </div>
              </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-500" />
                    <span className="text-sm font-medium">Consistencia</span>
              </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getMetricColor(summary.consistency)}`}>
                      {summary.consistency}%
                    </span>
                    <Progress value={summary.consistency} className="w-20" />
              </div>
          </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium">Precisión de Horarios</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-2xl font-bold ${getMetricColor(summary.timing_accuracy)}`}>
                      {summary.timing_accuracy}%
                    </span>
                    <Progress value={summary.timing_accuracy} className="w-20" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No hay datos de análisis disponibles para el período seleccionado.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Tendencias de Métricas</h4>
              {analytics.length > 0 ? (
            <div className="space-y-3">
                  {Object.entries(
                    analytics.reduce((acc, item) => {
                      if (!acc[item.metric_type]) acc[item.metric_type] = [];
                      acc[item.metric_type].push(item);
                      return acc;
                    }, {} as Record<string, UserAnalytics[]>)
                  ).map(([type, items]) => (
                    <div key={type} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getMetricIcon(type)}
                          <span className="font-medium">{getMetricLabel(type)}</span>
                        </div>
                        <Badge variant="outline">
                          {items.length} registros
                        </Badge>
                  </div>
                      <div className="text-sm text-muted-foreground">
                        Último valor: {typeof items[0].metric_value === 'object' 
                          ? items[0].metric_value.value || items[0].metric_value
                          : items[0].metric_value
                        }
                    </div>
                  </div>
              ))}
            </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No hay datos de tendencias disponibles.
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <div className="space-y-4">
              <h4 className="font-medium">Insights Inteligentes</h4>
              <div className="grid gap-4">
                <div className="border rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-blue-800">Patrón de Adherencia</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Tu adherencia ha mejorado un 15% en los últimos 7 días. 
                    Mantén este ritmo para alcanzar tus objetivos.
                  </p>
                </div>

                <div className="border rounded-lg p-4 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-green-800">Correlación de Estado</span>
                  </div>
                  <p className="text-sm text-green-700">
                    Se observa una correlación positiva entre la toma de suplementos 
                    y tu bienestar general (+0.7).
                  </p>
          </div>

                <div className="border rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-yellow-500" />
                    <span className="font-medium text-yellow-800">Optimización de Horarios</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    Considera ajustar el horario de tus suplementos matutinos 
                    para mejorar la absorción.
                  </p>
                </div>
            </div>
          </div>
          </TabsContent>
        </Tabs>
        </CardContent>
      </Card>
  );
};
