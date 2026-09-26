import { UserProfile, Supplement, ProductAnalysis, InteractionWarning } from '../types';
import { supabase } from '@/shared/supabase/client';

/**
 * Motor de análisis de productos escaneados
 * Analiza la compatibilidad de un producto específico con el perfil del usuario
 */
export class ProductAnalysisEngine {
  private readonly interactionSeverity = {
    'positive': 1,
    'neutral': 0.5,
    'caution': -0.3,
    'negative': -0.7,
    'critical': -1
  };

  /**
   * Analiza un producto escaneado para un usuario específico
   */
  async analyzeProduct(ean: string, userId: string): Promise<ProductAnalysis> {
    try {
      // 1. Obtener datos del producto
      const product = await this.getProduct(ean);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // 2. Obtener perfil del usuario
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) {
        throw new Error('Usuario no encontrado');
      }

      // 3. Calcular compatibilidad
      const compatibilityScore = await this.calculateCompatibility(product, userProfile);
      
      // 4. Identificar beneficios para el usuario
      const userBenefits = this.identifyUserBenefits(product, userProfile);
      
      // 5. Detectar advertencias
      const warnings = this.detectWarnings(product, userProfile);
      
      // 6. Verificar interacciones
      const interactions = await this.checkInteractions(product, userProfile);
      
      // 7. Generar recomendaciones de uso
      const recommendations = this.generateUsageRecommendations(product, userProfile);
      
      // 8. Crear explicación
      const explanation = this.generateExplanation(product, userProfile, compatibilityScore);

      return {
        product,
        compatibility_score: compatibilityScore,
        user_benefits: userBenefits,
        warnings,
        interactions,
        recommendations,
        explanation
      };

    } catch (error) {
      console.error('Error in analyzeProduct:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos del producto desde la base de datos
   */
  private async getProduct(ean: string): Promise<Supplement | null> {
    try {
      const { data: product, error } = await supabase
        .from('products')
        .select(`
          ean,
          product_name,
          category_id,
          subcategory_id,
          categories_tags,
          ingredients_text,
          nutriments,
          calculated_score,
          image_url,
          brands_tags
        `)
        .eq('ean', ean)
        .single();

      if (error) {
        console.error('Error fetching product:', error);
        return null;
      }

      return {
        ean: product.ean,
        product_name: product.product_name,
        category_id: product.category_id,
        subcategory_id: product.subcategory_id,
        brands_tags: Array.isArray(product.brands_tags) ? product.brands_tags : [],
        categories_tags: Array.isArray(product.categories_tags) ? product.categories_tags : [],
        ingredients_text: product.ingredients_text || '',
        nutriments: (typeof product.nutriments === 'object' && product.nutriments !== null) ? product.nutriments as Record<string, number> : {},
        calculated_score: product.calculated_score || 0,
        image_url: product.image_url
      };

    } catch (error) {
      console.error('Error in getProduct:', error);
      return null;
    }
  }

  /**
   * Obtiene perfil del usuario
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select(`
          id,
          health_goals,
          checkup_results,
          user_supplement_stack(supplement_ean)
        `)
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return {
        id: profile.id,
        age: 30, // Placeholder - implementar extracción real
        gender: 'other', // Placeholder
        weight: 70, // Placeholder
        height: 170, // Placeholder
        health_goals: profile.health_goals || [],
        checkup_results: profile.checkup_results as any,
        current_stack: profile.user_supplement_stack?.map((item: any) => item.supplement_ean) || [],
        activity_level: 'medium', // Placeholder
        diet_type: 'balanced', // Placeholder
        health_conditions: [], // Placeholder
        allergies: [] // Placeholder
      };

    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  /**
   * Calcula la compatibilidad del producto con el usuario
   */
  private async calculateCompatibility(product: Supplement, userProfile: UserProfile): Promise<number> {
    let score = 0;
    let factors = 0;

    // 1. Alineación con objetivos de salud (40%)
    const goalAlignment = this.calculateGoalAlignment(product, userProfile);
    score += goalAlignment * 0.4;
    factors++;

    // 2. Calidad del producto (25%)
    const qualityScore = this.calculateProductQuality(product);
    score += qualityScore * 0.25;
    factors++;

    // 3. Seguridad y contraindicaciones (20%)
    const safetyScore = this.calculateSafetyScore(product, userProfile);
    score += safetyScore * 0.2;
    factors++;

    // 4. Interacciones con stack actual (15%)
    const interactionScore = await this.calculateInteractionScore(product, userProfile);
    score += interactionScore * 0.15;
    factors++;

    return factors > 0 ? Math.max(0, Math.min(score, 1)) : 0.5;
  }

  /**
   * Calcula alineación con objetivos de salud
   */
  private calculateGoalAlignment(product: Supplement, userProfile: UserProfile): number {
    const userGoals = userProfile.health_goals || [];
    if (userGoals.length === 0) return 0.5;

    const categoryMappings = {
      'muscle_gain': ['protein', 'creatine', 'bcaa', 'amino'],
      'weight_loss': ['greens', 'fiber', 'thermogenic', 'fat_burner'],
      'energy': ['b_complex', 'iron', 'coq10', 'energy'],
      'sleep': ['magnesium', 'melatonin', 'sleep', 'relaxation'],
      'stress': ['ashwagandha', 'rhodiola', 'adaptogen', 'stress'],
      'immunity': ['vitamin_c', 'vitamin_d', 'zinc', 'immune'],
      'heart_health': ['omega3', 'coq10', 'heart', 'cardiovascular'],
      'bone_health': ['calcium', 'vitamin_d', 'magnesium', 'bone'],
      'digestive_health': ['probiotic', 'fiber', 'digestive', 'gut'],
      'cognitive_health': ['omega3', 'b_complex', 'brain', 'cognitive']
    };

    let alignmentScore = 0;
    let matchedGoals = 0;

    userGoals.forEach(goal => {
      const relevantKeywords = categoryMappings[goal as keyof typeof categoryMappings] || [];
      const productText = `${product.product_name} ${product.ingredients_text} ${product.categories_tags?.join(' ')}`.toLowerCase();
      
      const hasRelevantKeyword = relevantKeywords.some(keyword => 
        productText.includes(keyword.toLowerCase())
      );

      if (hasRelevantKeyword) {
        alignmentScore += 1;
        matchedGoals++;
      }
    });

    return matchedGoals > 0 ? alignmentScore / userGoals.length : 0;
  }

  /**
   * Calcula calidad del producto
   */
  private calculateProductQuality(product: Supplement): number {
    let score = 0;
    let factors = 0;

    // Score calculado de la base de datos
    if (product.calculated_score) {
      score += product.calculated_score / 100;
      factors++;
    }

    // Análisis de ingredientes naturales
    const ingredients = product.ingredients_text?.toLowerCase() || '';
    const naturalKeywords = ['extract', 'powder', 'natural', 'organic', 'pure'];
    const hasNaturalIngredients = naturalKeywords.some(keyword => 
      ingredients.includes(keyword)
    );
    
    if (hasNaturalIngredients) {
      score += 0.2;
      factors++;
    }

    // Análisis de perfil nutricional
    const nutriments = product.nutriments || {};
    const hasGoodNutrientProfile = this.hasGoodNutrientProfile(nutriments);
    if (hasGoodNutrientProfile) {
      score += 0.2;
      factors++;
    }

    return factors > 0 ? Math.min(score / factors, 1) : 0.5;
  }

  /**
   * Calcula score de seguridad
   */
  private calculateSafetyScore(product: Supplement, userProfile: UserProfile): number {
    let score = 1; // Empezar con score máximo
    let factors = 1;

    // Verificar alergias
    const allergies = userProfile.allergies || [];
    const hasAllergen = allergies.some(allergy => 
      product.ingredients_text?.toLowerCase().includes(allergy.toLowerCase())
    );
    
    if (hasAllergen) {
      score -= 0.5; // Penalizar significativamente
    }

    // Verificar contraindicaciones por edad
    if (userProfile.age < 18) {
      const adultOnlyIngredients = ['caffeine', 'stimulant', 'thermogenic'];
      const hasAdultOnly = adultOnlyIngredients.some(ingredient => 
        product.ingredients_text?.toLowerCase().includes(ingredient)
      );
      if (hasAdultOnly) {
        score -= 0.3;
      }
    }

    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Calcula score de interacciones
   */
  private async calculateInteractionScore(product: Supplement, userProfile: UserProfile): Promise<number> {
    const currentStack = userProfile.current_stack || [];
    if (currentStack.length === 0) return 1; // Sin interacciones si no hay stack

    let totalScore = 0;
    let interactionCount = 0;

    for (const stackEan of currentStack) {
      const interaction = await this.checkSpecificInteraction(product.ean, stackEan);
      if (interaction) {
        totalScore += this.interactionSeverity[interaction.severity as keyof typeof this.interactionSeverity] || 0;
        interactionCount++;
      }
    }

    return interactionCount > 0 ? Math.max(0, totalScore / interactionCount) : 1;
  }

  /**
   * Verifica interacción específica entre dos suplementos
   */
  private async checkSpecificInteraction(ean1: string, ean2: string): Promise<InteractionWarning | null> {
    try {
      const { data: interaction, error } = await supabase
        .from('supplement_interactions')
        .select('*')
        .or(`and(supplement_a_ean.eq.${ean1},supplement_b_ean.eq.${ean2}),and(supplement_a_ean.eq.${ean2},supplement_b_ean.eq.${ean1})`)
        .single();

      if (error || !interaction) return null;

      return {
        type: interaction.interaction_type as any,
        severity: interaction.severity as any,
        description: interaction.description,
        recommendation: interaction.recommendation || ''
      };

    } catch (error) {
      console.error('Error checking interaction:', error);
      return null;
    }
  }

  /**
   * Identifica beneficios específicos para el usuario
   */
  private identifyUserBenefits(product: Supplement, userProfile: UserProfile): string[] {
    const benefits: string[] = [];
    const userGoals = userProfile.health_goals || [];
    const productText = `${product.product_name} ${product.ingredients_text}`.toLowerCase();

    // Beneficios basados en objetivos
    userGoals.forEach(goal => {
      const goalBenefits = this.getBenefitsForGoal(goal, productText);
      benefits.push(...goalBenefits);
    });

    // Beneficios basados en ingredientes
    const ingredientBenefits = this.getIngredientBenefits(productText);
    benefits.push(...ingredientBenefits);

    return [...new Set(benefits)]; // Eliminar duplicados
  }

  /**
   * Detecta advertencias para el usuario
   */
  private detectWarnings(product: Supplement, userProfile: UserProfile): string[] {
    const warnings: string[] = [];

    // Advertencias por edad
    if (userProfile.age < 18) {
      const adultOnlyIngredients = ['caffeine', 'stimulant', 'thermogenic'];
      const hasAdultOnly = adultOnlyIngredients.some(ingredient => 
        product.ingredients_text?.toLowerCase().includes(ingredient)
      );
      if (hasAdultOnly) {
        warnings.push('Este producto contiene ingredientes no recomendados para menores de 18 años');
      }
    }

    // Advertencias por alergias
    const allergies = userProfile.allergies || [];
    allergies.forEach(allergy => {
      if (product.ingredients_text?.toLowerCase().includes(allergy.toLowerCase())) {
        warnings.push(`Este producto contiene ${allergy} - verificar si tienes alergia`);
      }
    });

    // Advertencias por condiciones de salud
    const healthConditions = userProfile.health_conditions || [];
    healthConditions.forEach(condition => {
      const conditionWarnings = this.getConditionWarnings(condition, product);
      warnings.push(...conditionWarnings);
    });

    return warnings;
  }

  /**
   * Verifica interacciones con el stack actual
   */
  private async checkInteractions(product: Supplement, userProfile: UserProfile): Promise<InteractionWarning[]> {
    const interactions: InteractionWarning[] = [];
    const currentStack = userProfile.current_stack || [];

    for (const stackEan of currentStack) {
      const interaction = await this.checkSpecificInteraction(product.ean, stackEan);
      if (interaction) {
        interactions.push(interaction);
      }
    }

    return interactions;
  }

  /**
   * Genera recomendaciones de uso
   */
  private generateUsageRecommendations(product: Supplement, userProfile: UserProfile): string[] {
    const recommendations: string[] = [];

    // Recomendaciones basadas en el tipo de producto
    const productText = product.product_name.toLowerCase();
    
    if (productText.includes('protein') || productText.includes('proteína')) {
      recommendations.push('Tomar después del entrenamiento para optimizar la recuperación muscular');
    }
    
    if (productText.includes('magnesium') || productText.includes('magnesio')) {
      recommendations.push('Tomar por la noche para mejorar la calidad del sueño');
    }
    
    if (productText.includes('vitamin d') || productText.includes('vitamina d')) {
      recommendations.push('Tomar con una comida que contenga grasa para mejorar la absorción');
    }
    
    if (productText.includes('iron') || productText.includes('hierro')) {
      recommendations.push('Tomar con vitamina C para mejorar la absorción');
      recommendations.push('Evitar tomar con café o té');
    }

    // Recomendaciones generales
    recommendations.push('Consultar con un profesional de la salud antes de comenzar');
    recommendations.push('Seguir las instrucciones del fabricante');

    return recommendations;
  }

  /**
   * Genera explicación del análisis
   */
  private generateExplanation(
    product: Supplement, 
    userProfile: UserProfile, 
    compatibilityScore: number
  ): string {
    let explanation = `Análisis de ${product.product_name}: `;
    
    if (compatibilityScore >= 0.8) {
      explanation += 'Excelente compatibilidad con tu perfil. ';
    } else if (compatibilityScore >= 0.6) {
      explanation += 'Buena compatibilidad con tu perfil. ';
    } else if (compatibilityScore >= 0.4) {
      explanation += 'Compatibilidad moderada con tu perfil. ';
    } else {
      explanation += 'Compatibilidad limitada con tu perfil. ';
    }

    const userGoals = userProfile.health_goals || [];
    if (userGoals.length > 0) {
      explanation += `Este producto puede apoyar tus objetivos de ${userGoals.join(', ')}. `;
    }

    explanation += 'Revisa las advertencias y recomendaciones antes de usar.';

    return explanation;
  }

  // Métodos auxiliares
  private hasGoodNutrientProfile(nutriments: any): boolean {
    const keyNutrients = ['proteins_100g', 'vitamin-c_100g', 'magnesium_100g', 'iron_100g'];
    return keyNutrients.some(nutrient => nutriments[nutrient] && nutriments[nutrient] > 0);
  }

  private getBenefitsForGoal(goal: string, productText: string): string[] {
    const benefitsMap: { [key: string]: string[] } = {
      'muscle_gain': ['Aumento de masa muscular', 'Mejora del rendimiento'],
      'weight_loss': ['Apoyo al metabolismo', 'Control del apetito'],
      'energy': ['Aumento de energía', 'Reducción de fatiga'],
      'sleep': ['Mejora del sueño', 'Relajación'],
      'stress': ['Reducción del estrés', 'Bienestar mental']
    };

    return benefitsMap[goal] || [];
  }

  private getIngredientBenefits(productText: string): string[] {
    const benefits: string[] = [];

    if (productText.includes('magnesium')) benefits.push('Relajación muscular');
    if (productText.includes('vitamin d')) benefits.push('Salud ósea e inmunidad');
    if (productText.includes('omega')) benefits.push('Salud cardiovascular');
    if (productText.includes('probiotic')) benefits.push('Salud digestiva');

    return benefits;
  }

  private getConditionWarnings(condition: string, product: Supplement): string[] {
    const warnings: string[] = [];
    const productText = product.ingredients_text?.toLowerCase() || '';

    if (condition === 'diabetes' && productText.includes('sugar')) {
      warnings.push('Contiene azúcar - verificar si es adecuado para diabetes');
    }

    if (condition === 'hypertension' && productText.includes('caffeine')) {
      warnings.push('Contiene cafeína - puede afectar la presión arterial');
    }

    return warnings;
  }
}
