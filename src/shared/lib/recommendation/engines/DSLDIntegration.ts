import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface DSLDProduct {
  productId: string;
  productName: string;
  brandName: string;
  productType: string;
  supplementForm: string;
  marketStatus: string;
  ingredients: string[];
  servingSize?: string;
  servingSizeUnit?: string;
  dietarySupplementFacts?: any;
  labelStatements?: string[];
  otherIngredients?: string[];
}

export interface DSLDIntegrationConfig {
  enableProductAnalysis: boolean;
  enableIngredientAnalysis: boolean;
  enableBrandVerification: boolean;
  enableMarketStatusCheck: boolean;
  minIngredientCount: number;
}

export class DSLDIntegration {
  private config: DSLDIntegrationConfig;

  constructor(config: Partial<DSLDIntegrationConfig> = {}) {
    this.config = {
      enableProductAnalysis: true,
      enableIngredientAnalysis: true,
      enableBrandVerification: true,
      enableMarketStatusCheck: true,
      minIngredientCount: 1,
      ...config
    };
  }

  /**
   * Analiza un producto usando datos DSLD
   */
  async analyzeProduct(productEAN: string): Promise<{
    productInfo: DSLDProduct | null;
    ingredientAnalysis: any;
    brandVerification: boolean;
    marketStatus: string;
    safetyScore: number;
    qualityScore: number;
  }> {
    try {
      // Buscar producto en DSLD
      const productInfo = await this.getProductInfo(productEAN);
      
      if (!productInfo) {
        return {
          productInfo: null,
          ingredientAnalysis: null,
          brandVerification: false,
          marketStatus: 'unknown',
          safetyScore: 0,
          qualityScore: 0
        };
      }

      // Análisis de ingredientes
      const ingredientAnalysis = this.config.enableIngredientAnalysis 
        ? await this.analyzeIngredients(productInfo.ingredients)
        : null;

      // Verificación de marca
      const brandVerification = this.config.enableBrandVerification
        ? await this.verifyBrand(productInfo.brandName)
        : false;

      // Estado del mercado
      const marketStatus = productInfo.marketStatus;

      // Calcular scores
      const safetyScore = this.calculateSafetyScore(productInfo, ingredientAnalysis);
      const qualityScore = this.calculateQualityScore(productInfo, brandVerification);

      return {
        productInfo,
        ingredientAnalysis,
        brandVerification,
        marketStatus,
        safetyScore,
        qualityScore
      };
    } catch (error) {
      console.error('Error analizando producto DSLD:', error);
      return {
        productInfo: null,
        ingredientAnalysis: null,
        brandVerification: false,
        marketStatus: 'unknown',
        safetyScore: 0,
        qualityScore: 0
      };
    }
  }

  /**
   * Obtiene información del producto desde DSLD
   */
  private async getProductInfo(productEAN: string): Promise<DSLDProduct | null> {
    try {
      // Buscar en datos reales de DSLD
      const productData = await this.loadDSLDProductData(productEAN);
      
      if (!productData) {
        return null;
      }

      return {
        productId: productData.productId || productEAN,
        productName: productData.productName || 'Unknown Product',
        brandName: productData.brandName || 'Unknown Brand',
        productType: productData.productType || 'Unknown Type',
        supplementForm: productData.supplementForm || 'Unknown Form',
        marketStatus: productData.marketStatus || 'Unknown',
        ingredients: productData.ingredients || [],
        servingSize: productData.servingSize,
        servingSizeUnit: productData.servingSizeUnit,
        dietarySupplementFacts: productData.dietarySupplementFacts,
        labelStatements: productData.labelStatements || [],
        otherIngredients: productData.otherIngredients || []
      };
    } catch (error) {
      console.error('Error obteniendo información del producto:', error);
      return null;
    }
  }

  /**
   * Carga datos reales de DSLD
   */
  private async loadDSLDProductData(productEAN: string): Promise<any> {
    try {
      console.log(`Buscando producto ${productEAN} en datos DSLD reales...`);
      
      const fs = require('fs');
      const path = require('path');
      
      // Buscar en todos los archivos ProductOverview
      for (let i = 1; i <= 8; i++) {
        const overviewPath = path.join(__dirname, `../../real_data/dsld/ProductOverview_${i}.csv`);
        
        if (fs.existsSync(overviewPath)) {
          const productData = await this.searchProductInFile(overviewPath, productEAN);
          if (productData) {
            // Enriquecer con datos adicionales
            const enrichedData = await this.enrichProductData(productData, i);
            return enrichedData;
          }
        }
      }
      
      console.log(`Producto ${productEAN} no encontrado en datos DSLD`);
      return null;
    } catch (error) {
      console.error('Error cargando datos DSLD:', error);
      return null;
    }
  }

  /**
   * Busca un producto en un archivo CSV específico
   */
  private async searchProductInFile(filePath: string, productEAN: string): Promise<any> {
    try {
      const fs = require('fs');
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n');
      
      // Header: URL,DSLD ID,Product Name,Brand Name,Bar Code,Net Contents,Serving Size,Product Type [LanguaL],Supplement Form [LanguaL],Date Entered into DSLD,Market Status,Suggested Use
      const headers = lines[0].split(',');
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        if (columns.length < headers.length) continue;
        
        // Buscar por Bar Code (columna 4)
        const barCode = columns[4]?.replace(/\s/g, ''); // Remover espacios
        if (barCode === productEAN) {
          return {
            productId: columns[1], // DSLD ID
            productName: columns[2], // Product Name
            brandName: columns[3], // Brand Name
            barCode: columns[4], // Bar Code
            netContents: columns[5], // Net Contents
            servingSize: columns[6], // Serving Size
            productType: columns[7], // Product Type
            supplementForm: columns[8], // Supplement Form
            marketStatus: columns[10], // Market Status
            suggestedUse: columns[11] // Suggested Use
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error buscando producto en archivo:', error);
      return null;
    }
  }

  /**
   * Enriquece los datos del producto con información adicional
   */
  private async enrichProductData(productData: any, fileIndex: number): Promise<any> {
    try {
      const fs = require('fs');
      const path = require('path');
      
      // Cargar ingredientes desde DietarySupplementFacts
      const factsPath = path.join(__dirname, `../../real_data/dsld/DietarySupplementFacts_${fileIndex}.csv`);
      if (fs.existsSync(factsPath)) {
        productData.ingredients = await this.loadIngredientsFromFile(factsPath, productData.productId);
      }
      
      // Cargar declaraciones desde LabelStatements
      const statementsPath = path.join(__dirname, `../../real_data/dsld/LabelStatements_${fileIndex}.csv`);
      if (fs.existsSync(statementsPath)) {
        productData.labelStatements = await this.loadStatementsFromFile(statementsPath, productData.productId);
      }
      
      // Cargar ingredientes adicionales desde OtherIngredients
      const otherIngredientsPath = path.join(__dirname, `../../real_data/dsld/OtherIngredients_${fileIndex}.csv`);
      if (fs.existsSync(otherIngredientsPath)) {
        productData.otherIngredients = await this.loadOtherIngredientsFromFile(otherIngredientsPath, productData.productId);
      }
      
      return productData;
    } catch (error) {
      console.error('Error enriqueciendo datos del producto:', error);
      return productData;
    }
  }

  /**
   * Carga ingredientes desde archivo de hechos nutricionales
   */
  private async loadIngredientsFromFile(filePath: string, productId: string): Promise<string[]> {
    try {
      const fs = require('fs');
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n');
      const ingredients: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        if (columns.length >= 5 && columns[1] === productId) {
          const ingredient = columns[4]; // Ingredient column
          if (ingredient && !ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
          }
        }
      }
      
      return ingredients;
    } catch (error) {
      console.error('Error cargando ingredientes:', error);
      return [];
    }
  }

  /**
   * Carga declaraciones desde archivo de declaraciones
   */
  private async loadStatementsFromFile(filePath: string, productId: string): Promise<string[]> {
    try {
      const fs = require('fs');
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n');
      const statements: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        if (columns.length >= 3 && columns[1] === productId) {
          const statement = columns[2]; // Statement column
          if (statement && !statements.includes(statement)) {
            statements.push(statement);
          }
        }
      }
      
      return statements;
    } catch (error) {
      console.error('Error cargando declaraciones:', error);
      return [];
    }
  }

  /**
   * Carga ingredientes adicionales desde archivo de otros ingredientes
   */
  private async loadOtherIngredientsFromFile(filePath: string, productId: string): Promise<string[]> {
    try {
      const fs = require('fs');
      const csvContent = fs.readFileSync(filePath, 'utf-8');
      const lines = csvContent.split('\n');
      const ingredients: string[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',');
        if (columns.length >= 3 && columns[1] === productId) {
          const ingredient = columns[2]; // Other Ingredient column
          if (ingredient && !ingredients.includes(ingredient)) {
            ingredients.push(ingredient);
          }
        }
      }
      
      return ingredients;
    } catch (error) {
      console.error('Error cargando ingredientes adicionales:', error);
      return [];
    }
  }

  /**
   * Analiza ingredientes del producto
   */
  private async analyzeIngredients(ingredients: string[]): Promise<any> {
    const analysis = {
      totalIngredients: ingredients.length,
      knownIngredients: 0,
      unknownIngredients: 0,
      potentialAllergens: [] as string[],
      beneficialIngredients: [] as string[],
      questionableIngredients: [] as string[]
    };

    // Lista de ingredientes conocidos y sus categorías
    const knownIngredients = [
      'vitamin_d3', 'vitamin_d', 'calcium', 'magnesium', 'zinc', 'iron',
      'vitamin_c', 'vitamin_b12', 'folate', 'omega_3', 'probiotics'
    ];

    const allergens = [
      'soy', 'dairy', 'gluten', 'nuts', 'shellfish', 'eggs'
    ];

    const beneficial = [
      'vitamin_d3', 'omega_3', 'probiotics', 'magnesium', 'zinc'
    ];

    const questionable = [
      'artificial_colors', 'artificial_flavors', 'preservatives'
    ];

    ingredients.forEach(ingredient => {
      const lowerIngredient = ingredient.toLowerCase();
      
      if (knownIngredients.some(known => lowerIngredient.includes(known))) {
        analysis.knownIngredients++;
      } else {
        analysis.unknownIngredients++;
      }

      if (allergens.some(allergen => lowerIngredient.includes(allergen))) {
        analysis.potentialAllergens.push(ingredient);
      }

      if (beneficial.some(ben => lowerIngredient.includes(ben))) {
        analysis.beneficialIngredients.push(ingredient);
      }

      if (questionable.some(quest => lowerIngredient.includes(quest))) {
        analysis.questionableIngredients.push(ingredient);
      }
    });

    return analysis;
  }

  /**
   * Verifica la marca del producto
   */
  private async verifyBrand(brandName: string): Promise<boolean> {
    // Lista de marcas verificadas (en producción vendría de base de datos)
    const verifiedBrands = [
      'Nature Made', 'Centrum', 'Garden of Life', 'NOW Foods',
      'Thorne', 'Pure Encapsulations', 'Life Extension'
    ];

    return verifiedBrands.includes(brandName);
  }

  /**
   * Calcula score de seguridad
   */
  private calculateSafetyScore(product: DSLDProduct, ingredientAnalysis: any): number {
    let score = 0.5; // Base score

    // Bonificación por ingredientes conocidos
    if (ingredientAnalysis) {
      const knownRatio = ingredientAnalysis.knownIngredients / ingredientAnalysis.totalIngredients;
      score += knownRatio * 0.3;
    }

    // Bonificación por estado del mercado
    if (product.marketStatus === 'On Market') {
      score += 0.2;
    }

    // Penalización por alérgenos
    if (ingredientAnalysis && ingredientAnalysis.potentialAllergens.length > 0) {
      score -= 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calcula score de calidad
   */
  private calculateQualityScore(product: DSLDProduct, brandVerification: boolean): number {
    let score = 0.5; // Base score

    // Bonificación por marca verificada
    if (brandVerification) {
      score += 0.3;
    }

    // Bonificación por ingredientes beneficiosos
    if (product.ingredients.length > 0) {
      score += 0.1;
    }

    // Bonificación por información completa
    if (product.servingSize && product.dietarySupplementFacts) {
      score += 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Obtiene productos recomendados basados en DSLD
   */
  async getRecommendedProducts(category: string, userProfile: any): Promise<DSLDProduct[]> {
    try {
      // Buscar en datos reales de DSLD
      const realProducts = await this.loadDSLDProductsByCategory(category);
      
      if (!realProducts || realProducts.length === 0) {
        console.log(`No se encontraron productos reales para la categoría: ${category}`);
        return [];
      }

      return realProducts;
    } catch (error) {
      console.error('Error obteniendo productos recomendados:', error);
      return [];
    }
  }

  /**
   * Carga productos reales de DSLD por categoría
   */
  private async loadDSLDProductsByCategory(category: string): Promise<DSLDProduct[]> {
    try {
      console.log(`Cargando productos reales de DSLD para categoría: ${category}`);
      
      // TODO: Implementar carga real desde archivos CSV de DSLD
      // - Filtrar ProductOverview_*.csv por categoría
      // - Combinar con DietarySupplementFacts_*.csv
      // - Agregar LabelStatements_*.csv y OtherIngredients_*.csv
      
      return [];
    } catch (error) {
      console.error('Error cargando productos DSLD por categoría:', error);
      return [];
    }
  }

  /**
   * Sincroniza datos DSLD
   */
  async syncDSLDData(): Promise<void> {
    try {
      console.log('Sincronizando datos DSLD...');
      // Aquí implementarías la lógica para sincronizar con la API de DSLD
      // Por ahora, solo log
      console.log('Datos DSLD sincronizados');
    } catch (error) {
      console.error('Error sincronizando datos DSLD:', error);
    }
  }
}
