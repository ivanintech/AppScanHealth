import React, { useState, useEffect } from 'react';

// Helper function para normalizar texto de búsqueda
const normalizeSearchText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD') // Descompone caracteres acentuados
    .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, acentos)
    .replace(/[ñ]/g, 'n') // Convierte ñ a n
    .replace(/[ç]/g, 'c') // Convierte ç a c
    .trim();
};
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { Sunrise, Sun, Moon, Plus, Search, Trash2, Package, Star, AlertCircle, BarChart3, Award, Shield, Leaf } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { TimeSelectionDialog } from '@/shared/components/TimeSelectionDialog';
import { useNavigate } from 'react-router-dom';
import { useUserStack, UserStackItem } from '../hooks/useUserStack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { formatProductInfo, getBrandFromTags, getCategoryFromTags, getLabelsFromTags } from '@/shared/lib/utils';
import { LoadingPage } from '@/shared/components/ui/ProfessionalLoading';

interface Supplement {
  ean: string;
  product_name?: string;
  brands_tags?: string;
  image_url?: string;
  categories_tags?: string;
  calculated_score?: number;
}

interface SupplementStackProps {
  onSupplementClick?: (supplement: Supplement) => void;
}

const SupplementStack: React.FC<SupplementStackProps> = ({ onSupplementClick }) => {
  // Estados para la UI (búsqueda, modales, etc.)
  const [availableSupplements, setAvailableSupplements] = useState<Supplement[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);

  // Hooks principales
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 1. Usamos el hook centralizado para obtener el stack del usuario. ¡Nuestra única fuente de verdad!
  const { data: userStack = [], isLoading: loading } = useUserStack();

  useEffect(() => {
    // Log para depuración: muestra los datos del hook cuando cambian.
    console.log('[SupplementStack] Datos recibidos del hook useUserStack:', userStack);
  }, [userStack]);

  // La obtención de suplementos disponibles se mantiene local a esta página, ya que no se comparte.
  useEffect(() => {
    fetchAvailableSupplements();
  }, []);

  // Manejar búsqueda automática desde URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      console.log('🔍 [SupplementStack] Auto-search from URL:', searchParam);
      setSearchQuery(searchParam);
      searchSupplements(searchParam);
    }
  }, []);

  const fetchAvailableSupplements = async () => {
    try {
      setSearchLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score')
        .limit(20);

      if (error) throw error;

      setAvailableSupplements(data || []);
    } catch (error) {
      console.error('Error fetching supplements:', error);
      setAvailableSupplements([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const searchSupplements = async (query: string) => {
    if (!query.trim()) {
      fetchAvailableSupplements();
      return;
    }

    try {
      setSearchLoading(true);

      // Normalizar la consulta de búsqueda
      const normalizedQuery = normalizeSearchText(query);

      // Buscar con múltiples variaciones para mayor flexibilidad
      const searchTerms = [
        query, // Búsqueda original
        normalizedQuery, // Búsqueda normalizada
        query.toLowerCase(), // Búsqueda en minúsculas
        query.toUpperCase() // Búsqueda en mayúsculas
      ];

      // Crear condiciones de búsqueda más flexibles
      const searchConditions = searchTerms.map(term =>
        `product_name.ilike.%${term}%, brands_tags.ilike.%${term}%`
      ).join(',');

      const { data, error } = await supabase
        .from('products')
        .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score')
        .or(searchConditions)
        .limit(20);

      if (error) throw error;

      // Filtrar resultados adicionales en el frontend para mayor precisión
      const filteredData = (data || []).filter(product => {
        const productName = normalizeSearchText(product.product_name || '');
        const brandTags = normalizeSearchText(product.brands_tags || '');
        const normalizedQuery = normalizeSearchText(query);

        return productName.includes(normalizedQuery) ||
          brandTags.includes(normalizedQuery);
      });

      setAvailableSupplements(filteredData);
    } catch (error) {
      console.error('Error searching supplements:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  // 2. Mutación para AÑADIR un suplemento al stack con OPTIMISTIC UPDATES.
  const addMutation = useMutation({
    mutationFn: async ({ supplement, preferredTime }: { supplement: Supplement, preferredTime: 'morning' | 'midday' | 'night' }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso requerido");

      const { error } = await supabase
        .from('user_supplement_stack')
        .insert({
          user_id: user.id,
          supplement_ean: supplement.ean,
          preferred_time: preferredTime
        });

      if (error) throw error;
      return { supplement, preferredTime };
    },
    onMutate: async ({ supplement, preferredTime }) => {
      // OPTIMISTIC UPDATE: Actualizar UI inmediatamente
      await queryClient.cancelQueries({ queryKey: ['userStack'] });

      const previousStack = queryClient.getQueryData<UserStackItem[]>(['userStack']);

      // Crear el nuevo item optimista
      const optimisticItem: UserStackItem = {
        supplement_ean: supplement.ean,
        preferred_time: preferredTime,
        created_at: new Date().toISOString(),
        supplements: {
          ean: supplement.ean,
          product_name: supplement.product_name,
          brands_tags: supplement.brands_tags,
          image_url: supplement.image_url,
          categories_tags: supplement.categories_tags,
          calculated_score: supplement.calculated_score
        }
      };

      // Actualizar caché inmediatamente
      queryClient.setQueryData<UserStackItem[]>(['userStack'], (old = []) => [...old, optimisticItem]);

      return { previousStack };
    },
    onSuccess: (data) => {
      // Invalidar solo las queries críticas de forma asíncrona
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['gamificationData'] });

      toast({
        title: "¡Agregado al stack!",
        description: `${data.supplement.product_name} se ha añadido a tu colección`,
      });
    },
    onError: (error, variables, context) => {
      // ROLLBACK: Revertir cambios si falla
      if (context?.previousStack) {
        queryClient.setQueryData(['userStack'], context.previousStack);
      }

      if (error.message.includes('unique constraint')) {
        toast({ title: "Ya está en tu stack", description: "Este suplemento ya está en tu colección", variant: "destructive" });
      } else {
        toast({ title: "Error", description: "No se pudo agregar el suplemento al stack", variant: "destructive" });
      }
    }
  });

  // 4. Mutación para ELIMINAR un suplemento del stack con OPTIMISTIC UPDATES.
  const removeMutation = useMutation({
    mutationFn: async ({ supplementEan, supplementName }: { supplementEan: string, supplementName: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso requerido");

      const { error } = await supabase
        .from('user_supplement_stack')
        .delete()
        .eq('user_id', user.id)
        .eq('supplement_ean', supplementEan);

      if (error) throw error;
      return { supplementEan, supplementName };
    },
    onMutate: async ({ supplementEan }) => {
      // OPTIMISTIC UPDATE: Actualizar UI inmediatamente
      await queryClient.cancelQueries({ queryKey: ['userStack'] });

      const previousStack = queryClient.getQueryData<UserStackItem[]>(['userStack']);

      // Remover el item optimistamente
      queryClient.setQueryData<UserStackItem[]>(['userStack'], (old = []) =>
        old.filter(item => item.supplement_ean !== supplementEan)
      );

      return { previousStack };
    },
    onSuccess: (data) => {
      // Invalidar solo las queries críticas de forma asíncrona
      queryClient.invalidateQueries({ queryKey: ['historicalDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['gamificationData'] });

      toast({
        title: "Eliminado del stack",
        description: `${data.supplementName} se ha quitado de tu colección`,
      });
    },
    onError: (error, variables, context) => {
      // ROLLBACK: Revertir cambios si falla
      if (context?.previousStack) {
        queryClient.setQueryData(['userStack'], context.previousStack);
      }

      toast({
        title: "Error",
        description: "No se pudo quitar el suplemento del stack",
        variant: "destructive"
      });
    }
  });

  const handleAddToStackClick = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    setShowTimeSelection(true);
  };

  const handleTimeSelection = (timeSlot: 'morning' | 'midday' | 'night') => {
    if (selectedSupplement) {
      // Se llama a la mutación en lugar de a la función directa.
      addMutation.mutate({ supplement: selectedSupplement, preferredTime: timeSlot });
      setSelectedSupplement(null);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    searchSupplements(query);
  };

  const filteredAvailableSupplements = availableSupplements.filter(
    supplement => !userStack.some(item => item.supplement_ean === supplement.ean)
  );

  if (loading) {
    return (
      <LoadingPage
        title="Cargando tu stack"
        description="Obteniendo tus suplementos personalizados"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Current Stack */}
        <section className="mb-8">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 mb-2">
                    <Package className="h-6 w-6 text-primary" />
                    Mi Stack de Suplementos
                  </CardTitle>
                  <CardDescription>
                    Gestiona tu colección personal de suplementos para seguimiento y análisis.
                  </CardDescription>
                </div>
                {/* {userStack.length >= 2 && (
                  <Button variant="outline" onClick={() => navigate('/stack-analysis')}>
                    <BarChart3 className="h-4 w-4 mr-2 text-primary" />
                    Analizar Stack
                  </Button>
                )} */}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xl font-semibold">Tu Stack Actual</p>
                <Badge variant="secondary">{userStack.length} suplementos</Badge>
              </div>
              {userStack.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No tienes suplementos en tu stack. Agrega algunos desde la sección de abajo para empezar a hacer seguimiento.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {userStack.map((item, index) => {
                      // Verificar que el suplemento existe antes de renderizar
                      if (!item.supplements) {
                        console.warn('Suplemento no encontrado para EAN:', item.supplement_ean);
                        return null;
                      }

                      return (
                        <motion.div
                          key={item.supplement_ean}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card
                            className="hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => onSupplementClick?.(item.supplements)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3 flex-1">
                                  {item.supplements.image_url ? (
                                    <img
                                      src={item.supplements.image_url}
                                      alt={item.supplements.product_name}
                                      className="w-14 h-14 rounded-lg object-cover border border-border"
                                    />
                                  ) : (
                                    <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border">
                                      <Package className="w-7 h-7 text-primary" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between mb-1">
                                      <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                                        {item.supplements.product_name}
                                      </h3>
                                    </div>

                                    <div className="space-y-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground font-medium">
                                          {getBrandFromTags(item.supplements.brands_tags)}
                                        </span>
                                        {/* {formatProductInfo(item.supplements).isSupplement && (
                                          <Shield className="w-3 h-3 text-green-600" />
                                        )} */}
                                      </div>

                                      <div className="flex items-center gap-1">
                                        {/* <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                          {getCategoryFromTags(item.supplements.categories_tags)}
                                        </Badge> */}
                                        {formatProductInfo(item.supplements).hasLabels && (
                                          <Leaf className="w-3 h-3 text-green-600" />
                                        )}
                                      </div>

                                      {formatProductInfo(item.supplements).labels.length > 0 && (
                                        <div className="flex flex-wrap gap-1">
                                          {formatProductInfo(item.supplements).labels.slice(0, 2).map((label, idx) => (
                                            <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                              {label}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}

                                      <div className="flex items-center gap-1 mt-2">
                                        <Badge
                                          variant="default"
                                          className={`text-xs px-2 py-0.5 flex items-center gap-1 
      ${item.preferred_time === "morning"
                                              ? "bg-orange-100/70 text-orange-400 hover:bg-orange-100/70 hover:text-orange-400"
                                              : item.preferred_time === "midday"
                                                ? "bg-yellow-100/70 text-yellow-400 hover:bg-yellow-100/70 hover:text-yellow-400"
                                                : "bg-blue-100/75 text-blue-700 hover:bg-blue-100/75 hover:text-blue-700"
                                            }`}
                                        >
                                          {item.preferred_time === "morning" ? (
                                            <>
                                              <Sunrise className="w-4 h-4" />
                                              <span>Mañana</span>
                                            </>
                                          ) : item.preferred_time === "midday" ? (
                                            <>
                                              <Sun className="w-4 h-4" />
                                              <span>Mediodía</span>
                                            </>
                                          ) : (
                                            <>
                                              <Moon className="w-4 h-4" />
                                              <span>Noche</span>
                                            </>
                                          )}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    // Se llama a la mutación de eliminar
                                    removeMutation.mutate({ supplementEan: item.supplement_ean, supplementName: item.supplements.product_name });
                                  }}
                                  disabled={removeMutation.isPending && removeMutation.variables?.supplementEan === item.supplement_ean}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Add Supplements */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" />
                <p className="text-xl font-semibold">Agregar Suplementos</p>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar suplementos por nombre o marca..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Available Supplements */}
              {searchLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-muted rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <AnimatePresence>
                    {filteredAvailableSupplements.map((supplement, index) => (
                      <motion.div
                        key={supplement.ean}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card
                          className="hover:shadow-md transition-shadow cursor-pointer border-l-primary/20"
                          onClick={() => onSupplementClick?.(supplement)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                {supplement.image_url ? (
                                  <img
                                    src={supplement.image_url}
                                    alt={supplement.product_name}
                                    className="w-14 h-14 rounded-lg object-cover border border-border"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-primary/10 rounded-lg flex items-center justify-center border border-border">
                                    <Package className="w-7 h-7 text-primary" />
                                  </div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <h3 className="font-semibold text-foreground text-sm leading-tight line-clamp-2">
                                      {supplement.product_name}
                                    </h3>
                                    {supplement.calculated_score && (
                                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                                        <Award className={`w-4 h-4 ${formatProductInfo(supplement).scoreColor}`} />
                                        <span className={`text-xs font-medium ${formatProductInfo(supplement).scoreColor}`}>
                                          {supplement.calculated_score}
                                        </span>
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-muted-foreground font-medium">
                                        {getBrandFromTags(supplement.brands_tags)}
                                      </span>
                                      {/* {formatProductInfo(supplement).isSupplement && (
                                        <Shield className="w-3 h-3 text-green-600" />
                                      )} */}
                                    </div>

                                    <div className="flex items-center gap-1">
                                      {/* <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                        {getCategoryFromTags(supplement.categories_tags)}
                                      </Badge> */}
                                      {formatProductInfo(supplement).hasLabels && (
                                        <Leaf className="w-3 h-3 text-green-600" />
                                      )}
                                    </div>

                                    {formatProductInfo(supplement).labels.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {formatProductInfo(supplement).labels.slice(0, 2).map((label, idx) => (
                                          <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5">
                                            {label}
                                          </Badge>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToStackClick(supplement);
                                }}
                                className="bg-primary hover:bg-primary/90 ml-2 flex-shrink-0"
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Agregar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {filteredAvailableSupplements.length === 0 && !searchLoading && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {searchQuery
                      ? `No se encontraron suplementos para "${searchQuery}"`
                      : "No hay más suplementos disponibles para agregar"
                    }
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <TimeSelectionDialog
        isOpen={showTimeSelection}
        onOpenChange={setShowTimeSelection}
        onSelectTime={handleTimeSelection}
        supplementName={selectedSupplement?.product_name || ''}
      />
    </div>
  );
};

export default SupplementStack;
