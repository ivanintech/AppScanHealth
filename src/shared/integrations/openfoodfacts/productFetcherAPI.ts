// Tipo genérico para el JSON del producto
type ProductJSON = { [key: string]: unknown };

export async function obtenerProductoApi(suplementoId: string): Promise<ProductJSON | null> {
    try {
        // Construir URL de la API
        const url = `https://world.openfoodfacts.net/api/v2/product/${suplementoId}`;

        // Hacer la petición GET
        const response = await fetch(url);

        // Parsear la respuesta a JSON
        const data = await response.json();

        // Comprobar si existe el producto
        if (data.product) {
            return data.product;
        } else {
            console.log("Suplemento no encontrado en OpenFoodFacts API");
            return null;
        }
    } catch (err) {
        // Capturar cualquier error de red o parsing
        console.error("Error consultando OpenFoodFacts API:", err);
        return null;
    }
}
