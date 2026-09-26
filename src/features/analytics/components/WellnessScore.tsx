import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { TrendingUp, TrendingDown, Minus, Heart, Activity, Zap, Target } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

interface WellnessScoreData {
  id: string;
  user_id: string;
  overall_score: number;
  food_score: number;
  supplements_score: number;
  recorded_date: string;
  score_breakdown: any;
  factors: any;
  notes?: string;
  is_manual: boolean;
  created_at: string;
}

interface WellnessTrend {
  date: string;
  overall: number;
  food: number;
  supplements: number;
}

export const WellnessScore = () => {
  const { user } = useAuth();
  const [currentScore, setCurrentScore] = useState<WellnessScoreData | null>(null);
  const [trends, setTrends] = useState<WellnessTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentScore();
      fetchTrends();
    }
  }, [user]);

  const fetchCurrentScore = async () => {
    try {
      const { data, error } = await supabase
        .from('wellness_score_history')
        .select('*')
        .eq('user_id', user?.id)
        .order('recorded_date', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setCurrentScore(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchTrends = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('wellness_score_history')
        .select('*')
        .eq('user_id', user?.id)
        .gte('recorded_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('recorded_date', { ascending: true });

      if (error) throw error;
      
      const trendData = data?.map(item => ({
        date: item.recorded_date,
        overall: item.overall_score,
        food: item.food_score,
        supplements: item.supplements_score
      })) || [];
      
      setTrends(trendData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800';
    if (score >= 40) return 'bg-orange-100 text-orange-800';
    return 'bg-red-100 text-red-800';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excelente';
    if (score >= 80) return 'Muy Bueno';
    if (score >= 70) return 'Bueno';
    if (score >= 60) return 'Regular';
    if (score >= 40) return 'Necesita Mejora';
    return 'Requiere Atención';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  const calculateTrend = () => {
    if (trends.length < 2) return null;
    
    const current = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    
    return {
      overall: current.overall - previous.overall,
      food: current.food - previous.food,
      supplements: current.supplements - previous.supplements
    };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Puntuación de Bienestar
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
            <Heart className="h-5 w-5" />
            Puntuación de Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error cargando puntuación: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!currentScore) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5" />
            Puntuación de Bienestar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Aún no tienes una puntuación de bienestar registrada.
            </p>
            <Button>
              <Activity className="h-4 w-4 mr-2" />
              Calcular Puntuación
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const trend = calculateTrend();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Puntuación de Bienestar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Puntuación General */}
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <div className={`text-4xl font-bold ${getScoreColor(currentScore.overall_score)}`}>
              {currentScore.overall_score}
            </div>
            <Badge className={getScoreBadgeColor(currentScore.overall_score)}>
              {getScoreLabel(currentScore.overall_score)}
            </Badge>
            {trend && (
              <div className="flex items-center justify-center gap-2 text-sm">
                {getTrendIcon(currentScore.overall_score, currentScore.overall_score - trend.overall)}
                <span className={trend.overall > 0 ? 'text-green-600' : trend.overall < 0 ? 'text-red-600' : 'text-gray-600'}>
                  {trend.overall > 0 ? '+' : ''}{trend.overall} vs anterior
                </span>
              </div>
            )}
          </div>
          
          <Progress value={currentScore.overall_score} className="h-3" />
        </div>

        {/* Desglose de Puntuaciones */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Suplementos</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(currentScore.supplements_score)}`}>
                {currentScore.supplements_score}
              </span>
            </div>
            <Progress value={currentScore.supplements_score} className="h-2" />
            {trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(currentScore.supplements_score, currentScore.supplements_score - trend.supplements)}
                <span>{trend.supplements > 0 ? '+' : ''}{trend.supplements}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Alimentación</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(currentScore.food_score)}`}>
                {currentScore.food_score}
              </span>
            </div>
            <Progress value={currentScore.food_score} className="h-2" />
            {trend && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {getTrendIcon(currentScore.food_score, currentScore.food_score - trend.food)}
                <span>{trend.food > 0 ? '+' : ''}{trend.food}</span>
              </div>
            )}
          </div>
        </div>

        {/* Factores y Notas */}
        {currentScore.factors && Object.keys(currentScore.factors).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Factores Clave:</h4>
            <div className="flex flex-wrap gap-2">
              {Object.entries(currentScore.factors).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {String(value)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {currentScore.notes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Notas:</h4>
            <p className="text-sm text-muted-foreground bg-gray-50 p-3 rounded">
              {currentScore.notes}
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Activity className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver Tendencias
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
