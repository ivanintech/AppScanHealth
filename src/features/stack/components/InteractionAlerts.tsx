import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { AlertTriangle, AlertCircle, Info, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

interface SupplementInteraction {
  id: string;
  supplement_a_ean: string;
  supplement_b_ean: string;
  interaction_type: 'positive' | 'negative' | 'caution' | 'neutral' | 'timing' | 'absorption' | 'synergy' | 'antagonist' | 'contraindication' | 'food_interaction';
  severity: 'low' | 'medium' | 'high' | 'critical' | 'info' | 'positive' | 'warning';
  description: string;
  recommendation?: string;
  time_gap_hours?: number;
  scientific_evidence?: string;
  created_at: string;
  supplement_a?: {
    product_name: string;
    image_url?: string;
  };
  supplement_b?: {
    product_name: string;
    image_url?: string;
  };
}

export const InteractionAlerts = () => {
  const { user } = useAuth();
  const [interactions, setInteractions] = useState<SupplementInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStack, setUserStack] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchUserStack();
    }
  }, [user]);

  useEffect(() => {
    if (userStack.length > 0) {
      fetchInteractions();
    }
  }, [userStack]);

  const fetchUserStack = async () => {
    try {
      const { data, error } = await supabase
        .from('user_supplement_stack')
        .select('supplement_ean')
        .eq('user_id', user?.id);

      if (error) throw error;
      setUserStack(data?.map(item => item.supplement_ean) || []);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const fetchInteractions = async () => {
    try {
      setLoading(true);
      
      if (userStack.length < 2) {
        setInteractions([]);
        return;
      }

      // Buscar interacciones entre suplementos del stack del usuario
      const { data, error } = await supabase
        .from('supplement_interactions')
        .select(`
          *,
          supplement_a:supplement_a_ean (
            product_name,
            image_url
          ),
          supplement_b:supplement_b_ean (
            product_name,
            image_url
          )
        `)
        .in('supplement_a_ean', userStack)
        .in('supplement_b_ean', userStack)
        .order('severity', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInteractions(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'medium': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Info className="h-4 w-4 text-blue-500" />;
      case 'positive': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'positive': return 'bg-green-100 text-green-800';
      case 'negative': return 'bg-red-100 text-red-800';
      case 'caution': return 'bg-yellow-100 text-yellow-800';
      case 'synergy': return 'bg-purple-100 text-purple-800';
      case 'antagonist': return 'bg-red-100 text-red-800';
      case 'contraindication': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Interacciones
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
            <AlertTriangle className="h-5 w-5" />
            Alertas de Interacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error cargando interacciones: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (userStack.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Interacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Necesitas al menos 2 suplementos en tu stack para detectar interacciones.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (interactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas de Interacciones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">
              ¡Excelente! No se detectaron interacciones problemáticas en tu stack actual.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas de Interacciones ({interactions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {interactions.map((interaction) => (
          <div key={interaction.id} className={`border rounded-lg p-4 ${getSeverityColor(interaction.severity)}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getSeverityIcon(interaction.severity)}
                <h4 className="font-semibold">Interacción Detectada</h4>
              </div>
              <Badge className={getInteractionTypeColor(interaction.interaction_type)}>
                {interaction.interaction_type.replace('_', ' ')}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {interaction.supplement_a?.image_url && (
                    <img 
                      src={interaction.supplement_a.image_url} 
                      alt={interaction.supplement_a.product_name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <span className="font-medium">{interaction.supplement_a?.product_name}</span>
                </div>
                
                <span className="text-muted-foreground">+</span>
                
                <div className="flex items-center gap-2">
                  {interaction.supplement_b?.image_url && (
                    <img 
                      src={interaction.supplement_b.image_url} 
                      alt={interaction.supplement_b.product_name}
                      className="w-8 h-8 rounded object-cover"
                    />
                  )}
                  <span className="font-medium">{interaction.supplement_b?.product_name}</span>
                </div>
              </div>
              
              <p className="text-sm">{interaction.description}</p>
              
              {interaction.recommendation && (
                <div className="bg-white/50 rounded p-3">
                  <h5 className="font-medium text-sm mb-1">Recomendación:</h5>
                  <p className="text-sm">{interaction.recommendation}</p>
                </div>
              )}
              
              {interaction.time_gap_hours && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Separar por {interaction.time_gap_hours} horas</span>
                </div>
              )}
              
              {interaction.scientific_evidence && (
                <details className="text-sm">
                  <summary className="cursor-pointer font-medium">Evidencia Científica</summary>
                  <p className="mt-2 text-muted-foreground">{interaction.scientific_evidence}</p>
                </details>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
