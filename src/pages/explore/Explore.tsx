import { useState, useMemo, useCallback, useEffect } from "react";

// Helper function para normalizar texto de búsqueda
const normalizeSearchText = (text: string | null | undefined): string => {
  try {
    if (!text || typeof text !== 'string') return '';
    return text
      .toLowerCase()
      .normalize('NFD') // Descompone caracteres acentuados
      .replace(/[\u0300-\u036f]/g, '') // Elimina diacríticos (tildes, acentos)
      .replace(/[ñ]/g, 'n') // Convierte ñ a n
      .replace(/[ç]/g, 'c') // Convierte ç a c
      .trim();
  } catch (error) {
    console.warn('Error in normalizeSearchText:', error, 'text:', text);
    return '';
  }
};
import { Search, Loader2, BookOpen, Wrench, FolderOpen, Package } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card";
import { CategoryCard } from "@/pages/explore/supplements/CategoryCard";
import { SupplementDetail } from "@/pages/explore/supplements/SupplementDetail";
import { SupplementCard } from "@/features/stack";
import { useCategories } from "@/shared/hooks/useCategories";
import { useSupplements } from "@/features/stack/hooks/useSupplements";
import productsData from "@/../public/data/off.products.json";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { LoadingSection } from "@/shared/components/ui/ProfessionalLoading";

interface Category {
  id: string;
  name: string;
  parent_category_id?: string[] | string | null;
  description?: string;
  color?: string;
  sort_order?: number;
  health_goals?: string;
  considerations?: string;
  usage_instructions?: string;
  recommended_time?: string;
  impact?: string;
  side_effects?: string;
  interactions?: string;
  search_keywords?: string;
  target_audience?: string;
}

interface ExploreProps {
  onSupplementClick: (supplement: any) => void;
}

const ToolCard = ({ icon: Icon, title, description, onClick }: { icon: React.ElementType, title: string, description: string, onClick: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className="bg-muted/50 p-4 rounded-xl flex items-center gap-4 cursor-pointer hover:bg-muted transition-colors"
  >
    <div className="bg-background p-3 rounded-lg">
      <Icon className="w-6 h-6 text-green-600" />
    </div>
    <div>
      <h3 className="font-semibold text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </motion.div>
);

export const Explore = ({ onSupplementClick }: ExploreProps) => {
  // Usar el hook RPC como estrategia principal
  const { mainCategories, subcategories, thirdLevelCategories, loading: categoriesLoading, error: categoriesError, refetch: retryCategories } = useCategories();
  
  // Hook para obtener suplementos de la tabla supplements
  const { supplements, loading: supplementsLoading, error: supplementsError } = useSupplements();
  
  // Función para obtener subcategorías por categoría principal
  const getSubcategoriesByCategory = (categoryId: string) => {
    return subcategories.filter(sub => 
      Array.isArray(sub.parent_category_id) 
        ? sub.parent_category_id.includes(categoryId)
        : sub.parent_category_id === categoryId
    );
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'categories' | 'subcategories' | 'supplements' | 'suplement'>('categories');
  const [displayMode, setDisplayMode] = useState<'supplements' | 'categories'>('supplements');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedMainCategory, setSelectedMainCategory] = useState<Category | null>(null);
  const [selectedCategoryForDetail, setSelectedCategoryForDetail] = useState<Category | null>(null);
  const navigate = useNavigate();

  // Manejar búsqueda automática desde URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    if (searchParam) {
      console.log('🔍 [Explore] Auto-search from URL:', searchParam);
      setSearchTerm(searchParam);
      setDisplayMode('supplements');
      setViewMode('supplements');
    }
  }, []);

  // Función helper para manejar clicks en suplementos
  const handleSupplementClick = (supplement: any) => {
    console.log('🔍 [Explore] handleSupplementClick called with:', supplement.name, 'EAN:', supplement.ean);
    
    if (supplement.ean) {
      // Si tiene EAN, navegar a ProductDetail
      console.log('🔍 [Explore] Product with EAN detected, navigating to:', `/supplements/${supplement.ean}`);
      navigate(`/supplements/${supplement.ean}`);
    } else {
      // Si no tiene EAN, mostrar SupplementDetail
      setSelectedCategoryForDetail(supplement);
      setViewMode('suplement');
    }
  };

  // Función unificada para manejar la selección desde el buscador
  const handleUnifiedSearchSelect = (item: any) => {
    console.log('🔍 [Explore] handleUnifiedSearchSelect called with:', item.name, 'type:', item.type);
    
    // Limpiar búsqueda
    setSearchTerm('');
    
    switch (item.type) {
      case 'category':
        handleCategorySelect(item);
        break;
      case 'subcategory': {
        // Para subcategorías, necesitamos encontrar la categoría padre
        const parentCategory = mainCategories.find(cat =>
          Array.isArray(item.parent_category_id) &&
          item.parent_category_id.includes(cat.id)
        );
        if (parentCategory) {
          setSelectedMainCategory(parentCategory);
          setViewMode('subcategories');
          // Luego navegar directamente al suplemento si no tiene más subcategorías
          const supplements = getSupplementsBySubcategory(item.id);
          if (supplements.length > 0) {
            handleSubcategoryClick(item.id);
          } else {
            setSelectedCategoryForDetail(item);
            setViewMode('suplement');
          }
        }
        break;
      }
      case 'supplement':
        // Para suplementos, usar la función helper
        handleSupplementClick(item);
        break;
    }
  };

  // Función para volver atrás
  const handleBack = () => {
    console.log('🔍 [Explore] handleBack called, current viewMode:', viewMode);
    setSearchTerm("");
    if (viewMode === 'suplement') {
      console.log('🔍 [Explore] Going back from suplement to categories');
      setViewMode('categories');
      setSelectedCategoryForDetail(null);
      // Resetear también el displayMode para mostrar el buscador
      setDisplayMode('supplements');
    } else if (viewMode === 'subcategories') {
      console.log('🔍 [Explore] Going back from subcategories to categories');
      setViewMode('categories');
      setSelectedMainCategory(null);
    }
  };

  // Limpiar búsqueda cuando se navega a subcategorías o suplementos
  const handleCategorySelect = (category: Category) => {
    console.log('🔍 [Explore] handleCategorySelect called with:', category.name);
    setSearchTerm(""); // Limpiar búsqueda al navegar

    // Verificar si la categoría tiene subcategorías
    const subcategories = getSubcategoriesByCategory(category.id);
    console.log('🔍 [Explore] Subcategories found:', subcategories.length);

    if (subcategories.length > 0) {
      // Si tiene subcategorías, mostrar la vista de subcategorías
      console.log('🔍 [Explore] Category has subcategories, showing subcategories view');
      setSelectedMainCategory(category);
      setViewMode('subcategories');
    } else {
      // Si no tiene subcategorías, mostrar detalles de la categoría
      console.log('🔍 [Explore] Category has no subcategories, showing detail view');
      setSelectedCategoryForDetail(category);
      setViewMode('suplement');
    }
  };

  // Obtener suplementos por subcategoría (categorías de nivel 3)
  const getSupplementsBySubcategory = (subcategoryId: string) => {
    return thirdLevelCategories.filter(supp =>
      Array.isArray(supp.parent_category_id) && supp.parent_category_id.includes(subcategoryId)
    );
  };

  // Handle subcategory selection (show supplements)
  const handleSubcategoryClick = (subcategoryId: string) => {
    console.log('🔍 [Explore] handleSubcategoryClick called with:', subcategoryId);
    setSelectedCategory(subcategoryId);
    setViewMode('supplements');
    setSearchTerm(''); // Limpiar búsqueda al navegar
  };

  // Búsqueda contextual - suplementos solo en modo suplementos, unificada en modo categorías
  const { allSearchResults, hasResults } = useMemo(() => {
    if (!searchTerm.trim()) {
      return { allSearchResults: [], hasResults: false };
    }

    const normalizedSearchTerm = normalizeSearchText(searchTerm);
    
    // Función helper para verificar si un texto coincide con la búsqueda
    const matchesSearch = (text: string | null | undefined): boolean => {
      try {
        if (text === null || text === undefined) return false;
        if (typeof text !== 'string') {
          console.warn('matchesSearch received non-string:', typeof text, text);
          return false;
        }
        return normalizeSearchText(text).includes(normalizedSearchTerm);
      } catch (error) {
        console.warn('Error in matchesSearch:', error, 'text type:', typeof text, 'text value:', text);
        return false;
      }
    };
    
    let allSearchResults: any[] = [];

    if (displayMode === 'supplements') {
      // Modo suplementos: solo buscar suplementos de la tabla supplements
      console.log('🔍 [Explore] Supplements data sample:', supplements.slice(0, 2));
      allSearchResults = supplements
        .filter(supplement => {
          try {
            return (
              matchesSearch(supplement.name) ||
              matchesSearch(supplement.description) ||
              (Array.isArray(supplement.search_keywords) 
                ? supplement.search_keywords.some(keyword => matchesSearch(keyword))
                : matchesSearch(supplement.search_keywords))
            );
          } catch (error) {
            console.warn('Error filtering supplement:', error, 'supplement:', supplement);
            return false;
          }
        })
        .map(supp => ({ ...supp, type: 'supplement' as const, level: 3 }))
        .sort((a, b) => a.name.localeCompare(b.name)); // Ordenar alfabéticamente
    } else {
      // Modo categorías: búsqueda unificada (categorías, subcategorías y suplementos)
      
      // Buscar en categorías principales
      const filteredCategories = mainCategories
        .filter(category => {
          try {
            return (
              matchesSearch(category.name) ||
              matchesSearch(category.description) ||
              matchesSearch(category.search_keywords)
            );
          } catch (error) {
            console.warn('Error filtering category:', error, 'category:', category);
            return false;
          }
        })
        .map(cat => ({ ...cat, type: 'category' as const, level: 1 }));

      // Buscar en subcategorías
      const filteredSubcategories = subcategories
        .filter(subcategory => {
          try {
            return (
              matchesSearch(subcategory.name) ||
              matchesSearch(subcategory.description) ||
              matchesSearch(subcategory.search_keywords)
            );
          } catch (error) {
            console.warn('Error filtering subcategory:', error, 'subcategory:', subcategory);
            return false;
          }
        })
        .map(sub => ({ ...sub, type: 'subcategory' as const, level: 2 }));

      // Buscar en suplementos (nivel 3) - usar tabla supplements
      const filteredSupplements = supplements
        .filter(supplement => {
          try {
            return (
              matchesSearch(supplement.name) ||
              matchesSearch(supplement.description) ||
              (Array.isArray(supplement.search_keywords) 
                ? supplement.search_keywords.some(keyword => matchesSearch(keyword))
                : matchesSearch(supplement.search_keywords))
            );
          } catch (error) {
            console.warn('Error filtering supplement in categories mode:', error, 'supplement:', supplement);
            return false;
          }
        })
        .map(supp => ({ ...supp, type: 'supplement' as const, level: 3 }));

      // Combinar todos los resultados y ordenar por relevancia
      allSearchResults = [
        ...filteredCategories,
        ...filteredSubcategories,
        ...filteredSupplements
      ].sort((a, b) => {
        // Ordenar por nivel (categorías primero, luego subcategorías, luego suplementos)
        if (a.level !== b.level) {
          return a.level - b.level;
        }
        // Dentro del mismo nivel, ordenar alfabéticamente
        return a.name.localeCompare(b.name);
      });
    }

    return {
      allSearchResults,
      hasResults: allSearchResults.length > 0
    };
  }, [searchTerm, displayMode, mainCategories, subcategories, supplements]);

  // Loading state
  if (categoriesLoading || supplementsLoading) {
    return (
      <LoadingSection
        title="Cargando explorador"
        description="Obteniendo categorías y suplementos"
      />
    );
  }

  // Error state
  if (categoriesError || supplementsError) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">
          Error al cargar: {categoriesError || supplementsError}
        </p>
        <Button onClick={retryCategories} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  // Si hay una categoría seleccionada para mostrar detalles
  if (selectedCategoryForDetail) {
    console.log('🔍 [Explore] Rendering CategoryDetailCard for:', selectedCategoryForDetail.name);
    // Detectar si es una subcategoría final (level 2 sin suplementos)
    const isFinalSubcategory = (() => {
      // Si está en modo 'suplement' pero no hay selectedCategory (no estamos en vista de suplementos)
      if (viewMode === 'suplement' && selectedMainCategory) {
        // Verificar si la categoría actual es una subcategoría de selectedMainCategory
        return Array.isArray(selectedCategoryForDetail.parent_category_id) && selectedCategoryForDetail.parent_category_id.includes(selectedMainCategory.id);
      }
      return false;
    })();
    // Volver desde el detalle de suplemento o subcategoría final
    const handleBackToDetailParent = () => {
      setSelectedCategoryForDetail(null);
      if (isFinalSubcategory) {
        setViewMode('subcategories');
      } else {
        setViewMode('supplements');
      }
    };
    return (
      <SupplementDetail
        category={selectedCategoryForDetail}
        onBack={handleBackToDetailParent}
        onShare={async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: selectedCategoryForDetail.name,
                text: `Mira esta categoría: ${selectedCategoryForDetail.name}`,
                url: window.location.href,
              });
            } catch (error) {
              console.log('Error al compartir:', error);
              // Fallback: copiar al portapapeles
              try {
                await navigator.clipboard.writeText(window.location.href);
                console.log('Enlace copiado al portapapeles');
              } catch (clipboardError) {
                console.error('Error al copiar enlace:', clipboardError);
              }
            }
          } else {
            // Fallback para navegadores que no soportan Web Share API
            try {
              await navigator.clipboard.writeText(window.location.href);
              console.log('Enlace copiado al portapapeles');
            } catch (clipboardError) {
              console.error('Error al copiar enlace:', clipboardError);
            }
          }
        }}
        onMore={() => console.log('More options')}
      />
    );
  }

  // Si estamos en la vista de suplementos (nivel 3)
  if (viewMode === 'supplements' && selectedCategory) {
  const supplements = getSupplementsBySubcategory(selectedCategory).sort((a, b) => a.name.localeCompare(b.name));
  // Obtener la subcategoría seleccionada para mostrar su nombre
  const selectedSubcategory = subcategories.find(sub => sub.id === selectedCategory);
    // Si hay un suplemento seleccionado para detalle
    if (selectedCategoryForDetail) {
      return (
        <SupplementDetail
          category={selectedCategoryForDetail}
          onBack={() => setSelectedCategoryForDetail(null)}
          onShare={() => console.log('Share suplemento')}
          onMore={() => console.log('More options suplemento')}
        />
      );
    }
    // Volver a subcategorías debe regresar a la vista de subcategorías y limpiar el suplemento seleccionado
    const handleBackToSubcategories = () => {
      setViewMode('subcategories');
      setSelectedCategory(null);
      setSelectedCategoryForDetail(null);
    };
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background pb-12"
      >
        <div className="max-w-md mx-auto px-4 py-6">
          {/* Header igual que en categorías y subcategorías */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">Explorar</h1>
            <p className="text-muted-foreground">
              Descubre herramientas y categorías de suplementos
            </p>
          </div>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToSubcategories}
              className="mb-2"
            >
              ← Volver a subcategorías
            </Button>
          </motion.div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-6 w-6 text-green-600" />
                Suplementos
              </CardTitle>
              <CardDescription>
                {selectedSubcategory?.name ? selectedSubcategory.name : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* <div className="grid gap-4">
                {supplements
                  .filter(supp => supp.name.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((supplement, index) => (
                    <motion.div
                      key={supplement.id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <CategoryCard
                        id={supplement.id}
                        name={supplement.name}
                        description={supplement.description}
                        iconUrl={supplement.icon_url}
                        color={supplement.color}
                        onClick={() => handleSupplementClick(supplement)}
                        isSubcategory={true}
                      />
                    </motion.div>
                  ))}
              </div> */}
              <div className="grid grid-cols-2 gap-4">
                {supplements.length === 0 ? (
                  <motion.div className="text-center py-12 col-span-2">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No hay suplementos</h3>
                    <p className="text-muted-foreground">Esta subcategoría no tiene suplementos disponibles</p>
                  </motion.div>
                ) : (
                  supplements.map((supplement, index) => {
                    // Log temporal para debuggear URLs
                    if (supplement.icon_url && supplement.icon_url.includes('ImagesSupplements')) {
                      console.log('🔍 [Explore] Suplemento con imagen:', {
                        name: supplement.name,
                        icon_url: supplement.icon_url,
                        fullUrl: window.location.origin + supplement.icon_url
                      });
                    }
                    return (
                      <SupplementCard
                        key={supplement.id}
                        id={supplement.id}
                        name={supplement.name}
                        description={supplement.description}
                        imageUrl={supplement.icon_url}
                        onClick={() => handleSupplementClick(supplement)}
                      />
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    );
  }

  console.log('🔍 [Explore] Current state:', {
    viewMode,
    selectedCategoryForDetail: selectedCategoryForDetail?.name,
    supplementsCount: supplements.length,
    supplementsLoading,
    supplementsError
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background pb-12"
    >
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">Explorar</h1>
          <p className="text-muted-foreground">
            Descubre herramientas y categorías de suplementos
          </p>
        </div>


        {/* Back Button for Subcategories View */}
        {viewMode === 'subcategories' && selectedMainCategory && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="mb-2"
            >
              ← Volver a categorías
            </Button>
          </motion.div>
        )}

        {/* Content */}
        {/* Tools Section - Ahora arriba */}
        {/* {viewMode === 'categories' && !searchTerm && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-6 w-6 text-green-600" />
                  Herramientas
                </CardTitle>
                <CardDescription>
                  Utilidades para optimizar tu suplementación
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <ToolCard
                    icon={BookOpen}
                    title="Protocolos Guiados"
                    description="Planes de suplementación experta"
                    onClick={() => navigate('/protocols')}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )} */}

        {/* Search Bar Global - Visible en vista de categorías y suplementos */}
        {(viewMode === 'categories' || viewMode === 'supplements') && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-4"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder={displayMode === 'supplements' 
                ? "Buscar suplementos..." 
                : "Buscar categorías, subcategorías y suplementos..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            </div>
          </motion.div>
        )}

        {/* Selector de Categorías/Suplementos - Debajo del buscador, pegado al panel */}
        {(viewMode === 'categories' || viewMode === 'supplements') && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mb-0"
          >
            <div className="flex bg-background rounded-t-lg p-1 border border-b-0 border-muted-foreground/20 shadow-sm">
              <button
                onClick={() => {
                  setDisplayMode('supplements');
                  setSearchTerm('');
                  setViewMode('categories');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  displayMode === 'supplements'
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Suplementos
              </button>
              <button
                onClick={() => {
                  setDisplayMode('categories');
                  setSearchTerm('');
                  setViewMode('categories');
                }}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  displayMode === 'categories'
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                Categorías
              </button>
            </div>
          </motion.div>
        )}

        {/* Resultados de búsqueda unificada */}
        {searchTerm && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-6 w-6 text-green-600" />
                  Resultados de búsqueda
                </CardTitle>
                <CardDescription>
                  {hasResults 
                    ? `Encontrados ${allSearchResults.length} resultados para "${searchTerm}"`
                    : `No se encontraron resultados para "${searchTerm}"`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Categorías y subcategorías en grid de 1 columna con CategoryCard */}
                <div className="flex flex-col gap-4">
                  {hasResults && allSearchResults.filter(item => item.type === 'category' || item.type === 'subcategory').map((item, index) => {
                    let count = 0;
                    let countLabel = '';
                    if (item.type === 'category') {
                      const subs = subcategories.filter(sub => Array.isArray(sub.parent_category_id) && sub.parent_category_id.includes(item.id));
                      count = subs.length;
                      countLabel = 'subcategorías';
                    } else if (item.type === 'subcategory') {
                      const sups = thirdLevelCategories.filter(supp => Array.isArray(supp.parent_category_id) && supp.parent_category_id.includes(item.id));
                      count = sups.length;
                      countLabel = 'suplementos';
                    }
                    return (
                      <CategoryCard
                        key={item.id}
                        id={item.id}
                        name={item.name}
                        description={item.description}
                        iconUrl={item.icon_url}
                        color={item.color}
                        onClick={() => handleUnifiedSearchSelect(item)}
                        hasSubcategories={item.type === 'category'}
                        isSubcategory={item.type === 'subcategory'}
                        subcategoryCount={count}
                        countLabel={countLabel}
                      />
                    );
                  })}
                </div>
                {/* Suplementos en grid de 2 columnas con SupplementCard */}
                <div className={`grid grid-cols-2 gap-4${hasResults && allSearchResults.some(item => item.type === 'supplement') ? ' mt-6' : ''}`}> 
                  {hasResults && allSearchResults.filter(item => item.type === 'supplement').map((item, index) => (
                    <SupplementCard
                      key={`search-supplement-${item.name}-${index}`}
                      id={item.name}
                      name={item.name}
                      description={item.description}
                      imageUrl={item.icon_url}
                      onClick={() => handleSupplementClick(item)}
                    />
                  ))}
                </div>
                {!hasResults && (
                  <motion.div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">No se encontraron resultados</h3>
                    <p className="text-muted-foreground">Intenta con otros términos de búsqueda</p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Suplementos Section - Modo suplementos sin búsqueda */}
        {displayMode === 'supplements' && !searchTerm && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="rounded-t-none border-t-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-6 w-6 text-green-600" />
                  Suplementos
                </CardTitle>
                <CardDescription>
                  Explora todos los suplementos disponibles ordenados alfabéticamente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {supplements
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((supplement, index) => (
                      <motion.div
                        key={`supplement-${supplement.name}-${index}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 + index * 0.05 }}
                      >
                        <SupplementCard
                          id={supplement.name}
                          name={supplement.name}
                          description={supplement.description}
                          imageUrl={supplement.icon_url}
                          onClick={() => handleSupplementClick(supplement as any)}
                        />
                      </motion.div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Categories Section - Solo cuando no hay búsqueda y modo categorías */}
        {displayMode === 'categories' && viewMode === 'categories' && !searchTerm && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="rounded-t-none border-t-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-6 w-6 text-green-600" />
                  Categorías
                </CardTitle>
                <CardDescription>
                  Explora las categorías principales de suplementos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {mainCategories
                    .slice()
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((category, index) => {
                      const subcategories = getSubcategoriesByCategory(category.id);
                      const hasSubcategories = subcategories.length > 0;
                      const subcategoryCount = subcategories.length;
                      return (
                        <motion.div
                          key={category.id}
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                        >
                          <CategoryCard
                            id={category.id}
                            name={category.name}
                            description={category.description}
                            iconUrl={category.icon_url}
                            color={category.color}
                            onClick={() => handleCategorySelect(category)}
                            hasSubcategories={hasSubcategories}
                            subcategoryCount={subcategoryCount}
                            countLabel="subcategorías"
                          />
                        </motion.div>
                      );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Subcategories Section - igual que categorías principales */}
        {viewMode === 'subcategories' && selectedMainCategory && (
          <>
            {/* Subcategorías normales en grid de una columna */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-6 w-6 text-green-600" />
                    Subcategorías
                  </CardTitle>
                  <CardDescription>
                    {selectedMainCategory.name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-4">
                    {subcategories
                      .filter(sub => {
                        // Solo subcategorías que tienen suplementos hijos
                        const supplements = getSupplementsBySubcategory(sub.id);
                        return Array.isArray(sub.parent_category_id) && sub.parent_category_id.includes(selectedMainCategory.id) && supplements.length > 0;
                      })
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map((subcategory, index) => {
                        const supplementsCount = getSupplementsBySubcategory(subcategory.id).length;
                        return (
                          <motion.div
                            key={subcategory.id}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.4 + index * 0.1 }}
                          >
                            <CategoryCard
                              id={subcategory.id}
                              name={subcategory.name}
                              description={subcategory.description}
                              iconUrl={subcategory.icon_url}
                              color={subcategory.color}
                              onClick={() => handleSubcategoryClick(subcategory.id)}
                              hasSubcategories={true}
                              subcategoryCount={supplementsCount}
                              isSubcategory={true}
                              countLabel="suplementos"
                            />
                          </motion.div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Subcategorías que se comportan como suplementos y suplementos en grid de dos columnas solo si hay elementos */}
            {(() => {
              // Subcategorías finales (sin hijos)
              const finalSubcategories = subcategories
                .filter(sub => {
                  const supplements = getSupplementsBySubcategory(sub.id);
                  return Array.isArray(sub.parent_category_id) && sub.parent_category_id.includes(selectedMainCategory.id) && supplements.length === 0;
                })
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name));
              // Suplementos finales que no están dentro de una subcategoría que ya se muestra arriba
              const subcategoryIdsWithSupplements = subcategories
                .filter(sub => Array.isArray(sub.parent_category_id) && sub.parent_category_id.includes(selectedMainCategory.id) && getSupplementsBySubcategory(sub.id).length > 0)
                .map(sub => sub.id);
              const finalSupplements = thirdLevelCategories
                .filter(supp => Array.isArray(supp.parent_category_id) && supp.parent_category_id.includes(selectedMainCategory.id) && !supp.parent_category_id.some((id: string) => subcategoryIdsWithSupplements.includes(id)))
                .slice()
                .sort((a, b) => a.name.localeCompare(b.name));
              if (finalSubcategories.length === 0 && finalSupplements.length === 0) return null;
              return (
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <FolderOpen className="h-6 w-6 text-green-600" />
                        Suplementos
                      </CardTitle>
                      <CardDescription>
                        {selectedMainCategory.name}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        {/* Subcategorías finales que se comportan como suplemento */}
                        {finalSubcategories.map(sub => (
                          <SupplementCard
                            key={sub.id}
                            id={sub.id}
                            name={sub.name}
                            description={sub.description}
                            imageUrl={sub.icon_url}
                            onClick={() => handleSupplementClick(sub)}
                          />
                        ))}
                        {/* Suplementos finales que no están dentro de una subcategoría que ya se muestra arriba */}
                        {finalSupplements.map((supp, index) => (
                          <SupplementCard
                            key={`final-supplement-${supp.name}-${index}`}
                            id={supp.name}
                            name={supp.name}
                            description={supp.description}
                            imageUrl={supp.icon_url}
                            onClick={() => handleSupplementClick(supp)}
                          />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })()}
          </>
        )}
      </div>
    </motion.div>
  );
};
