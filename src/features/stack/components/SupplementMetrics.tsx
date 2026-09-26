import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Progress } from '@/shared/components/ui/progress';
import { Award, Shield, BookOpen, Target } from 'lucide-react';
import { useSupplementScoring } from '@/features/analytics/hooks/useSupplementScoring';

interface SupplementMetricsProps {
  supplementData: any;
  examineData: {
    research?: {
      studies: number;
      evidence: 'High' | 'Medium' | 'Low';
    };
  } | null;
}

// Devuelve clases de color según el valor (para barra, círculo y texto)
const getScoreClasses = (score: number) => {
  if (score >= 75) {
    return {
      bar: 'bg-emerald-600',
      stroke: 'stroke-emerald-600',
      text: 'text-emerald-600',
    };
  }
  if (score >= 50) {
    return {
      bar: 'bg-emerald-500',
      stroke: 'stroke-emerald-500',
      text: 'text-emerald-500',
    };
  }
  if (score >= 25) {
    return {
      bar: 'bg-orange-400',
      stroke: 'stroke-orange-400',
      text: 'text-orange-400',
    };
  }
  return {
    bar: 'bg-red-600',
    stroke: 'stroke-red-600',
    text: 'text-red-600',
  };
};

export const SupplementMetrics: React.FC<SupplementMetricsProps> = ({ supplementData, examineData }) => {
  const { scoringData, loading, error } = useSupplementScoring(supplementData);

  // Usar el scoring real o fallback al calculated_score
  const overallScore = scoringData?.total || supplementData.calculated_score || 75;
  const safetyScore = scoringData?.seguridad_60?.score ? Math.round((scoringData.seguridad_60.score / 60) * 100) : 0;
  const efficacyScore = scoringData?.eficacia_30?.score ? Math.round((scoringData.eficacia_30.score / 30) * 100) : 0;
  const transparencyScore = scoringData?.extra_10?.score ? Math.round(scoringData.extra_10.score) : 0;

  // const metrics = [
  //   {
  //     label: 'Puntuación General',
  //     value: overallScore,
  //     icon: Award,
  //     color: scoreColor,
  //     bgColor: scoreBgColor,
  //     description: 'Evaluación integral del producto'
  //   },
  //   {
  //     label: 'Transparencia',
  //     value: transparencyScore,
  //     icon: BookOpen,
  //     color: transparencyScore >= 80 ? 'text-green-600' : transparencyScore >= 60 ? 'text-yellow-600' : 'text-red-600',
  //     bgColor: transparencyScore >= 80 ? 'bg-green-50 border-green-200' : transparencyScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
  //     description: 'Completitud de la información'
  //   },
  //   {
  //     label: 'Seguridad',
  //     value: safetyScore,
  //     icon: Shield,
  //     color: safetyScore >= 80 ? 'text-green-600' : safetyScore >= 60 ? 'text-yellow-600' : 'text-red-600',
  //     bgColor: safetyScore >= 80 ? 'bg-green-50 border-green-200' : safetyScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
  //     description: 'Información de alérgenos y seguridad'
  //   },
  //   {
  //     label: 'Investigación',
  //     value: researchScore,
  //     icon: TrendingUp,
  //     color: researchScore >= 80 ? 'text-green-600' : researchScore >= 60 ? 'text-yellow-600' : 'text-red-600',
  //     bgColor: researchScore >= 80 ? 'bg-green-50 border-green-200' : researchScore >= 60 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200',
  //     description: 'Evidencia científica disponible'
  //   }
  // ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Card className="w-48 h-48">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground mt-4">Calculando puntuación...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center">
          <Card className="w-48 h-48 bg-red-50 border-red-200">
            <CardContent className="flex flex-col items-center justify-center h-full p-6">
              <div className="text-red-500 mb-2">⚠️</div>
              <p className="text-sm text-red-700 text-center">Error calculando puntuación</p>
              <p className="text-xs text-red-600 text-center mt-2">Usando puntuación de base de datos</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Award className="w-5 h-5 text-primary" />
          Evaluación del Producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          {/* Circular Score */}
          <div className="flex flex-col items-center justify-center w-24">
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" stroke="hsl(var(--muted))" strokeWidth="8" fill="none" />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="40"
                  className={getScoreClasses(overallScore).stroke}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray="250"                                     // Longitud total de la circunferencia
                  strokeDashoffset="250"                                    // Empieza completamente vacío
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 250 }}                       // Empieza vacío
                  animate={{ strokeDashoffset: 250 - overallScore * 2.5 }}  // Avanza hacia la derecha
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreClasses(overallScore).text}`}>{Math.round(overallScore)}</span>
              </div>
            </div>
            <span className="mt-2 text-xs text-muted-foreground font-medium">Puntuación</span>
          </div>
          {/* Barras de métricas */}
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-foreground font-medium">
                {/* <Shield className="w-4 h-4 text-blue-600" /> */}
                Seguridad
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {Math.round(scoringData?.seguridad_60?.score || 0)}/60
              </span>
            </div>
            <Progress
              value={scoringData?.seguridad_60?.score ? (Math.round(scoringData.seguridad_60.score) / 60) * 100 : 0}
              className="h-[3px] rounded-full"
              indicatorClassName={`${getScoreClasses(safetyScore).bar} rounded-full`}
            />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-foreground font-medium">
                {/* <Target className="w-4 h-4 text-green-600" /> */}
                Eficacia
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {Math.round(scoringData?.eficacia_30?.score || 0)}/30
              </span>
            </div>
            <Progress
              value={scoringData?.eficacia_30?.score ? (Math.round(scoringData.eficacia_30.score) / 30) * 100 : 0}
              className="h-[3px] rounded-full"
              indicatorClassName={`${getScoreClasses(efficacyScore).bar} rounded-full`}
            />

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm text-foreground font-medium">
                {/* <BookOpen className="w-4 h-4 text-yellow-600" /> */}
                Transparencia
              </span>
              <span className="text-xs font-bold text-muted-foreground">
                {Math.round(scoringData?.extra_10?.score || 0)}/10
              </span>
            </div>
            <Progress
              value={scoringData?.extra_10?.score ? (Math.round(scoringData.extra_10.score) / 10) * 100 : 0}
              className="h-[3px] rounded-full"
              indicatorClassName={`${getScoreClasses(transparencyScore * 10).bar} rounded-full`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};