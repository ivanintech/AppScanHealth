// Importamos el cliente ya configurado
import { supabase } from './client';

/**
 * Devuelve el nombre de la categoría y/o subcategoría según los IDs proporcionados.
 * @param categoryId UUID de la categoría (opcional)
 * @param subcategoryId UUID de la subcategoría (opcional)
 * @returns { categoria?: string, subcategoria?: string }
 */
export const getSupplementCategory = async (
    categoryId?: string,
    subcategoryId?: string
): Promise<{ categoria?: string; subcategoria?: string } | null> => {
    try {
        const result: { categoria?: string; subcategoria?: string } = {};

        if (categoryId) {
            const { data, error } = await supabase
                .from('supplement_categories')
                .select('name')
                .eq('id', categoryId)
                .single();

            if (error) throw error;
            if (data) result.categoria = data.name;
        }

        if (subcategoryId) {
            const { data, error } = await supabase
                .from('supplement_categories_2')
                .select('name')
                .eq('id', subcategoryId)
                .single();

            if (error) throw error;
            if (data) result.subcategoria = data.name;
        }

        return Object.keys(result).length > 0 ? result : null;
    } catch (err) {
        console.error(
            `Error al obtener categoría (categoryId=${categoryId}, subcategoryId=${subcategoryId}):`,
            err
        );
        return null;
    }
};
