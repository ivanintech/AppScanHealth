import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Trophy, Zap, Target, LineChart, TrendingUp, TrendingDown, Minus, CalendarCheck, Flame } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/shared/components/ui/badge';

type TimeRange = '7D' | '30D' | 'ALL';

// Definimos la estructura de los datos que el componente espera recibir
interface ProgressTrendsProps {
  kpis: {
    current_streak: number;
    longest_streak: number;
    weekly_adherence: number;
    active_days_last_30: number;
    weekly_completed_days: number;
  } | null;
  chartData: {
    date: string;
    overall_score: number;
  }[] | null;
  selectedDate: Date;
  isLoading: boolean;
}

const formatDateForChart = (date: Date) => {
  // Return a reliable ISO string slice (YYYY-MM-DD) for processing
  return date.toISOString().slice(0, 10);
};

interface KpiCardProps {
  kpi: {
    key: string;
    title: string;
    value: string | number;
    icon?: React.ComponentType<{ className?: string }>;
    colorClass?: string;
    trend?: string;
    trendText?: string;
    subtitle?: string;
  };
  animationDelay: number;
}

const KpiCard = ({ kpi, animationDelay }: KpiCardProps) => {
  const Icon = kpi.icon;
  
  // Custom rendering for Score Actual card
  if (kpi.key === 'score_actual') {
    let TrendIcon = Minus;
    let trendColor = "bg-gray-100 text-gray-800";
    if (kpi.trend === 'up') {
      TrendIcon = TrendingUp;
      trendColor = "bg-green-100 text-green-800";
    } else if (kpi.trend === 'down') {
      TrendIcon = TrendingDown;
      trendColor = "bg-red-100 text-red-800";
    }

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: animationDelay }}
        className="text-center p-3 rounded-lg border bg-blue-50 border-blue-200 text-blue-800"
      >
        <div className="text-xl font-bold">{kpi.value}</div>
        <div className="text-xs font-medium mb-1">{kpi.title}</div>
        <Badge className={`flex items-center justify-center gap-1 text-xs ${trendColor}`}>
          <TrendIcon className="w-3 h-1.5" />
          <span>{kpi.trendText}</span>
        </Badge>
      </motion.div>
    );
  }

  // Default rendering for other cards
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: animationDelay }}
      className={`text-center p-3 rounded-lg border ${kpi.colorClass}`}
    >
      <Icon className="h-5 w-5 mx-auto mb-1" />
      <div className="text-xl font-bold">{kpi.value}</div>
      <div className="text-xs font-medium">{kpi.title}</div>
      {kpi.subtitle && (
        <div className="text-xs opacity-75 mt-1">{kpi.subtitle}</div>
      )}
    </motion.div>
  );
};


const processChartData = (
  history: { date: string; overall_score?: number; adherence_percentage?: number }[] | null,
  timeRange: TimeRange,
  selectedDate: Date
) => {
  if (!history || history.length === 0) {
    return [];
  }

  // Usar solo los datos reales, sin generar datos ficticios
  const realHistory = history;

  // Filtrar datos según el rango de tiempo seleccionado
  const now = new Date(selectedDate);
  let startDate: Date;

  switch (timeRange) {
    case '7D':
      // Para 7D, filtrar solo los datos de adherencia (weeklyAdherence)
      const weeklyData = realHistory.filter(item => {
        const itemDate = new Date(item.date);
        const daysDiff = Math.abs((itemDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff <= 7; // Últimos 7 días
      });
      return weeklyData.map(item => ({
        date: item.date,
        overall_score: item.overall_score
      }));
    case '30D':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29); // Últimos 30 días incluyendo hoy
      break;
    case 'ALL':
      // Para ALL, devolver todos los datos disponibles
      return realHistory.map(item => ({
        date: item.date,
        overall_score: item.overall_score
      }));
    default:
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
  }

  // Crear un array completo de fechas para el rango seleccionado
  const completeDateRange = [];
  const currentDate = new Date(startDate);
  
  while (currentDate <= now) {
    const dateStr = currentDate.toISOString().slice(0, 10);
    
    // Buscar si hay datos reales para esta fecha
    const realData = realHistory.find(item => item.date === dateStr);
    
    // Determinar qué valor usar: adherence_percentage o overall_score
    const scoreValue = realData ? 
      (realData.adherence_percentage !== undefined ? realData.adherence_percentage : realData.overall_score) : 0;
    
    completeDateRange.push({
      date: dateStr,
      overall_score: scoreValue // Usar el valor apropiado
    });
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return completeDateRange;
};

const ProgressTrends: React.FC<ProgressTrendsProps> = React.memo(({ kpis: kpisFromProps, chartData, selectedDate, isLoading }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('7D');
  const [debouncedTimeRange, setDebouncedTimeRange] = useState<TimeRange>('7D');
  
  // Component props are ready
  
  // Debounce para evitar cambios demasiado rápidos de timeRange
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTimeRange(timeRange);
    }, 50); // 50ms de debounce - más responsivo para mobile
    
    return () => clearTimeout(timer);
  }, [timeRange]);
  
  // Log de rendimiento para el componente
  // Debug log removido para limpieza
  
  // Log de props para identificar cambios
  // Debug log removido para limpieza
  
  // Memoizar la función getKpis para evitar re-creaciones innecesarias
  const getKpis = useCallback(() => {
    const kpiStartTime = performance.now();
    // Performance log removido para limpieza
    if (!kpisFromProps) {
      return [];
    }
    
    // Debug log removido para limpieza

    // Calcular métricas adicionales
    const weeklyAdherence = Math.round(kpisFromProps.weekly_adherence || 0);
    const activeDays = kpisFromProps.active_days_last_30 || 0;
    const currentStreak = kpisFromProps.current_streak || 0;
    
    // Determinar estado de adherencia
    const getAdherenceStatus = (adherence: number) => {
      if (adherence >= 80) return { status: 'Excelente', color: 'text-green-600', bg: 'bg-green-50 border-green-200' };
      if (adherence >= 60) return { status: 'Buena', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' };
      if (adherence >= 40) return { status: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' };
      return { status: 'Baja', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
    };
    
    const adherenceStatus = getAdherenceStatus(weeklyAdherence);
    
    const kpiList: Array<{
      key: string;
      title: string;
      value: string | number;
      icon?: React.ComponentType<{ className?: string }>;
      colorClass?: string;
      trend?: string;
      trendText?: string;
      subtitle?: string;
    }> = [
      {
        key: 'weekly_adherence',
        title: 'Adherencia Semanal',
        value: `${weeklyAdherence}%`,
        subtitle: adherenceStatus.status,
        icon: Target,
        colorClass: `${adherenceStatus.bg} ${adherenceStatus.color}`
      },
      {
        key: 'active_days_last_30',
        title: 'Días Activos',
        value: `${activeDays} / 30`,
        subtitle: `${Math.round((activeDays / 30) * 100)}% del mes`,
        icon: CalendarCheck,
        colorClass: 'bg-violet-50 border-violet-200 text-violet-800'
      },
    ];

    // Calculate and add Score Actual KPI from chart data for the selected date
    const selectedDateStr = formatDateForChart(selectedDate);
    
    // Debug logs para Score Actual (comentados para evitar spam)
    // console.log('📊 [ProgressTrends] Calculating Score Actual:', {
    //   selectedDate: selectedDate.toISOString(),
    //   selectedDateStr,
    //   chartDataLength: chartData?.length || 0,
    //   allChartDates: chartData?.map(item => item.date) || [],
    //   chartDataSample: chartData?.slice(0, 3) || []
    // });
    
    let selectedDateScore: number | null = null;
    
    // Buscar score en los datos del chart
    if (chartData && chartData.length > 0) {
      const foundScore = chartData.find(item => 
        item && item.date && (
          item.date === selectedDateStr || 
          item.date.startsWith(selectedDateStr)
        )
      )?.overall_score;
      
      selectedDateScore = foundScore !== undefined ? foundScore : null;
    }
    
    
    // Si no hay score para la fecha seleccionada, calcular uno basado en adherencia
    if (selectedDateScore === null) {
      // Calcular score basado en adherencia de suplementos del día
      const today = new Date();
      const isToday = selectedDateStr === formatDateForChart(today);
      
      if (isToday && kpisFromProps) {
        // Para el día actual, calcular score basado en adherencia semanal
        // Si la adherencia es 0, el score también será 0
        // Si la adherencia es 100%, el score será 100
        const adherenceScore = Math.round(kpisFromProps.weekly_adherence || 0);
        selectedDateScore = Math.max(0, Math.min(100, adherenceScore));
        
      } else {
        // Para días pasados sin datos, usar el último score disponible
        const lastAvailableScore = chartData?.slice().reverse().find(item => 
          item.overall_score !== null && item.overall_score !== undefined
        )?.overall_score;
        
        selectedDateScore = lastAvailableScore || 0;
        
      }
    }
    
    if (selectedDateScore !== null) {
        let trend = 'stable';
        let trendText = 'Estable';
        
        // Find the previous day's score for trend calculation
        const previousDate = new Date(selectedDate);
        previousDate.setDate(selectedDate.getDate() - 1);
        const previousDateStr = formatDateForChart(previousDate);
        const previousScore = chartData?.find(item => 
          item.date === previousDateStr || 
          (item.date && item.date.startsWith(previousDateStr))
        )?.overall_score;
        
        if (previousScore !== undefined && previousScore !== null) {
          if (selectedDateScore > previousScore) {
            trend = 'up';
            trendText = 'Mejorando';
          } else if (selectedDateScore < previousScore) {
            trend = 'down';
            trendText = 'Empeorando';
          }
        } else {
          // Si no hay score previo, usar tendencia estable
          trend = 'stable';
          trendText = 'Estable';
        }
        
        kpiList.unshift({
          key: 'score_actual',
          title: 'Score Actual',
          value: selectedDateScore,
          trend: trend,
          trendText: trendText,
        });
        
      } else {
      }

    const kpiEndTime = performance.now();
    // Performance log removido para limpieza
    
    return kpiList;
  }, [kpisFromProps, chartData, selectedDate.toISOString().split('T')[0]]); // Solo la fecha como string, no el objeto Date completo
  
  // Memoizar kpiData para evitar re-cálculos innecesarios
  const kpiData = useMemo(() => {
    // Performance log removido para limpieza
    return getKpis();
  }, [getKpis]);
  
  const processedChartData = useMemo(() => {
    const chartStartTime = performance.now();
    // Debug log removido para limpieza
    
    const result = processChartData(chartData, debouncedTimeRange, selectedDate);
    
    const chartEndTime = performance.now();
    // Performance log removido para limpieza
    
    return result;
  }, [chartData, debouncedTimeRange, selectedDate.toISOString().split('T')[0]]);

  const CustomTooltip = useCallback(({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length && label) {
      const date = new Date(label);
      const score = payload[0].value;
      
      // Determinar el nivel de adherencia basado en el score
      let adherenceLevel = '';
      let levelColor = '';
      
      if (score >= 80) {
        adherenceLevel = 'Excelente adherencia';
        levelColor = 'text-green-600';
      } else if (score >= 60) {
        adherenceLevel = 'Buena adherencia';
        levelColor = 'text-blue-600';
      } else if (score >= 40) {
        adherenceLevel = 'Adherencia regular';
        levelColor = 'text-yellow-600';
      } else {
        adherenceLevel = 'Adherencia baja';
        levelColor = 'text-red-600';
      }
      
      return (
        <div className="bg-background border border-border rounded-md p-3 shadow-lg max-w-48">
          <p className="font-semibold text-muted-foreground text-sm">
            {date.toLocaleDateString('es-ES', { 
              weekday: 'short',
              day: 'numeric', 
              month: 'short', 
              timeZone: 'UTC' 
            })}
          </p>
          <div className="mt-1">
            <p className="text-lg font-bold text-primary">{score}%</p>
            <p className={`text-xs font-medium ${levelColor}`}>{adherenceLevel}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {score > 0 ? 'Suplementos tomados' : 'Sin registro'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  }, []); // Usar debouncedTimeRange
  
  const hasDataForChart = useMemo(() => 
    processedChartData?.some(d => d.overall_score !== null), 
    [processedChartData]
  );
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-8 w-48 bg-muted/80 rounded-md animate-pulse"></div>
          <div className="h-4 w-64 bg-muted/50 rounded-md animate-pulse mt-2"></div>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <LineChart className="w-6 h-6 text-primary" />
            <CardTitle>Progreso y Tendencias</CardTitle>
          </div>
        </div>
        <CardDescription>
          Tu evolución de adherencia a suplementos y bienestar general.
          <br />
          <span className="text-xs text-muted-foreground">
            Basado en la adherencia a tu stack de suplementos y datos de bienestar registrados.
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {kpiData.map((kpi, index) => (
            <KpiCard key={kpi.key} kpi={kpi} animationDelay={index * 0.1} />
          ))}
        </div>
        <div className="mt-4 flex justify-center space-x-2">
          {(['7D', '30D', 'ALL'] as const).map(range => {
            const isActive = debouncedTimeRange === range;
            return (
              <Button
                key={range}
                size="sm"
                variant={isActive ? 'default' : 'ghost'}
                onClick={() => {
                  // Debug log removido para limpieza
                  setTimeRange(range);
                }}
                className="text-xs px-3"
                // Optimización: evitar re-renderizado innecesario
                style={{ 
                  transition: 'all 0.2s ease-in-out',
                  willChange: isActive ? 'background-color, color' : 'auto'
                }}
              >
                {range}
              </Button>
            );
          })}
          </div>
        <div className="h-60 mt-4 relative">
          {/* Etiqueta del eje Y */}
          <div className="absolute left-1 -top-7 z-10">
            <div className="text-xs text-muted-foreground font-medium">
              Adherencia %
            </div>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            {hasDataForChart ? (
              <AreaChart 
                data={processedChartData} 
                margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                // Optimizaciones de rendimiento para Recharts
                syncId="progressChart"
                throttleDelay={16} // 60fps
              >
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(str) => {
                    const date = new Date(str);
                    return date.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', timeZone: 'UTC' });
                  }}
                  interval={debouncedTimeRange === '7D' ? 0 : undefined}
                  padding={{ left: 20 }}
                  // Optimización: evitar re-renderizado de ticks
                  allowDataOverflow={false}
                />
                <YAxis 
                  width={40}
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                  stroke="hsl(var(--muted-foreground))"
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                  tickCount={6}
                  // Optimización: evitar re-renderizado innecesario
                  allowDataOverflow={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="overall_score" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  fillOpacity={1} 
                  fill="url(#colorScore)" 
                  connectNulls
                  // Optimización: animación más suave
                  animationDuration={300}
                  animationEasing="ease-out"
                />
              </AreaChart>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="mx-auto h-10 w-10 mb-2" />
                  <p className="font-semibold">¡Comienza tu viaje!</p>
                  <p className="text-sm">Registra tu primer suplemento para ver tu progreso.</p>
                </div>
            </div>
          )}
          </ResponsiveContainer>
          
          {/* Leyenda simplificada */}
          <div className="mt-0 mb-2 text-center">
            <p className="text-xs text-muted-foreground">
              Porcentaje de suplementos tomados vs. tu stack total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function para React.memo - optimizada para mobile
  const isLoadingSame = prevProps.isLoading === nextProps.isLoading;
  const selectedDateSame = prevProps.selectedDate.toISOString().split('T')[0] === nextProps.selectedDate.toISOString().split('T')[0];
  
  // Comparación más eficiente para arrays
  const kpisSame = prevProps.kpis === nextProps.kpis || 
    (prevProps.kpis && nextProps.kpis && 
     prevProps.kpis.weekly_adherence === nextProps.kpis.weekly_adherence &&
     prevProps.kpis.active_days_last_30 === nextProps.kpis.active_days_last_30 &&
     prevProps.kpis.current_streak === nextProps.kpis.current_streak);
  
  const chartDataSame = prevProps.chartData === nextProps.chartData ||
    (prevProps.chartData?.length === nextProps.chartData?.length &&
     prevProps.chartData?.length === 0); // Si ambos están vacíos, son iguales
  
  const shouldSkipRender = isLoadingSame && selectedDateSame && kpisSame && chartDataSame;
  
  // Solo log cuando hay cambios para evitar spam
  if (!shouldSkipRender) {
    // Debug log removido para limpieza
  }
  
  return shouldSkipRender;
});

export default ProgressTrends;
