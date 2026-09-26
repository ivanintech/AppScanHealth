import { useState, useEffect } from "react";
import { supabase } from "@/shared/supabase/client";

export interface Supplement {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  color: string;
  parent_category_id: string[] | null;
  sort_order: number;
  health_goals: string | null;
  considerations: string | null;
  usage_instructions: string | null;
  recommended_time: string | null;
  impact: string | null;
  side_effects: string | null;
  interactions: string | null;
  search_keywords: string | null;
  target_audience: string | null;
  level: number | null;
}

export const useSupplements = () => {
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSupplements = async () => {
      try {
        setLoading(true);
        // Obtener suplementos de la tabla categories donde recommended_time no es null o level = 3
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .or('recommended_time.not.is.null,level.eq.3')
          .order('name');

        if (error) {
          throw error;
        }

        // Lista de imágenes que realmente existen
        const existingImages = [
          'bcaas', 'beetroot', 'beta-alanine', 'bicarbonate', 'caffeine', 'calcium',
          'collagen', 'creatine', 'creatine-alt1', 'creatine-alt2', 'creatine-alt3',
          'greens-powder', 'iron', 'magnesium', 'multivitamin', 'omega-3', 'probiotic',
          'probiotics', 'protein-powder', 'universal-creatine', 'vitamin-c', 'vitamin-d', 'zinc'
        ];

        // Filtrar y limpiar datos de suplementos
        const cleanedData = (data || []).map((supplement: any) => ({
          ...supplement,
          // Asegurar que level tenga un valor por defecto si no existe
          level: supplement.level ?? 1,
          // Solo usar imágenes que realmente existen
          icon_url: supplement.icon_url ? (() => {
            // Si es una URL externa válida, mantenerla
            if (supplement.icon_url.startsWith('http') && !supplement.icon_url.includes('iherb.com')) {
              return supplement.icon_url;
            }
            
            // Si ya es una ruta de ImagesSupplements, mantenerla
            if (supplement.icon_url.includes('ImagesSupplements')) {
              return supplement.icon_url;
            }
            
            // Extraer el nombre base del archivo
            let baseName = supplement.icon_url
              .replace(/^\/?assets\//, '')
              .replace(/^\/?ImagesSupplements\//, '')
              .replace(/\.(png|jpg|jpeg)$/i, '');
            
            // Solo usar la imagen si existe en nuestra lista
            if (existingImages.includes(baseName)) {
              return `/assets/${baseName}.jpg`;
            }
            
            // Si no existe, usar placeholder
            return '/placeholder.svg';
          })() : '/placeholder.svg'
        }));
        
        console.log('🔍 Cleaned supplements data:', cleanedData);
        console.log('🔍 Image URLs sample:', cleanedData.slice(0, 5).map(s => ({ name: s.name, icon_url: s.icon_url })));
        setSupplements(cleanedData);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching supplements:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSupplements();
  }, []);

  return { supplements, loading, error };
};
