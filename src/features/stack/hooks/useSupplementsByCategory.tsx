import { useState, useEffect } from "react";
import { supabase } from "@/shared/supabase/client";
import { Supplement } from "./useSupplements";

export const useSupplementsByCategory = (categoryId: string | null) => {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!categoryId) {
      setSupplements([]);
      return;
    }

    const fetchSupplementsByCategory = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('supplements')
          .select(`
            name, 
            brand, 
            ingredients_text, 
            image_url, 
            nutriments, 
            created_at, 
            description, 
            categories, 
            health_goals, 
            format, 
            category_id, 
            search_keywords, 
            target_audience, 
            usage_instructions, 
            storage_instructions, 
            momento_recomendado, 
            impacto_ayuno, 
            efectos_secundarios, 
            interacciones
          `)
          .eq('category_id', categoryId)
          .order('name');

        if (error) {
          throw error;
        }

        setSupplements(data || []);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching supplements by category:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplementsByCategory();
  }, [categoryId]);

  return { supplements, loading, error };
};

