import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from "@/shared/supabase/client";
import { motion } from 'framer-motion';

interface TrendData {
  date: string;
  score: number;
  adherence: number;
}

interface PredictionData {
  trend: 'improving' | 'declining' | 'stable';
  prediction: string;
  recommendation: string;
}

const WellnessTrends: React.FC = () => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendData();
  }, []);

  const fetchTrendData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Simulate trend data for demo
      const simulatedData: TrendData[] = [
        { date: 'Lun', score: 85, adherence: 90 },
        { date: 'Mar', score: 78, adherence: 85 },
        { date: 'Mié', score: 92, adherence: 95 },
        { date: 'Jue', score: 88, adherence: 92 },
        { date: 'Vie', score: 94, adherence: 96 },
        { date: 'Sáb', score: 87, adherence: 89 },
        { date: 'Dom', score: 91, adherence: 94 }
      ];

      setTrendData(simulatedData);
      generatePrediction(simulatedData);
    } catch (error) {
      console.error('Error fetching trend data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePrediction = (data: TrendData[]) => {
    if (data.length < 3) return;

    const recent = data.slice(-3);
    const recentAvg = recent.reduce((sum, d) => sum + d.score, 0) / recent.length;

    let trend: 'improving' | 'declining' | 'stable';
    let prediction: string;
    let recommendation: string;

    if (recentAvg > 85) {
      trend = 'improving';
      prediction = 'Tu bienestar está mejorando consistentemente';
      recommendation = 'Mantén tus hábitos actuales y considera agregar nuevos objetivos';
    } else if (recentAvg < 70) {
      trend = 'declining';
      prediction = 'Tu adherencia ha disminuido recientemente';
      recommendation = 'Revisa tus recordatorios y considera simplificar tu rutina';
    } else {
      trend = 'stable';
      prediction = 'Tu bienestar se mantiene estable';
      recommendation = 'Busca pequeñas mejoras para continuar progresando';
    }

    setPrediction({ trend, prediction, recommendation });
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'default';
      case 'declining': return 'destructive';
      case 'stable': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="animate-pulse">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Tendencias de Bienestar
        </CardTitle>
        <CardDescription>
          Análisis y predicciones de tu progreso
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {trendData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8"
          >
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No hay suficientes datos para mostrar tendencias.
            </p>
          </motion.div>
        ) : (
          <>
            {prediction && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium">Análisis Predictivo</span>
                  <Badge variant={getTrendColor(prediction.trend)}>
                    {prediction.trend === 'improving' ? 'Mejorando' :
                     prediction.trend === 'declining' ? 'Declinando' : 'Estable'}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {prediction.prediction}
                </p>
                <p className="text-sm font-medium text-primary">
                  💡 {prediction.recommendation}
                </p>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {Math.round(trendData.reduce((sum, d) => sum + d.score, 0) / trendData.length)}
                </div>
                <div className="text-sm text-muted-foreground">Score Promedio</div>
              </div>
              <div className="text-center p-3 bg-card border rounded-lg">
                <div className="text-2xl font-bold text-primary">
                  {trendData.length}
                </div>
                <div className="text-sm text-muted-foreground">Días Registrados</div>
              </div>
            </motion.div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default WellnessTrends;
