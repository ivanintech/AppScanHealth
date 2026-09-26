import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { AlertTriangle, Shield } from 'lucide-react';
import { supabase } from "@/shared/supabase/client";
import { motion } from 'framer-motion';

interface Interaction {
  supplement1: string;
  supplement2: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

interface UserSupplement {
  supplement_ean: string;
  supplement_name: string;
}

const KNOWN_INTERACTIONS: Record<string, Interaction[]> = {
  'Iron': [
    {
      supplement1: 'Iron',
      supplement2: 'Calcium',
      severity: 'medium',
      description: 'El calcio puede reducir la absorción de hierro',
      recommendation: 'Tomar con 2 horas de diferencia'
    }
  ],
  'Calcium': [
    {
      supplement1: 'Calcium',
      supplement2: 'Iron',
      severity: 'medium',
      description: 'El calcio puede reducir la absorción de hierro',
      recommendation: 'Tomar con 2 horas de diferencia'
    }
  ]
};

const SupplementInteractions: React.FC = () => {
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserSupplements();
  }, []);

  useEffect(() => {
    if (userSupplements.length > 0) {
      checkInteractions();
    }
  }, [userSupplements]);

  const fetchUserSupplements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_supplement_stack')
        .select('supplement_ean, supplements(name)')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const formattedSupplements = (data || []).map(item => ({
        supplement_ean: item.supplement_ean,
        supplement_name: item.supplements?.name || 'Suplemento desconocido'
      }));
      
      setUserSupplements(formattedSupplements);
    } catch (error) {
      console.error('Error fetching user supplements:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkInteractions = () => {
    const foundInteractions: Interaction[] = [];
    const supplementNames = userSupplements.map(s => s.supplement_name);

    for (let i = 0; i < supplementNames.length; i++) {
      for (let j = i + 1; j < supplementNames.length; j++) {
        const supp1 = supplementNames[i];
        const supp2 = supplementNames[j];

        const interactions1 = KNOWN_INTERACTIONS[supp1]?.filter(
          interaction => interaction.supplement2 === supp2
        ) || [];

        foundInteractions.push(...interactions1);
      }
    }

    setInteractions(foundInteractions);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
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
          <div className="h-20 bg-muted rounded animate-pulse"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-primary" />
          Interacciones de Suplementos
        </CardTitle>
        <CardDescription>
          Detección automática de posibles interacciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {interactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-6"
          >
            <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">
              No se detectaron interacciones entre tus suplementos
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {interactions.map((interaction, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-4 rounded-lg border bg-card"
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 mt-0.5 text-orange-500" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">{interaction.supplement1}</span>
                      <span className="text-muted-foreground">+</span>
                      <span className="font-medium">{interaction.supplement2}</span>
                      <Badge variant={getSeverityColor(interaction.severity)}>
                        {interaction.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {interaction.description}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      💡 {interaction.recommendation}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SupplementInteractions;
