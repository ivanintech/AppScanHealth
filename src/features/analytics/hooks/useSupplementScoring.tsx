import { useState, useEffect } from 'react';
import { calcularPuntuacion } from '@/shared/lib/scoring/scoringManager';

interface ScoringResult {
  total: number;
  eficacia_30?: { exists: boolean; score: number };
  seguridad_60?: { exists: boolean; score: number };
  extra_10?: { exists: boolean; score: number };
  normalized_nutriscore_60?: { exists: boolean; value: any; score: number };
  additives_score_30?: { exists: boolean; additives: any[]; score: number };
}

export const useSupplementScoring = (supplement: any) => {
  const [scoringData, setScoringData] = useState<ScoringResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supplement) return;

    const calculateScoring = async () => {
      setLoading(true);
      setError(null);

      try {
        // Función helper para parsear campos JSON
        const parseJsonField = (field: any): any => {
          if (typeof field === 'string') {
            try {
              return JSON.parse(field);
            } catch (e) {
              console.warn('Error parsing JSON field:', field);
              return field;
            }
          }
          return field;
        };

        // Preparar los datos del producto para el sistema de scoring
        const productData = {
          // Datos básicos
          ean: supplement.ean,
          product_name: supplement.product_name,
          brands_tags: parseJsonField(supplement.brands_tags),
          labels_tags: parseJsonField(supplement.labels_tags),
          countries_tags: parseJsonField(supplement.countries_tags),
          ingredients_text: supplement.ingredients_text,
          additives_tags: parseJsonField(supplement.additives_tags),
          allergens_tags: parseJsonField(supplement.allergens_tags),
          traces_tags: parseJsonField(supplement.traces_tags),
          keywords: supplement.keywords,
          
          // Datos nutricionales
          nutriscore_score: supplement.nutriscore_score,
          nova_group: supplement.nova_group,
          
          // Ingredientes
          known_ingredients_n: supplement.known_ingredients_n,
          unknown_ingredients_n: supplement.unknown_ingredients_n,
          ingredients_analysis_tags: parseJsonField(supplement.ingredients_analysis_tags),
          
          // Datos nutricionales por 100g (parsear JSON si es string)
          nutriments: supplement.nutriments ? 
            (typeof supplement.nutriments === 'string' ? 
              JSON.parse(supplement.nutriments) : 
              supplement.nutriments) : {},
          
          // Categorización
          categories_tags: parseJsonField(supplement.categories_tags),
          category_id: supplement.category_id,
          subcategory_id: supplement.subcategory_id,
          
          // Datos adicionales
          serving_quantity: supplement.serving_quantity,
          serving_size: supplement.serving_size,
          serving_unit: supplement.serving_unit,
        };

        console.log('🔍 Calculando scoring para:', supplement.product_name);
        console.log('📊 Datos del producto:', productData);

        const result = await calcularPuntuacion(productData);
        
        console.log('✅ Resultado del scoring:', result);
        
        setScoringData(result);
      } catch (err) {
        console.error('❌ Error calculando scoring:', err);
        setError(err instanceof Error ? err.message : 'Error desconocido');
        
        // Fallback al score calculado de la base de datos
        setScoringData({
          total: supplement.calculated_score || 75
        });
      } finally {
        setLoading(false);
      }
    };

    calculateScoring();
  }, [supplement]);

  return {
    scoringData,
    loading,
    error,
    refetch: () => {
      if (supplement) {
        setScoringData(null);
        setError(null);
        // El useEffect se ejecutará automáticamente
      }
    }
  };
};
