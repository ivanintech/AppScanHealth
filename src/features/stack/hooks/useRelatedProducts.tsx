import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';

interface RelatedProduct {
  ean: string;
  product_name: string;
  brands_tags: string;
  image_url: string;
  categories_tags: string;
  calculated_score: number;
}

export const useRelatedProducts = (currentEan: string, currentCategories: string, currentProductName: string) => {
  return useQuery({
    queryKey: ['relatedProducts', currentEan],
    queryFn: async (): Promise<RelatedProduct[]> => {
      if (!currentEan || !currentCategories) return [];

      // Parsear categorías del producto actual
      const currentCategoriesArray = currentCategories
        .split(',')
        .map(cat => cat.trim())
        .filter(cat => cat.length > 0);

      if (currentCategoriesArray.length === 0) return [];

      // Extraer palabras clave del nombre del producto
      const productNameWords = currentProductName
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 3)
        .filter(word => !['mg', 'g', 'ml', 'caps', 'tablet', 'powder', 'liquid'].includes(word));

      // Estrategia 1: Búsqueda por categorías exactas
      let { data: categoryMatches, error: categoryError } = await (supabase as any)
        .from('products')
        .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score, labels_tags')
        .neq('ean', currentEan)
        .not('ean', 'is', null)
        .not('categories_tags', 'is', null)
        .limit(12);

      if (categoryError) {
        console.error('Error fetching category matches:', categoryError);
        categoryMatches = [];
      }

      // Estrategia 2: Búsqueda por palabras clave del nombre
      let nameMatches: any[] = [];
      if (productNameWords.length > 0) {
        for (const word of productNameWords.slice(0, 2)) { // Solo las 2 primeras palabras más relevantes
          const { data: wordData, error: wordError } = await (supabase as any)
            .from('products')
            .select('ean, product_name, brands_tags, image_url, categories_tags, calculated_score, labels_tags')
            .neq('ean', currentEan)
            .not('ean', 'is', null)
            .ilike('product_name', `%${word}%`)
            .limit(4);

          if (!wordError && wordData) {
            nameMatches = [...nameMatches, ...wordData];
          }
        }
      }

      // Combinar y deduplicar resultados
      const allMatches = [...(categoryMatches || []), ...nameMatches];
      const uniqueMatches = allMatches.filter((product, index, self) => 
        index === self.findIndex(p => p.ean === product.ean)
      );

      // Filtrar productos que compartan al menos una categoría relevante
      const filteredProducts = uniqueMatches.filter((product: any) => {
        if (!product.categories_tags) return false;
        
        const productCategories = product.categories_tags
          .split(',')
          .map((cat: string) => cat.trim().toLowerCase());
        
        // Buscar coincidencias más específicas
        const hasCategoryMatch = currentCategoriesArray.some(currentCat => 
          productCategories.some((productCat: string) => {
            const currentLower = currentCat.toLowerCase();
            const productLower = productCat.toLowerCase();
            
            // Coincidencia exacta o parcial
            return productLower.includes(currentLower) || 
                   currentLower.includes(productLower) ||
                   // Coincidencia por palabras clave comunes
                   (currentLower.includes('vitamin') && productLower.includes('vitamin')) ||
                   (currentLower.includes('mineral') && productLower.includes('mineral')) ||
                   (currentLower.includes('protein') && productLower.includes('protein')) ||
                   (currentLower.includes('omega') && productLower.includes('omega'));
          })
        );

        // También considerar coincidencias por nombre si no hay categoría
        const hasNameMatch = productNameWords.length > 0 && 
          productNameWords.some(word => 
            product.product_name.toLowerCase().includes(word)
          );

        return hasCategoryMatch || hasNameMatch;
      });

      // Ordenar por relevancia: primero por score, luego por coincidencia de nombre
      const sortedProducts = filteredProducts.sort((a, b) => {
        const scoreA = a.calculated_score || 0;
        const scoreB = b.calculated_score || 0;
        
        // Si las puntuaciones son muy similares, priorizar coincidencias de nombre
        if (Math.abs(scoreA - scoreB) < 10) {
          const nameMatchA = productNameWords.some(word => 
            a.product_name.toLowerCase().includes(word)
          );
          const nameMatchB = productNameWords.some(word => 
            b.product_name.toLowerCase().includes(word)
          );
          
          if (nameMatchA && !nameMatchB) return -1;
          if (!nameMatchA && nameMatchB) return 1;
        }
        
        return scoreB - scoreA;
      });

      return sortedProducts.slice(0, 6);
    },
    enabled: !!currentEan && !!currentCategories,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
