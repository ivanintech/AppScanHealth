import { UserProfile, Supplement, Recommendation, RecommendationReason } from '../types';
import { supabase } from '@/shared/supabase/client';

/**
 * Filtro basado en contenido para recomendaciones de suplementos
 * Analiza las características de los suplementos y las necesidades del usuario
 */
export class ContentBasedFilter {
  private readonly categoryMappings = {
    // Objetivos de salud -> categorías de suplementos
    'muscle_gain': ['protein', 'creatine', 'bcaa', 'beta_alanine'],
    'weight_loss': ['greens_powder', 'omega3', 'fiber', 'thermogenics'],
    'energy': ['b_complex', 'iron', 'coq10', 'rhodiola'],
    'sleep': ['magnesium', 'melatonin', 'l_theanine', 'valerian'],
    'stress': ['ashwagandha', 'rhodiola', 'l_theanine', 'magnesium'],
    'immunity': ['vitamin_c', 'vitamin_d', 'zinc', 'elderberry'],
    'heart_health': ['omega3', 'coq10', 'magnesium', 'garlic'],
    'bone_health': ['calcium', 'vitamin_d', 'magnesium', 'vitamin_k'],
    'digestive_health': ['probiotics', 'fiber', 'digestive_enzymes', 'ginger'],
    'cognitive_health': ['omega3', 'b_complex', 'ginkgo', 'l_theanine']
  };

  private readonly lifestyleMappings = {
    // Estilo de vida -> suplementos recomendados
    'athlete': ['protein', 'creatine', 'beta_alanine', 'magnesium'],
    'sedentary': ['multivitamin', 'omega3', 'vitamin_d', 'fiber'],
    'stressful_lifestyle': ['ashwagandha', 'magnesium', 'b_complex', 'l_theanine'],
    'poor_sleep': ['magnesium', 'melatonin', 'l_theanine', 'valerian'],
    'vegetarian': ['b12', 'iron', 'omega3', 'vitamin_d'],
    'vegan': ['b12', 'iron', 'omega3', 'vitamin_d', 'calcium'],
    'high_caffeine': ['magnesium', 'b_complex', 'l_theanine', 'rhodiola']
  };

  /**
   * Genera recomendaciones basadas en el contenido y perfil del usuario
   */
  async getContentBasedRecommendations(
    userProfile: UserProfile,
    limit: number = 20
  ): Promise<Recommendation[]> {
    try {
      // Obtener suplementos de la base de datos
      const { data: supplements, error } = await supabase
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
          image_url
        `)
        .not('calculated_score', 'is', null)
        .order('calculated_score', { ascending: false })
        .limit(1000); // Obtener más para filtrar después

      if (error) {
        console.error('Error fetching supplements:', error);
        return [];
      }

      if (!supplements || supplements.length === 0) {
        return [];
      }

      // Calcular puntuación para cada suplemento
      const scoredSupplements = supplements.map(supplement => {
        const score = this.calculateContentScore(supplement, userProfile);
        const reasons = this.generateReasons(supplement, userProfile);
        
        return {
          supplement_ean: supplement.ean,
          supplement_name: supplement.product_name,
          category: this.getCategoryName(supplement),
          score,
          confidence: this.calculateConfidence(supplement, userProfile),
          reasons,
          benefits: this.extractBenefits(supplement, userProfile),
          dosage_recommendation: this.getDosageRecommendation(supplement),
          timing_recommendation: this.getTimingRecommendation(supplement),
          interactions_warnings: this.getInteractionWarnings(supplement, userProfile),
          contraindications: this.getContraindications(supplement, userProfile)
        };
      });

      // Filtrar y ordenar por puntuación
      return scoredSupplements
        .filter(rec => rec.score > 0.3) // Solo recomendaciones con score > 30%
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      console.error('Error in getContentBasedRecommendations:', error);
      return [];
    }
  }

  /**
   * Calcula la puntuación de contenido para un suplemento
   */
  private calculateContentScore(supplement: any, userProfile: UserProfile): number {
    let score = 0;
    let factors = 0;

    // 1. Alineación con objetivos de salud (40% del score)
    const goalScore = this.calculateGoalAlignment(supplement, userProfile);
    score += goalScore * 0.4;
    factors++;

    // 2. Alineación con estilo de vida (25% del score)
    const lifestyleScore = this.calculateLifestyleAlignment(supplement, userProfile);
    score += lifestyleScore * 0.25;
    factors++;

    // 3. Calidad del producto (20% del score)
    const qualityScore = this.calculateQualityScore(supplement);
    score += qualityScore * 0.2;
    factors++;

    // 4. Seguridad y contraindicaciones (15% del score)
    const safetyScore = this.calculateSafetyScore(supplement, userProfile);
    score += safetyScore * 0.15;
    factors++;

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Calcula alineación con objetivos de salud
   */
  private calculateGoalAlignment(supplement: any, userProfile: UserProfile): number {
    const userGoals = userProfile.health_goals || [];
    if (userGoals.length === 0) return 0.5; // Score neutral si no hay objetivos

    let alignmentScore = 0;
    let matchedGoals = 0;

    userGoals.forEach(goal => {
      const relevantCategories = this.categoryMappings[goal as keyof typeof this.categoryMappings] || [];
      const supplementCategories = supplement.categories_tags || [];
      
      // Verificar si el suplemento está en categorías relevantes
      const hasRelevantCategory = relevantCategories.some(cat => 
        supplementCategories.some(suppCat => 
          suppCat.toLowerCase().includes(cat.toLowerCase())
        )
      );

      if (hasRelevantCategory) {
        alignmentScore += 1;
        matchedGoals++;
      }
    });

    return matchedGoals > 0 ? alignmentScore / userGoals.length : 0;
  }

  /**
   * Calcula alineación con estilo de vida
   */
  private calculateLifestyleAlignment(supplement: any, userProfile: UserProfile): number {
    let score = 0;
    let factors = 0;

    // Análisis basado en nivel de actividad
    if (userProfile.activity_level === 'high') {
      const athleticCategories = ['protein', 'creatine', 'bcaa', 'pre_workout'];
      const hasAthleticCategory = athleticCategories.some(cat => 
        supplement.categories_tags?.some(tag => tag.toLowerCase().includes(cat))
      );
      if (hasAthleticCategory) {
        score += 1;
        factors++;
      }
    }

    // Análisis basado en tipo de dieta
    if (userProfile.diet_type) {
      const dietSupplements = this.lifestyleMappings[userProfile.diet_type as keyof typeof this.lifestyleMappings] || [];
      const hasDietRelevant = dietSupplements.some(supp => 
        supplement.ingredients_text?.toLowerCase().includes(supp) ||
        supplement.categories_tags?.some(tag => tag.toLowerCase().includes(supp))
      );
      if (hasDietRelevant) {
        score += 1;
        factors++;
      }
    }

    // Análisis basado en datos de onboarding
    if (userProfile.onboarding_data) {
      const data = userProfile.onboarding_data;
      
      // Si tiene problemas de sueño, priorizar suplementos para el sueño
      if (data.sleepQuality === 'poor' || data.sleepQuality === 'very_poor') {
        const sleepSupplements = ['magnesium', 'melatonin', 'l_theanine', 'valerian'];
        const hasSleepSupport = sleepSupplements.some(supp => 
          supplement.ingredients_text?.toLowerCase().includes(supp)
        );
        if (hasSleepSupport) {
          score += 1;
          factors++;
        }
      }

      // Si tiene alto estrés, priorizar adaptógenos
      if (data.stressLevel === 'high' || data.stressLevel === 'very_high') {
        const stressSupplements = ['ashwagandha', 'rhodiola', 'l_theanine'];
        const hasStressSupport = stressSupplements.some(supp => 
          supplement.ingredients_text?.toLowerCase().includes(supp)
        );
        if (hasStressSupport) {
          score += 1;
          factors++;
        }
      }
    }

    return factors > 0 ? score / factors : 0.5;
  }

  /**
   * Calcula puntuación de calidad del producto
   */
  private calculateQualityScore(supplement: any): number {
    let score = 0;
    let factors = 0;

    // Score calculado de la base de datos (si existe)
    if (supplement.calculated_score) {
      score += supplement.calculated_score / 100; // Normalizar a 0-1
      factors++;
    }

    // Análisis de ingredientes
    const ingredients = supplement.ingredients_text || '';
    const hasNaturalIngredients = this.hasNaturalIngredients(ingredients);
    if (hasNaturalIngredients) {
      score += 0.2;
      factors++;
    }

    // Análisis de nutrientes
    const nutriments = supplement.nutriments || {};
    const hasGoodNutrientProfile = this.hasGoodNutrientProfile(nutriments);
    if (hasGoodNutrientProfile) {
      score += 0.2;
      factors++;
    }

    return factors > 0 ? Math.min(score / factors, 1) : 0.5;
  }

  /**
   * Calcula puntuación de seguridad
   */
  private calculateSafetyScore(supplement: any, userProfile: UserProfile): number {
    let score = 1; // Empezar con score máximo
    let factors = 1;

    // Verificar contraindicaciones
    const contraindications = this.getContraindications(supplement, userProfile);
    if (contraindications.length > 0) {
      score -= contraindications.length * 0.3; // Penalizar por contraindicaciones
    }

    // Verificar alergias
    const allergies = userProfile.allergies || [];
    const hasAllergen = allergies.some(allergy => 
      supplement.ingredients_text?.toLowerCase().includes(allergy.toLowerCase())
    );
    if (hasAllergen) {
      score -= 0.5; // Penalizar significativamente por alergias
    }

    return Math.max(0, Math.min(score, 1));
  }

  /**
   * Genera razones para la recomendación
   */
  private generateReasons(supplement: any, userProfile: UserProfile): RecommendationReason[] {
    const reasons: RecommendationReason[] = [];

    // Razón por objetivos de salud
    const goalAlignment = this.calculateGoalAlignment(supplement, userProfile);
    if (goalAlignment > 0.5) {
      reasons.push({
        type: 'goal_alignment',
        description: 'Alineado con tus objetivos de salud',
        weight: goalAlignment,
        evidence: `Score de alineación: ${Math.round(goalAlignment * 100)}%`
      });
    }

    // Razón por estilo de vida
    const lifestyleAlignment = this.calculateLifestyleAlignment(supplement, userProfile);
    if (lifestyleAlignment > 0.5) {
      reasons.push({
        type: 'lifestyle',
        description: 'Adecuado para tu estilo de vida',
        weight: lifestyleAlignment,
        evidence: `Score de estilo de vida: ${Math.round(lifestyleAlignment * 100)}%`
      });
    }

    // Razón por calidad
    const qualityScore = this.calculateQualityScore(supplement);
    if (qualityScore > 0.7) {
      reasons.push({
        type: 'content_match',
        description: 'Producto de alta calidad',
        weight: qualityScore,
        evidence: `Score de calidad: ${Math.round(qualityScore * 100)}%`
      });
    }

    return reasons;
  }

  /**
   * Extrae beneficios específicos para el usuario
   */
  private extractBenefits(supplement: any, userProfile: UserProfile): string[] {
    const benefits: string[] = [];
    const userGoals = userProfile.health_goals || [];

    // Beneficios basados en objetivos
    userGoals.forEach(goal => {
      const goalBenefits = this.getBenefitsForGoal(goal, supplement);
      benefits.push(...goalBenefits);
    });

    // Beneficios basados en ingredientes
    const ingredientBenefits = this.getIngredientBenefits(supplement);
    benefits.push(...ingredientBenefits);

    return [...new Set(benefits)]; // Eliminar duplicados
  }

  // Métodos auxiliares
  private hasNaturalIngredients(ingredients: string): boolean {
    const naturalKeywords = ['extract', 'powder', 'natural', 'organic'];
    return naturalKeywords.some(keyword => 
      ingredients.toLowerCase().includes(keyword)
    );
  }

  private hasGoodNutrientProfile(nutriments: any): boolean {
    // Verificar si tiene nutrientes clave
    const keyNutrients = ['proteins_100g', 'vitamin-c_100g', 'magnesium_100g'];
    return keyNutrients.some(nutrient => nutriments[nutrient] && nutriments[nutrient] > 0);
  }

  private getCategoryName(supplement: any): string {
    return supplement.categories_tags?.[0] || 'Suplemento';
  }

  private calculateConfidence(supplement: any, userProfile: UserProfile): number {
    const goalAlignment = this.calculateGoalAlignment(supplement, userProfile);
    const lifestyleAlignment = this.calculateLifestyleAlignment(supplement, userProfile);
    const qualityScore = this.calculateQualityScore(supplement);
    
    return (goalAlignment + lifestyleAlignment + qualityScore) / 3;
  }

  private getDosageRecommendation(supplement: any): string {
    // Lógica para determinar dosis recomendada basada en el tipo de suplemento
    return 'Seguir las instrucciones del fabricante';
  }

  private getTimingRecommendation(supplement: any): string {
    // Lógica para determinar momento óptimo de toma
    return 'Consultar con profesional de la salud';
  }

  private getInteractionWarnings(supplement: any, userProfile: UserProfile): string[] {
    // Lógica para detectar interacciones con medicamentos o suplementos actuales
    return [];
  }

  private getContraindications(supplement: any, userProfile: UserProfile): string[] {
    const contraindications: string[] = [];
    
    // Verificar alergias
    const allergies = userProfile.allergies || [];
    allergies.forEach(allergy => {
      if (supplement.ingredients_text?.toLowerCase().includes(allergy.toLowerCase())) {
        contraindications.push(`Contiene ${allergy}`);
      }
    });

    return contraindications;
  }

  private getBenefitsForGoal(goal: string, supplement: any): string[] {
    const benefitsMap: { [key: string]: string[] } = {
      'muscle_gain': ['Aumento de masa muscular', 'Mejora del rendimiento'],
      'weight_loss': ['Apoyo al metabolismo', 'Control del apetito'],
      'energy': ['Aumento de energía', 'Reducción de fatiga'],
      'sleep': ['Mejora del sueño', 'Relajación'],
      'stress': ['Reducción del estrés', 'Bienestar mental']
    };

    return benefitsMap[goal] || [];
  }

  private getIngredientBenefits(supplement: any): string[] {
    const benefits: string[] = [];
    const ingredients = supplement.ingredients_text?.toLowerCase() || '';

    if (ingredients.includes('magnesium')) benefits.push('Relajación muscular');
    if (ingredients.includes('vitamin d')) benefits.push('Salud ósea e inmunidad');
    if (ingredients.includes('omega')) benefits.push('Salud cardiovascular');
    if (ingredients.includes('probiotic')) benefits.push('Salud digestiva');

    return benefits;
  }
}
