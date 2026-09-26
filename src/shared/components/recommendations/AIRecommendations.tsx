import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { Brain, TrendingUp, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

interface AIRecommendation {
  id: string;
  recommendation_type: 'supplement' | 'timing' | 'dosage' | 'interaction' | 'lifestyle';
  title: string;
  content: any;
  confidence_score: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  priority: number;
  expires_at: string;
  created_at: string;
}

export const AIRecommendations = () => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<AIRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Mapear los datos de la base de datos al tipo AIRecommendation
      const mappedRecommendations: AIRecommendation[] = (data || []).map((item: any) => ({
        id: item.id,
        recommendation_type: item.recommendation_type as 'supplement' | 'timing' | 'dosage' | 'interaction' | 'lifestyle',
        title: item.title,
        content: item.content,
        confidence_score: item.confidence_score,
        status: item.status as 'pending' | 'accepted' | 'rejected' | 'expired',
        priority: item.priority,
        expires_at: item.expires_at,
        created_at: item.created_at
      }));
      
      setRecommendations(mappedRecommendations);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecommendationAction = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status: action })
        .eq('id', id);

      if (error) throw error;
      
      setRecommendations(prev => prev.filter(rec => rec.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRecommendationIcon = (type: string) => {
    switch (type) {
      case 'supplement': return <Brain className="h-4 w-4" />;
      case 'timing': return <Clock className="h-4 w-4" />;
      case 'interaction': return <AlertTriangle className="h-4 w-4" />;
      default: return <TrendingUp className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (type: string) => {
    switch (type) {
      case 'supplement': return 'bg-blue-100 text-blue-800';
      case 'timing': return 'bg-green-100 text-green-800';
      case 'interaction': return 'bg-red-100 text-red-800';
      case 'lifestyle': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 4) return 'bg-red-500';
    if (priority >= 3) return 'bg-orange-500';
    if (priority >= 2) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Recomendaciones IA
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
            <Brain className="h-5 w-5" />
            Recomendaciones IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error cargando recomendaciones: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Recomendaciones IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No hay recomendaciones disponibles en este momento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Recomendaciones IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => (
          <div key={recommendation.id} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {getRecommendationIcon(recommendation.recommendation_type)}
                <h4 className="font-semibold">{recommendation.title}</h4>
                <div className={`w-2 h-2 rounded-full ${getPriorityColor(recommendation.priority)}`}></div>
              </div>
              <Badge className={getRecommendationColor(recommendation.recommendation_type)}>
                {recommendation.recommendation_type}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {typeof recommendation.content === 'string' 
                ? recommendation.content 
                : JSON.stringify(recommendation.content, null, 2)
              }
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Confianza: {Math.round(recommendation.confidence_score * 100)}%</span>
                <span>•</span>
                <span>Prioridad: {recommendation.priority}/5</span>
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRecommendationAction(recommendation.id, 'rejected')}
                  className="text-red-600 hover:text-red-700"
                >
                  Rechazar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleRecommendationAction(recommendation.id, 'accepted')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aceptar
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
