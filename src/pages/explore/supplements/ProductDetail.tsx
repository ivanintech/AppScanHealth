import {
  ArrowLeft,
  Share,
  FileText,
  Trash2,
  AlertCircle,
  Calendar,
  Clock,
  Droplet,
  MessageCircle,
  Info,
  ShoppingCart,
  Plus,
  Zap,
  Shield,
  Package,
  Globe,
  Award,
  Pill,
  Leaf,
  Wheat,
  Milk,
  Star,
  TrendingUp,
  Users,
  Target,
  Activity,
  Brain,
  Eye,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  AlertTriangle
} from "lucide-react";
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { TimeSelectionDialog } from '@/shared/components/TimeSelectionDialog';
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/shared/supabase/client";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { getHealthGoalClasses } from "@/shared/lib/utils";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/shared/components/ui/collapsible";
import { useState, useEffect } from "react";
import { useExamineAPI } from "@/features/analytics/hooks/useExamineAPI";
import { SupplementInfoCards } from "@/features/stack";
import { SupplementMetrics } from "@/features/stack";
import { ExamineLoadingCard } from "@/features/scanning";
// SupplementUtilityPanel ahora está integrado en este archivo
import { usePurchaseLinks } from "@/features/stack/hooks/usePurchaseLinks";
import { PurchaseModal } from "@/shared/components/PurchaseModal";
import { LoadingPage } from "@/shared/components/ui/ProfessionalLoading";
import { RelatedProductsSection } from "@/shared/components/RelatedProductsSection";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Textarea } from "@/shared/components/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";

type Supplement = {
  ean: string;
  product_name: string;
  brands_tags: string | null;
  image_url: string | null;
  calculated_score: number | null;
  keywords: string | null;
  brands_url: string | null;
  labels_tags: string | null;
  countries_tags: string | null;
  ingredients_text: string | null;
  ingredients_analysis_tags: string | null;
  allergens_tags: string | null;
  traces_tags: string | null;
  additives_tags: string | null;
  nutriscore_score: number | null;
  nova_group: number | null;
  image_small_url: string | null;
  image_front_url: string | null;
  image_ingredients_url: string | null;
  image_nutrition_url: string | null;
  serving_quantity: number | null;
  serving_size: string | null;
  serving_unit: string | null;
  known_ingredients_count: number | null;
  unknown_ingredients_count: number | null;
  is_vegan: boolean | null;
  is_gluten_free: boolean | null;
  is_lactose_free: boolean | null;
  nutrition_data_per_100g: string | null;
  nutrition_data_per_serving: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  subcategory_id: string | null;
  benefits: string | null;
  recommended_time: string | null;
  impact: string | null;
  side_effects: string | null;
  interactions: string | null;
  categories_tags: string | null;
};

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-primary";
  if (score >= 60) return "text-yellow-500";
  return "text-red-500";
};

const getScoreRingColor = (score: number) => {
  if (score >= 80) return "stroke-primary";
  if (score >= 60) return "stroke-yellow-500";
  return "stroke-red-500";
};

// Componente para mostrar información en filas
const InfoRow = ({ icon: Icon, title, content, colorClass }: { icon: React.ElementType, title: string, content: string | null | undefined, colorClass: string }) => {
  if (!content) return null;
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 p-4 bg-muted/40 rounded-lg"
    >
      <div className={`p-2 rounded-full ${colorClass}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h4 className="font-semibold text-foreground">{title}</h4>
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      </div>
    </motion.div>
  );
};

// Componente para mostrar badges de información
const InfoBadge = ({ icon: Icon, label, value, colorClass }: { icon: React.ElementType, label: string, value: string | number | boolean | null, colorClass: string }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
      <div className={`p-1.5 rounded-full ${colorClass}`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">
          {typeof value === 'boolean' ? (value ? 'Sí' : 'No') : value}
        </p>
      </div>
    </div>
  );
};

// Componente para mostrar arrays de tags
const TagsSection = ({ title, tags, icon: Icon, colorClass }: { title: string, tags: string[] | null, icon: React.ElementType, colorClass: string }) => {
  if (!tags || tags.length === 0) return null;

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mb-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={`p-1.5 rounded-full ${colorClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {tag.replace('en:', '').replace(/-/g, ' ')}
          </Badge>
        ))}
      </div>
    </motion.div>
  );
};

// Componente para mostrar información nutricional
const NutritionCard = ({ title, data, icon: Icon }: { title: string, data: unknown, icon: React.ElementType }) => {
  if (!data) return null;

  let nutritionData;
  try {
    nutritionData = typeof data === 'string' ? JSON.parse(data) : data;
  } catch {
    return null;
  }

  if (!nutritionData || Object.keys(nutritionData).length === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(nutritionData).slice(0, 8).map(([key, value]) => (
            <div key={key} className="flex justify-between items-center p-2 bg-muted/30 rounded">
              <span className="text-sm text-muted-foreground capitalize">
                {key.replace(/_/g, ' ')}
              </span>
              <span className="text-sm font-medium text-foreground">
                {typeof value === 'number' ? value.toFixed(1) : String(value)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};


const SupplementDetailSkeleton = () => (
  <div className="max-w-md mx-auto">
    <div className="flex items-center justify-between p-4">
      <Skeleton className="w-10 h-10 rounded-lg" />
      <div className="flex gap-4">
        <Skeleton className="w-10 h-10 rounded-lg" />
        <Skeleton className="w-10 h-10 rounded-lg" />
      </div>
    </div>
    <div className="px-6 pb-6">
      <div className="flex justify-center mb-6">
        <Skeleton className="w-40 h-40 rounded-lg" />
      </div>
      <div className="mb-6">
        <Skeleton className="w-3/4 h-8 mb-2" />
        <Skeleton className="w-1/2 h-6" />
      </div>
      <div className="flex items-start gap-6 mb-8">
        <Skeleton className="w-24 h-24 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-4 mt-2">
          <div className="space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-1" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-1" />
          </div>
          <div className="space-y-2">
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-1" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="w-1/3 h-6" />
        <Skeleton className="w-full h-16" />
      </div>
    </div>
  </div>
);




export const ProductDetail = () => {
  const { ean } = useParams<{ ean: string }>();
  const navigate = useNavigate();
  
  // 🔴 LOGS DE DEPURACIÓN DETALLADOS
  console.log('🔴 SupplementDetail Component Rendered');
  console.log('🔴 ean (from URL):', ean);
  // Estado para saber si el suplemento está en el stack
  const [isInStack, setIsInStack] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // Estados para agregar al stack
  const [showTimeSelection, setShowTimeSelection] = useState(false);
  const [selectedSupplement, setSelectedSupplement] = useState<Supplement | null>(null);
  // Toast
  const { toast } = useToast();
  const queryClient = useQueryClient?.() ?? undefined;
  // Mutación para agregar al stack
  const addMutation = queryClient ? useMutation({
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
    onSuccess: (data) => {
      toast({
        title: "¡Agregado al stack!",
        description: `${data.supplement.product_name} se ha añadido a tu colección`,
      });
      setIsInStack(true);
    },
    onError: (error) => {
      toast({ title: "Error", description: "No se pudo agregar el suplemento al stack", variant: "destructive" });
    }
  }) : undefined;

  // Mutación para eliminar del stack
  const deleteMutation = queryClient ? useMutation({
    mutationFn: async (supplement: Supplement) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Acceso requerido");
      const { error } = await supabase
        .from('user_supplement_stack')
        .delete()
        .eq('user_id', user.id)
        .eq('supplement_ean', supplement.ean);
      if (error) throw error;
      return supplement;
    },
    onSuccess: (supplement) => {
      toast({
        title: "Eliminado del stack",
        description: `${supplement.product_name} se ha quitado de tu colección`,
      });
      setIsInStack(false);
    },
    onError: () => {
      toast({ title: "Error", description: "No se pudo eliminar el suplemento del stack", variant: "destructive" });
    }
  }) : undefined;

  const handleAddToStackClick = (supplement: Supplement) => {
    setSelectedSupplement(supplement);
    setShowTimeSelection(true);
  };

  const handleTimeSelection = (timeSlot: 'morning' | 'midday' | 'night') => {
    if (selectedSupplement && addMutation) {
      addMutation.mutate({ supplement: selectedSupplement, preferredTime: timeSlot });
      setSelectedSupplement(null);
    }
    setShowTimeSelection(false);
  };
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  // toast ya está declarado arriba, no se redeclara

  // Cargar notas guardadas cuando se carga el componente
  useEffect(() => {
    if (ean) {
      const savedNotes = localStorage.getItem(`notes_${ean}`);
      if (savedNotes) {
        setNotes(savedNotes);
      }
      // Consultar si el suplemento está en el stack y obtener ID del usuario
      (async () => {
        const { data: { user } } = await supabase.auth.getUser();
        console.log('🔴 Auth user check:', user);
        if (!user) {
          console.log('🔴 No user found, setting userId to null');
          setUserId(null);
          return setIsInStack(false);
        }
        console.log('🔴 User found, setting userId:', user.id);
        setUserId(user.id);
        const { data, error } = await supabase
          .from('user_supplement_stack')
          .select('supplement_ean')
          .eq('user_id', user.id)
          .eq('supplement_ean', ean);
        setIsInStack(!!(data && data.length > 0));
      })();
    }
  }, [ean]);


  const fetchSupplementData = async (ean: string): Promise<Supplement> => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("ean", ean)
      .single();
    if (error) throw new Error(error.message);
    return data as unknown as Supplement;
  };

  const {
    data: supplement,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["supplement", ean],
    queryFn: () => fetchSupplementData(ean!),
    enabled: !!ean,
  });

  // 🔴 LOGS DE DEPURACIÓN PARA SUPPLEMENT
  console.log('🔴 Supplement query result:', { supplement, isLoading, error });
  console.log('🔴 supplement?.category_id:', supplement?.category_id);
  console.log('🔴 supplement?.ean:', supplement?.ean);
  console.log('🔴 supplement?.product_name:', supplement?.product_name);

  // Hook para obtener datos de Examine.com
  const { data: examineData, loading: examineLoading } = useExamineAPI(
    supplement?.product_name || ''
  );


  // Hook para obtener enlaces de compra
  const {
    options: purchaseOptions,
    loading: purchaseLoading,
    error: purchaseError,
    refetch: refetchPurchase
  } = usePurchaseLinks(
    supplement?.ean || '',
    supplement?.product_name || ''
  );

  // Función para parsear arrays JSON
  const parseJsonArray = (jsonString: string | null): string[] => {
    if (!jsonString) return [];
    try {
      return JSON.parse(jsonString);
    } catch {
      return [];
    }
  };

  // Función para toggle de secciones expandibles
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Función para compartir el producto
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: supplement?.product_name || 'Suplemento',
          text: `Mira este suplemento: ${supplement?.product_name}`,
          url: window.location.href,
        });
        toast({
          title: "Compartido",
          description: "El suplemento se ha compartido exitosamente",
        });
      } catch (error) {
        console.log('Error al compartir:', error);
        // Fallback: copiar al portapapeles
        handleCopyLink();
      }
    } else {
      // Fallback para navegadores que no soportan Web Share API
      handleCopyLink();
    }
  };

  // Función para copiar enlace al portapapeles
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Enlace copiado",
        description: "El enlace se ha copiado al portapapeles",
      });
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  // Función para abrir modal de notas
  const handleNotes = () => {
    setIsNotesModalOpen(true);
  };


  if (isLoading) {
    return (
      <LoadingPage
        title="Cargando suplemento"
        description="Obteniendo información detallada del producto"
      />
    );
  }

  if (error || !supplement) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto">
          <div className="flex items-center p-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-6 h-6" />
            </Button>
          </div>
          <div className="px-6 py-12 text-center flex flex-col items-center">
            <AlertCircle className="w-16 h-16 text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Suplemento no encontrado</h2>
            <p className="text-muted-foreground">
              No pudimos encontrar los detalles para este suplemento. Puede que haya sido eliminado o el enlace sea incorrecto.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Parsear datos JSON
  const brands = parseJsonArray(supplement.brands_tags);
  const countries = parseJsonArray(supplement.countries_tags);
  const labels = parseJsonArray(supplement.labels_tags);
  const categories = parseJsonArray(supplement.categories_tags);
  const ingredientsAnalysis = parseJsonArray(supplement.ingredients_analysis_tags);
  const allergens = parseJsonArray(supplement.allergens_tags);
  const traces = parseJsonArray(supplement.traces_tags);
  const additives = parseJsonArray(supplement.additives_tags);
  const keywords = parseJsonArray(supplement.keywords);

  // Usar el scoring real calculado por el sistema
  const overallScore = supplement.calculated_score || 75;
  const scoreColor = getScoreColor(overallScore);
  const scoreRingColor = getScoreRingColor(overallScore);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-background"
    >
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between p-4 bg-background sticky top-0 z-10"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNotes}>
              <FileText className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>

        <div className="px-4 pb-20">
          {/* Hero Section Compacto */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Card className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Imagen del producto */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={supplement.image_url || "/placeholder.svg"}
                      alt={supplement.product_name}
                      className="w-20 h-20 object-contain rounded-xl bg-white shadow-sm p-2"
                      onError={(e) => { e.currentTarget.src = "/placeholder.svg"; }}
                    />
                  </div>

                  {/* Información del producto */}
                  <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-foreground mb-1 line-clamp-2 leading-tight">
                      {supplement.product_name}
                    </h1>

                    {brands.length > 0 && (
                      <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                        {/* <Package className="w-3 h-3" /> */}
                        {brands[0]?.split(':')[1]?.replace(/^./, (c) => c.toUpperCase())}
                      </p>
                    )}

                    {/* Labels visualización profesional */}
                    {labels.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2 mt-2">
                        {labels
                          .filter(label => label.startsWith('en:'))
                          .map((label, idx) => (
                            <Badge
                              key={idx}
                              variant="default"
                              className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1"
                            >
                              {label
                                .replace('en:', '')
                                .replace(/-/g, ' ')
                                .replace(/^./, c => c.toUpperCase())}
                            </Badge>
                          ))}
                      </div>
                    )}

                    {/* Badges de calidad compactos */}
                    {/* <div className="flex flex-wrap gap-1">
                      {supplement.is_vegan && (
                        <Badge variant="outline" className="text-sm bg-green-50 text-green-700 border-green-200">
                          <Leaf className="w-3 h-3 mr-1" />
                          Vegano
                        </Badge>
                      )}
                      {supplement.is_gluten_free && (
                        <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                          <Wheat className="w-3 h-3 mr-1" />
                          Sin Gluten
                        </Badge>
                      )}
                      {supplement.is_lactose_free && (
                        <Badge variant="outline" className="text-sm bg-purple-50 text-purple-700 border-purple-200">
                          <Milk className="w-3 h-3 mr-1" />
                          Sin Lactosa
                        </Badge>
                      )}
                      {examineData?.research?.evidence === 'High' && (
                        <Badge variant="outline" className="text-sm bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Award className="w-3 h-3 mr-1" />
                          Evidencia Alta
                        </Badge>
                      )}
                    </div> */}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Métricas e Información Científica en Grid */}
          <div className="grid grid-cols-1 gap-4 mb-4">
            {/* Métricas */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <SupplementMetrics supplementData={supplement} examineData={examineData} />
            </motion.div>

            {/* Información Científica de Examine.com */}
            {examineLoading ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <ExamineLoadingCard />
              </motion.div>
            ) : examineData ? (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <SupplementInfoCards examineData={examineData} supplementData={supplement} />
              </motion.div>
            ) : null}
          </div>


          {/* Ingredientes - Colapsible */}
          {/* {supplement.ingredients_text && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <Collapsible
                open={expandedSections.ingredients}
                onOpenChange={() => toggleSection('ingredients')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-14 text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Pill className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Lista de Ingredientes</div>
                        <div className="text-sm text-muted-foreground">Composición completa del producto</div>
                      </div>
                    </span>
                    {expandedSections.ingredients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-6">
                  <Card className="border-0 shadow-lg">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {supplement.ingredients_text}
                      </p>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )} */}

          {/* Imágenes Adicionales - Colapsible */}
          {/* {(supplement.image_front_url || supplement.image_ingredients_url || supplement.image_nutrition_url) && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mb-8"
            >
              <Collapsible 
                open={expandedSections.images} 
                onOpenChange={() => toggleSection('images')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-14 text-left">
                    <span className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Eye className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-semibold">Imágenes del Producto</div>
                        <div className="text-sm text-muted-foreground">Frente, ingredientes y información nutricional</div>
                      </div>
                    </span>
                    {expandedSections.images ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                    {supplement.image_front_url && (
                      <div className="text-center">
                        <img src={supplement.image_front_url} alt="Frente del producto" className="w-full h-32 object-contain bg-white rounded-lg shadow-sm" />
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Frente del Producto</p>
                      </div>
                    )}
                    {supplement.image_ingredients_url && (
                      <div className="text-center">
                        <img src={supplement.image_ingredients_url} alt="Ingredientes" className="w-full h-32 object-contain bg-white rounded-lg shadow-sm" />
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Lista de Ingredientes</p>
                      </div>
                    )}
                    {supplement.image_nutrition_url && (
                      <div className="text-center col-span-2">
                        <img src={supplement.image_nutrition_url} alt="Información nutricional" className="w-full h-40 object-contain bg-white rounded-lg shadow-sm" />
                        <p className="text-sm text-muted-foreground mt-2 font-medium">Información Nutricional</p>
                      </div>
                    )}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </motion.div>
          )} */}

          {/* Enlaces */}
          {/* {supplement.brands_url && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="mb-8"
            >
              <Card className="border-0 shadow-lg">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Globe className="w-5 h-5 text-blue-600" />
                    </div>
                    Enlaces Externos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full h-12" asChild>
                    <a href={supplement.brands_url} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Visitar sitio web de la marca
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )} */}

          {/* Aviso Importante */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.0 }}
            className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg mb-4"
          >
            <Card className="border-0 shadow-none bg-transparent">
              <CardHeader className="pb-3 pt-4 px-6">
                <CardTitle className="flex items-center gap-2 text-base font-semibold text-yellow-800">
                  <Info className="w-5 h-5 text-yellow-600" />
                  Aviso Importante
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-4 px-6">
                <p className="text-sm text-yellow-700 leading-relaxed mb-2">
                  Los suplementos no deben utilizarse como sustitutos de una dieta variada y equilibrada.
                  Mantener fuera del alcance de los niños. Consulte a su médico antes de usar si está embarazada,
                  amamantando o tiene alguna condición médica.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Productos Relacionados */}
          <RelatedProductsSection
            currentEan={supplement.ean}
            currentCategories={supplement.categories_tags || ''}
            currentProductName={supplement.product_name}
          />

          {/* Action Buttons */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="flex gap-3"
          >
            <Button
              variant="default"
              size="lg"
              className="flex-1 h-14 text-lg font-semibold"
              onClick={() => setIsPurchaseModalOpen(true)}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Comprar Producto
            </Button>
            {isInStack ? (
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-6 flex items-center gap-2 
               text-red-500 border-red-500 
               hover:bg-red-500 hover:text-white 
               transition-colors"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="h-14 px-6 flex items-center gap-2"
                onClick={() => handleAddToStackClick(supplement)}
              >
                <Plus className="w-5 h-5" />
              </Button>
            )}
          </motion.div>

          {/* Modal de confirmación para eliminar */}
          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-red-600" />
                  Eliminar suplemento
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">¿Seguro que quieres eliminar <span className="font-semibold">{supplement?.product_name}</span> de tu stack?</p>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                    Cancelar
                  </Button>
                  <Button variant="destructive" onClick={() => {
                    if (deleteMutation) deleteMutation.mutate(supplement);
                    setShowDeleteConfirm(false);
                  }}>
                    Eliminar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modal de Compra */}
      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        options={purchaseOptions}
        loading={purchaseLoading}
        error={purchaseError}
        productName={supplement?.product_name || ''}
        onRefetch={refetchPurchase}
      />
      {/* Modal de Selección de Horario */}
      {supplement && (
        <TimeSelectionDialog
          isOpen={showTimeSelection}
          onOpenChange={setShowTimeSelection}
          onSelectTime={handleTimeSelection}
          supplementName={supplement.product_name}
        />
      )}

      {/* Modal de Notas */}
      <Dialog open={isNotesModalOpen} onOpenChange={setIsNotesModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Notas sobre {supplement?.product_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Añade tus notas personales sobre este suplemento..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsNotesModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={() => {
                // Guardar las notas en localStorage
                if (supplement?.ean) {
                  localStorage.setItem(`notes_${supplement.ean}`, notes);
                  toast({
                    title: "Notas guardadas",
                    description: "Tus notas se han guardado correctamente",
                  });
                }
                setIsNotesModalOpen(false);
              }}>
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

