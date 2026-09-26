import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/shared/supabase/client';
import { format, subDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface SupplementLog {
  id: string;
  supplement_ean: string;
  supplement_name: string;
  taken_at: string;
  dose_taken: any;
  notes?: string;
  mood_before?: number;
  mood_after?: number;
}

interface WellnessHistory {
  recorded_date: string;
  overall_score: number;
  food_score: number;
  supplements_score: number;
  emotional_score: number;
  cosmetics_score: number;
}

export const SupplementHistory: React.FC = () => {
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [wellnessHistory, setWellnessHistory] = useState<WellnessHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(7); // días

  useEffect(() => {
    fetchHistoryData();
  }, [selectedPeriod]);

  const fetchHistoryData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const startDate = subDays(new Date(), selectedPeriod);

      // Fetch supplement logs
      const { data: logsData, error: logsError } = await supabase
        .from('supplement_logs')
        .select(`
          *,
          supplements(product_name)
        `)
        .eq('user_id', user.user.id)
        .gte('taken_at', startDate.toISOString())
        .order('taken_at', { ascending: false });

      if (logsError) throw logsError;

      const formattedLogs = logsData?.map(log => ({
        ...log,
        supplement_name: log.supplements?.product_name || 'Suplemento desconocido'
      })) || [];

      setSupplementLogs(formattedLogs);

      // Fetch wellness history
      const { data: wellnessData, error: wellnessError } = await supabase
        .from('wellness_score_history')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('recorded_date', format(startDate, 'yyyy-MM-dd'))
        .order('recorded_date', { ascending: true });

      if (wellnessError) throw wellnessError;

      // Map the data to match the WellnessHistory interface
      const mappedWellnessData = (wellnessData || []).map(item => ({
        ...item,
        emotional_score: 0, // Default value since not in DB yet
        cosmetics_score: 0  // Default value since not in DB yet
      }));
      
      setWellnessHistory(mappedWellnessData);
    } catch (error) {
      console.error('Error fetching history data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMoodIcon = (mood?: number) => {
    if (!mood) return null;
    if (mood >= 4) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (mood >= 3) return <CheckCircle className="w-4 h-4 text-yellow-500" />;
    return <AlertCircle className="w-4 h-4 text-red-500" />;
  };

  const getMoodText = (mood?: number) => {
    if (!mood) return 'No registrado';
    const moods = ['', 'Muy mal', 'Mal', 'Regular', 'Bien', 'Excelente'];
    return moods[mood] || 'No registrado';
  };

  const calculateAdherenceRate = () => {
    const totalDays = selectedPeriod;
    const daysWithLogs = new Set(
      supplementLogs.map(log => format(parseISO(log.taken_at), 'yyyy-MM-dd'))
    ).size;
    return Math.round((daysWithLogs / totalDays) * 100);
  };

  const formatChartData = () => {
    return wellnessHistory.map(entry => ({
      date: format(parseISO(entry.recorded_date), 'dd MMM', { locale: es }),
      'Puntuación General': entry.overall_score,
      'Alimentación': entry.food_score,
      'Suplementos': entry.supplements_score,
      'Bienestar Emocional': entry.emotional_score,
      'Cosméticos': entry.cosmetics_score,
    }));
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-40 mx-auto"></div>
              <div className="h-3 bg-muted/60 rounded w-28 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Historial y Tendencias
          </CardTitle>
          <div className="flex gap-2">
            {[7, 14, 30].map((days) => (
              <Button
                key={days}
                size="sm"
                variant={selectedPeriod === days ? "default" : "outline"}
                onClick={() => setSelectedPeriod(days)}
              >
                {days}d
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="wellness">Wellness Score</TabsTrigger>
            <TabsTrigger value="logs">Registro</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Adherencia</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {calculateAdherenceRate()}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Últimos {selectedPeriod} días
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Total Registros</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {supplementLogs.length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Suplementos tomados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Wellness Promedio</span>
                  </div>
                  <div className="text-2xl font-bold text-primary">
                    {wellnessHistory.length > 0 
                      ? Math.round(
                          wellnessHistory.reduce((acc, curr) => acc + curr.overall_score, 0) 
                          / wellnessHistory.length
                        )
                      : 0
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Puntuación media
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="wellness" className="space-y-4">
            {wellnessHistory.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formatChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="Puntuación General" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Suplementos" 
                      stroke="hsl(var(--chart-1))" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Alimentación" 
                      stroke="hsl(var(--chart-2))" 
                      strokeWidth={2}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="Bienestar Emocional" 
                      stroke="hsl(var(--chart-3))" 
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay datos de wellness score disponibles</p>
                <p className="text-sm">Los datos aparecerán cuando registres tu progreso</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            {supplementLogs.length > 0 ? (
              <div className="space-y-3">
                {supplementLogs.map((log) => (
                  <Card key={log.id} className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-foreground">
                          {log.supplement_name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                          <Clock className="w-3 h-3" />
                          <span>
                            {format(parseISO(log.taken_at), 'dd MMM, HH:mm', { locale: es })}
                          </span>
                        </div>
                      </div>
                      
                      {(log.mood_before || log.mood_after) && (
                        <div className="flex gap-4 mb-3">
                          {log.mood_before && (
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-3 py-1 rounded-full">
                              {getMoodIcon(log.mood_before)}
                              <span className="text-sm text-muted-foreground">
                                Antes: {getMoodText(log.mood_before)}
                              </span>
                            </div>
                          )}
                          {log.mood_after && (
                            <div className="flex items-center gap-2 bg-green-50 dark:bg-green-950/30 px-3 py-1 rounded-full">
                              {getMoodIcon(log.mood_after)}
                              <span className="text-sm text-muted-foreground">
                                Después: {getMoodText(log.mood_after)}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {log.dose_taken && (
                        <Badge variant="secondary" className="text-xs mb-3 bg-primary/10 text-primary border-primary/20">
                          Dosis: {JSON.stringify(log.dose_taken)}
                        </Badge>
                      )}
                      
                      {log.notes && (
                        <div className="bg-muted/50 p-3 rounded-lg border-l-2 border-l-primary/40">
                          <p className="text-sm text-muted-foreground italic">
                            "{log.notes}"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <div className="w-16 h-16 mx-auto mb-4 bg-muted/50 rounded-full flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-muted-foreground/60" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">No hay registros</h3>
                <p className="text-sm mb-4">Empieza a registrar cuando tomes tus suplementos</p>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar primera toma
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
