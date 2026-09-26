import { supabase } from './client';

// Tipo genérico para el JSON del producto
type ProductJSON = { [key: string]: unknown };

// Función que obtiene un producto desde Supabase
export const obtenerProductoOFF = async (suplementoId: string): Promise<ProductJSON | null> => {
    try {
        const cleanEAN = suplementoId.trim();

        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('ean', cleanEAN)
            .single();

        if (error) throw error;

        return data || null;
    } catch (err) {
        console.error(`Error al obtener suplemento ${suplementoId}:`, err);
        return null;
    }
};
