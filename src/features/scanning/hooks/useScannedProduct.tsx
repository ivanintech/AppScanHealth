import { useState, useCallback } from "react";
import { obtenerProductoOFF } from "@/shared/supabase/productFetcherOFF";
import { obtenerProductoApi } from "@/shared/integrations/openfoodfacts/productFetcherAPI";

// Tipo genérico para el JSON del producto
type ProductJSON = { [key: string]: unknown };

// Hook para buscar un producto por EAN
export function useScannedProduct() {
    // Estado del producto encontrado
    const [product, setProduct] = useState<ProductJSON | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Función para buscar producto
    const fetchProduct = useCallback(async (ean: string): Promise<ProductJSON | null> => {
        setLoading(true);       // iniciar loading
        setError(null);         // limpiar errores previos

        try {
            // Intentar obtener de la base de datos en la nube
            let result = await obtenerProductoOFF(ean);

            // Si no está, consultar API externa
            if (!result) {
                console.log("No encontrado en DB en la nube, consultando OpenFoodFacts API...");
                result = await obtenerProductoApi(ean);
            }

            // Producto no encontrado
            if (!result) {
                setError("Producto no encontrado en ninguna fuente");
            }

            setProduct(result);   // actualizar estado
            return result;        // devolver producto real

        } catch (err) {
            // Error en fetch
            console.error("Error buscando producto:", err);
            setError("Error buscando producto");
            setProduct(null);
            return null;
        } finally {
            setLoading(false);    // terminar loading
        }
    }, []);

    // Retornar estados y función de búsqueda
    return { product, loading, error, fetchProduct };
}
