import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import * as Icons from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { supabase } from "@/shared/supabase/client";
import { Protocol, SupplementInProtocol } from "@/shared/types/protocols";
import { ToastAction } from "@/shared/components/ui/toast";
import { TimeSelectionDialog } from "@/shared/components/TimeSelectionDialog";
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const ProtocolDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [protocol, setProtocol] = useState<Protocol | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | boolean>(false);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<SupplementInProtocol | null>(null);

  // Cargar protocolo
  useEffect(() => {
    const fetchProtocols = async () => {
      try {
        const response = await fetch('/data/protocols.json');
        const data = await response.json();
        
        if (id) {
          // Buscar en todos los grupos
          let foundProtocol: Protocol | null = null;
          for (const group of data.groups || []) {
            foundProtocol = group.protocols.find((p: Protocol) => p.id === id);
            if (foundProtocol) break;
          }
          setProtocol(foundProtocol || null);
        }
      } catch (error) {
        console.error('Error loading protocols:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProtocols();
  }, [id]);

  const handleBack = () => {
    navigate('/protocols');
  };

  const Icon = protocol ? Icons[protocol.icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> || Icons.HelpCircle : Icons.HelpCircle;

  // Mutación para añadir suplemento al stack
  const addMutation = useMutation({
    mutationFn: async ({ supplement, preferredTime }: { supplement: SupplementInProtocol, preferredTime: 'morning' | 'midday' | 'night' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Debes iniciar sesión para añadir suplementos.");

      // Validar que el EAN existe en la tabla products antes de insertar
      const { data: productExists, error: productCheckError } = await (supabase as any)
        .from('products')
        .select('ean')
        .eq('ean', supplement.ean)
        .maybeSingle();

      if (productCheckError) {
        throw new Error(`Error verificando producto: ${productCheckError.message}`);
      }

      if (!productExists) {
        throw new Error(`Producto con EAN ${supplement.ean} no existe en la base de datos`);
      }

      const { error } = await supabase
        .from('user_supplement_stack')
        .insert({
          user_id: user.id,
          supplement_ean: supplement.ean,
          preferred_time: preferredTime
        });

      if (error) throw error;
      return supplement;
    },
    onSuccess: (addedSupplement) => {
      // Invalidar la caché para que todos los componentes se actualicen
      queryClient.invalidateQueries({ queryKey: ['userStack'] });
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard'] });
      toast({
        title: "¡Agregado al stack!",
        description: `${addedSupplement.name} se ha añadido a tu colección`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el suplemento.",
        variant: "destructive",
      });
    }
  });

  // Función mejorada para buscar productos relacionados
  const findRelatedProduct = async (supplementName: string) => {
    const searchTerms = supplementName.toLowerCase().split(' ').filter(term => term.length > 2);
    console.log(`[ProtocolDetail] Buscando productos relacionados para: "${supplementName}"`);
    console.log(`[ProtocolDetail] Términos de búsqueda:`, searchTerms);

    // Estrategia 1: Búsqueda exacta por nombre
    let { data: exactMatches, error: exactError } = await (supabase as any)
      .from('products')
      .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score')
      .ilike('product_name', `%${supplementName}%`)
      .not('ean', 'is', null) // Asegurar que el EAN no sea null
      .limit(3);

    if (exactError) {
      console.error('Error en búsqueda exacta:', exactError);
      exactMatches = [];
    }

    // Estrategia 2: Búsqueda por categorías
    let { data: categoryMatches, error: categoryError } = await (supabase as any)
      .from('products')
      .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score')
      .not('ean', 'is', null)
      .limit(3);

    if (categoryError) {
      console.error('Error en búsqueda por categorías:', categoryError);
      categoryMatches = [];
    }

    // Combinar y deduplicar resultados
    const allMatches = [...(exactMatches || []), ...(categoryMatches || [])];
    const uniqueMatches = allMatches.filter((product, index, self) => 
      index === self.findIndex(p => p.ean === product.ean)
    );

    console.log(`[ProtocolDetail] Encontrados ${uniqueMatches.length} productos relacionados`);
    return uniqueMatches.slice(0, 3); // Máximo 3 productos
  };

  const handleAddToStack = async (supplement: SupplementInProtocol) => {
    setSelectedSupplement(supplement);
    setShowTimeSelection(true);
  };

  const handleTimeSelection = (preferredTime: 'morning' | 'midday' | 'night') => {
    if (selectedSupplement) {
      addMutation.mutate({ supplement: selectedSupplement, preferredTime });
      setShowTimeSelection(false);
      setSelectedSupplement(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando protocolo...</p>
        </div>
      </div>
    );
  }

  if (!protocol) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Protocolo no encontrado</h1>
          <p className="text-muted-foreground mb-4">El protocolo solicitado no existe.</p>
          <button 
            onClick={handleBack}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Volver a Protocolos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>

      {/* Contenido del Protocolo */}
      <div className="p-4 space-y-6">
        {/* Información del Protocolo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-4"
        >
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-primary/10">
              <Icon className="h-12 w-12 text-primary" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">{protocol.name}</h1>
            <p className="text-muted-foreground text-lg">{protocol.description}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2">
            <Badge variant="secondary" className="text-sm">
              {protocol.duration}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {protocol.difficulty}
            </Badge>
            <Badge variant="outline" className="text-sm">
              {protocol.category}
            </Badge>
          </div>
        </motion.div>

        {/* Suplementos del Protocolo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-4"
        >
          <h2 className="text-2xl font-bold">Suplementos Incluidos</h2>
          
          <div className="grid gap-4">
            {protocol.supplements.map((supplement, index) => (
              <motion.div
                key={supplement.ean}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <h3 className="font-semibold text-lg">{supplement.name}</h3>
                    <p className="text-sm text-muted-foreground">{supplement.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {supplement.dosage}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {supplement.frequency}
                      </Badge>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => handleAddToStack(supplement)}
                    disabled={adding === supplement.ean}
                    className="ml-4"
                  >
                    <PlusCircle className="h-4 w-4 mr-1" />
                    {adding === supplement.ean ? 'Agregando...' : 'Agregar'}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Información Adicional */}
        {protocol.instructions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold">Instrucciones</h2>
            <div className="prose prose-sm max-w-none">
              <p className="text-muted-foreground whitespace-pre-line">
                {protocol.instructions}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal de Selección de Tiempo */}
      <TimeSelectionDialog
        open={showTimeSelection}
        onOpenChange={setShowTimeSelection}
        onTimeSelect={handleTimeSelection}
        supplementName={selectedSupplement?.name || ''}
      />
    </div>
  );
};
