import React, { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';
import { SupplementReminder } from '@/features/stack/components/SupplementReminder';
import { SupplementHistory } from '@/features/stack';
import { LogSupplementIntake } from '@/features/stack/components/LogSupplementIntake';
import { SupplementInteractions } from '@/features/stack';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Bell, TrendingUp, Plus, Shield } from 'lucide-react';
import { supabase } from "@/shared/supabase/client";
import { useToast } from '@/shared/hooks/use-toast';

interface UserSupplement {
  ean: string;
  name: string;
}

export const CoreFeatures = () => {
  const [userSupplements, setUserSupplements] = useState<UserSupplement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchUserSupplements = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        toast({
          title: "Acceso requerido",
          description: "Necesitas estar autenticado para usar estas funciones",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('user_supplement_stack')
        .select('supplement_ean')
        .eq('user_id', user.user.id);

      if (error) throw error;

      // Por ahora, usar el EAN como nombre hasta que se configure la tabla correctamente
      const supplements = data?.map(item => ({
        ean: item.supplement_ean,
        name: item.supplement_ean || 'Suplemento desconocido'
      })) || [];

      setUserSupplements(supplements);
    } catch (error) {
      console.error('Error fetching user supplements:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus suplementos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUserSupplements();
  }, [fetchUserSupplements]);

  const handleLogAdded = () => {
    // Refrescar datos cuando se añade un nuevo log
    toast({
      title: "¡Registrado!",
      description: "Tu toma ha sido registrada en el historial",
    });
  };

    if (isLoading) {
      return (
        <div className="min-h-screen bg-background pb-20">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="space-y-6 animate-pulse">
              <div className="space-y-3">
                <div className="h-8 bg-muted rounded w-64"></div>
                <div className="h-4 bg-muted/60 rounded w-96"></div>
              </div>
              <div className="grid gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-muted rounded-xl"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Funciones Avanzadas
          </h1>
          <p className="text-muted-foreground">
            Gestiona tus suplementos de forma inteligente con recordatorios, 
            seguimiento y análisis de interacciones.
          </p>
        </header>

        {userSupplements.length === 0 ? (
          <Card className="border-dashed border-2 hover:border-primary/30 transition-colors">
            <CardContent className="p-12 text-center">
              <div className="space-y-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                  <Plus className="w-10 h-10 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-foreground">
                    Agrega suplementos a tu stack
                  </h3>
                  <p className="text-muted-foreground max-w-sm mx-auto">
                    Para usar las funciones avanzadas, primero necesitas agregar 
                    suplementos a tu colección personal.
                  </p>
                </div>
                <div className="pt-2">
                  <Button className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all">
                    <Plus className="w-4 h-4 mr-2" />
                    Explorar Suplementos
                  </Button>
                  <p className="text-xs text-muted-foreground mt-3">
                    Ve a la sección "Explore" para buscar y agregar suplementos.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="reminders" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1 rounded-lg">
              <TabsTrigger value="reminders" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Recordatorios</span>
              </TabsTrigger>
              <TabsTrigger value="log" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Registrar</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Historial</span>
              </TabsTrigger>
              <TabsTrigger value="interactions" className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Interacciones</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="reminders">
              <SupplementReminder userSupplements={userSupplements} />
            </TabsContent>

            <TabsContent value="log">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" />
                    Registrar Toma de Suplemento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Registra cuando tomes tus suplementos para llevar un seguimiento 
                      de tu adherencia y poder analizar tendencias en tu bienestar.
                    </p>
                    <div className="flex justify-center">
                      <LogSupplementIntake 
                        userSupplements={userSupplements}
                        onLogAdded={handleLogAdded}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <SupplementHistory />
            </TabsContent>

            <TabsContent value="interactions">
              <SupplementInteractions />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};
