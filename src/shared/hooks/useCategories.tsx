import { useState, useEffect } from 'react';
import { supabase } from '@/shared/supabase/client';

export interface SupplementCategory {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  color: string | null;
  parent_category_id: string[] | string | null;
  sort_order: number | null;
  health_goals: string | null;
  considerations: string | null;
  usage_instructions: string | null;
  recommended_time: string | null;
  impact: string | null;
  side_effects: string | null;
  interactions: string | null;
  search_keywords: string | null;
  target_audience: string | null;
  level?: number;
}

export interface CategoryWithProducts extends SupplementCategory {
  products: any[];
}

export const useCategories = () => {
  const [categories, setCategories] = useState<SupplementCategory[]>([]);
  const [mainCategories, setMainCategories] = useState<SupplementCategory[]>([]);
  const [subcategories, setSubcategories] = useState<SupplementCategory[]>([]);
  const [thirdLevelCategories, setThirdLevelCategories] = useState<SupplementCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const processCategoriesData = (data: SupplementCategory[]) => {
    console.log('📊 [useCategories] Processing categories data:', data.length, 'items');
    
    // Filtrar categorías principales (sin parent_category_id o con parent_category_id null)
    const mainCats = data.filter(cat => 
      !cat.parent_category_id || 
      cat.parent_category_id === null || 
      (Array.isArray(cat.parent_category_id) && cat.parent_category_id.length === 0)
    );
    
    // Filtrar subcategorías (con parent_category_id)
    const subCats = data.filter(cat => 
      cat.parent_category_id && 
      cat.parent_category_id !== null && 
      (Array.isArray(cat.parent_category_id) ? cat.parent_category_id.length > 0 : true)
    );

    // Identificar categorías de tercer nivel
    const thirdLevelCats = subCats.filter(cat => {
      if (Array.isArray(cat.parent_category_id)) {
        return cat.parent_category_id.length > 1;
      }
      return false;
    });

    console.log('📊 [useCategories] Categorized:', {
      main: mainCats.length,
      sub: subCats.length,
      third: thirdLevelCats.length
    });

    setCategories(data);
    setMainCategories(mainCats);
    setSubcategories(subCats);
    setThirdLevelCategories(thirdLevelCats);
  };

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 [useCategories] Starting to fetch categories...');

      // ESTRATEGIA 1: Consulta directa a la tabla
      console.log('🔍 [useCategories] Strategy 1: Direct table query...');
      const { data: directData, error: directError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!directError && directData && directData.length > 0) {
        console.log('✅ [useCategories] Direct query successful:', directData.length, 'categories');
        processCategoriesData(directData);
        setLoading(false);
        return;
      }

      // ESTRATEGIA 2: Función RPC como fallback
      console.log('🔍 [useCategories] Strategy 2: RPC function fallback...');
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_categories_hierarchy');

      if (!rpcError && rpcData && rpcData.length > 0) {
        console.log('✅ [useCategories] RPC query successful:', rpcData.length, 'categories');
        processCategoriesData(rpcData);
        setLoading(false);
        return;
      }

      // ESTRATEGIA 3: Datos estáticos como último recurso
      console.log('🔍 [useCategories] Strategy 3: Static data fallback...');
      try {
        const response = await fetch('/data/categories.json');
        if (response.ok) {
          const staticData = await response.json();
          console.log('✅ [useCategories] Static data loaded:', staticData.length, 'categories');
          processCategoriesData(staticData);
          setLoading(false);
          return;
        }
      } catch (staticError) {
        console.warn('⚠️ [useCategories] Static data fallback failed:', staticError);
      }

      // Si todas las estrategias fallan
      throw new Error('No se pudieron cargar las categorías con ninguna estrategia');

    } catch (error) {
      console.error('❌ [useCategories] All strategies failed:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
      setLoading(false);
      
      // Retry logic
      if (retryCount < 3) {
        console.log(`🔄 [useCategories] Retrying... (${retryCount + 1}/3)`);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          fetchCategories();
        }, 2000 * (retryCount + 1)); // Backoff exponencial
      }
    }
  };

  useEffect(() => {
      fetchCategories();
  }, []);

  const refetch = () => {
    setRetryCount(0);
    fetchCategories();
  };

  return {
    categories,
    mainCategories,
    subcategories,
    thirdLevelCategories,
    loading,
    error,
    refetch,
    retryCount
  };
};
