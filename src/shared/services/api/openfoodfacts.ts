/**
 * Servicio para integración con OpenFoodFacts API
 * Proporciona métodos para obtener información de productos
 */
export class OpenFoodFactsService {
  private static readonly BASE_URL = 'https://world.openfoodfacts.org/api/v0';
  private static readonly TIMEOUT = 10000; // 10 segundos

  /**
   * Obtiene información de un producto por EAN
   */
  static async getProductByEAN(ean: string) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(`${this.BASE_URL}/product/${ean}.json`, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'ScanHealth/1.0 (https://scanhealth.app)',
          'Accept': 'application/json'
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status === 0) {
        throw new Error('Producto no encontrado en OpenFoodFacts');
      }

      return this.transformProductData(data.product);
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: La consulta tardó demasiado');
      }
      console.error('Error obteniendo producto de OpenFoodFacts:', error);
      throw error;
    }
  }

  /**
   * Busca productos por término de búsqueda
   */
  static async searchProducts(searchTerm: string, page: number = 1, pageSize: number = 20) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

      const response = await fetch(
        `${this.BASE_URL}/cgi/search.pl?search_terms=${encodeURIComponent(searchTerm)}&search_simple=1&action=process&json=1&page=${page}&page_size=${pageSize}`,
        {
          signal: controller.signal,
          headers: {
            'User-Agent': 'ScanHealth/1.0 (https://scanhealth.app)',
            'Accept': 'application/json'
          }
        }
      );

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        products: data.products.map((product: any) => this.transformProductData(product)),
        totalProducts: data.count,
        page: data.page,
        pageSize: data.page_size
      };
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Timeout: La búsqueda tardó demasiado');
      }
      console.error('Error buscando productos en OpenFoodFacts:', error);
      throw error;
    }
  }

  /**
   * Transforma los datos del producto de OpenFoodFacts al formato interno
   */
  private static transformProductData(product: any) {
    return {
      ean: product.code || product.ean,
      product_name: product.product_name || product.product_name_es || 'Producto sin nombre',
      brands_tags: product.brands_tags || [],
      categories_tags: product.categories_tags || [],
      ingredients_text: product.ingredients_text || product.ingredients_text_es || '',
      additives_tags: product.additives_tags || [],
      allergens_tags: product.allergens_tags || [],
      image_url: product.image_url || product.image_front_url || '',
      nutriments: product.nutriments || {},
      nutriscore_grade: product.nutriscore_grade || null,
      nova_group: product.nova_group || null,
      labels_tags: product.labels_tags || [],
      packaging_tags: product.packaging_tags || [],
      origins: product.origins || '',
      manufacturing_places: product.manufacturing_places || '',
      stores: product.stores || '',
      countries: product.countries || '',
      created_t: product.created_t || null,
      last_modified_t: product.last_modified_t || null,
      // Campos específicos para suplementos
      supplement_type: this.detectSupplementType(product),
      health_claims: product.health_claims || [],
      warnings: product.warnings || []
    };
  }

  /**
   * Detecta si el producto es un suplemento basado en categorías
   */
  private static detectSupplementType(product: any): string {
    const categories = product.categories_tags || [];
    const supplementKeywords = [
      'supplement', 'vitamin', 'mineral', 'protein', 'creatine',
      'omega', 'probiotic', 'probiotics', 'multivitamin'
    ];

    for (const category of categories) {
      const lowerCategory = category.toLowerCase();
      for (const keyword of supplementKeywords) {
        if (lowerCategory.includes(keyword)) {
          return keyword;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Obtiene información nutricional detallada
   */
  static async getNutritionalInfo(ean: string) {
    try {
      const product = await this.getProductByEAN(ean);
      return {
        nutriments: product.nutriments,
        nutriscore: product.nutriscore_grade,
        nova: product.nova_group,
        ingredients: product.ingredients_text,
        additives: product.additives_tags,
        allergens: product.allergens_tags
      };
    } catch (error) {
      console.error('Error obteniendo información nutricional:', error);
      throw error;
    }
  }

  /**
   * Verifica si un EAN existe en OpenFoodFacts
   */
  static async checkEANExists(ean: string): Promise<boolean> {
    try {
      await this.getProductByEAN(ean);
      return true;
    } catch (error) {
      return false;
    }
  }
}
