/**
 * 🔬 SupplementUtilityEvaluator - Evaluador de Utilidad de Suplementos (Frontend)
 * Versión compatible con navegador para evaluar utilidad de suplementos
 */

import { UserProfile } from '@/shared/lib/recommendation/types';

export interface SupplementUtilityResult {
  supplementId: string;
  supplementName: string;
  categoryId: string;
  utilityScore: number; // 0-1
  isUseful: boolean;
  confidence: number; // 0-1
  personalizedReasons: string[];
  warnings: string[];
  recommendedTiming: string;
  recommendedDosage: string;
  interactions: string[];
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  priority: number; // 1-5
}

export interface HealthAnalysis {
  deficiencyRisk: number;
  healthGoals: string[];
  ageGroup: string;
  gender: string;
  activityLevel: string;
  dietType: string;
  healthConditions: string[];
  allergies: string[];
  currentStack: string[];
  biomarkers: { [key: string]: number };
}

export class SupplementUtilityEvaluator {
  private categories: any[] = [];
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  /**
   * Inicializa el evaluador cargando categorías de suplementos
   */
  private async initialize(): Promise<void> {
    try {
      console.log('🔬 Inicializando evaluador de utilidad de suplementos...');
      
      // Cargar categorías desde la base de datos
      await this.loadSupplementCategories();
      
      this.isInitialized = true;
      console.log(`✅ Evaluador inicializado con ${this.categories.length} suplementos`);
    } catch (error) {
      console.error('❌ Error inicializando evaluador:', error);
    }
  }

  /**
   * Carga todas las categorías de suplementos disponibles
   */
  private async loadSupplementCategories(): Promise<void> {
    try {
      const { supabase } = await import('@/shared/supabase/client');
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .not('recommended_time', 'is', null);
      
      if (error) {
        console.error('Error cargando categorías:', error);
        // Fallback a datos hardcodeados
        this.categories = this.getFallbackCategories();
      } else {
        this.categories = data || [];
        console.log(`📊 Cargadas ${this.categories.length} categorías de suplementos`);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
      this.categories = this.getFallbackCategories();
    }
  }

  /**
   * Evalúa la utilidad de TODOS los suplementos disponibles para un usuario
   */
  async evaluateAllSupplements(
    userProfile: UserProfile,
    healthAnalysis: HealthAnalysis
  ): Promise<SupplementUtilityResult[]> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      console.log(`🔬 Evaluando utilidad de ${this.categories.length} suplementos...`);
      
      const results: SupplementUtilityResult[] = [];
      
      // Evaluar cada suplemento disponible
      for (const category of this.categories) {
        try {
          const utilityResult = await this.evaluateSupplementUtility(
            category,
            userProfile,
            healthAnalysis
          );
          
          if (utilityResult) {
            results.push(utilityResult);
          }
        } catch (error) {
          console.warn(`⚠️ Error evaluando suplemento ${category.name}:`, error);
        }
      }

      // Ordenar por utilidad y prioridad
      results.sort((a, b) => {
        const scoreA = a.utilityScore * a.confidence;
        const scoreB = b.utilityScore * b.confidence;
        return scoreB - scoreA;
      });

      console.log(`✅ Evaluación completada: ${results.length} suplementos evaluados`);
      console.log(`📊 Suplementos útiles: ${results.filter(r => r.isUseful).length}`);
      
      return results;
    } catch (error) {
      console.error('❌ Error evaluando suplementos:', error);
      return [];
    }
  }

  /**
   * Evalúa la utilidad de un suplemento específico
   */
  private async evaluateSupplementUtility(
    category: any,
    userProfile: UserProfile,
    healthAnalysis: HealthAnalysis
  ): Promise<SupplementUtilityResult | null> {
    try {
      // Calcular score de utilidad basado en múltiples factores
      const utilityScore = this.calculateUtilityScore(category, userProfile, healthAnalysis);
      
      // Determinar si es útil (threshold > 0.6)
      const isUseful = utilityScore > 0.6;
      
      // Calcular confianza basada en datos disponibles
      const confidence = this.calculateConfidence(userProfile, healthAnalysis);
      
      // Generar razones personalizadas
      const personalizedReasons = await this.generatePersonalizedReasons(
        category, userProfile, healthAnalysis, utilityScore
      );
      
      // Obtener feedback personalizado completo
      const personalizedFeedback = await this.getPersonalizedFeedback(category, userProfile, utilityScore);
      const warnings = personalizedFeedback.warnings;
      const recommendedTiming = personalizedFeedback.recommendedTiming;
      const recommendedDosage = personalizedFeedback.recommendedDosage;
      const interactions = personalizedFeedback.interactions;
      
      // Determinar nivel de riesgo
      const riskLevel = this.determineRiskLevel(category, userProfile, healthAnalysis);
      
      // Calcular prioridad
      const priority = this.calculatePriority(utilityScore, riskLevel, healthAnalysis);

      return {
        supplementId: category.id,
        supplementName: category.name,
        categoryId: category.id,
        utilityScore,
        isUseful,
        confidence,
        personalizedReasons,
        warnings,
        recommendedTiming,
        recommendedDosage,
        interactions,
        category: category.name,
        riskLevel,
        priority
      };
    } catch (error) {
      console.error(`Error evaluando suplemento ${category.name}:`, error);
      return null;
    }
  }

  /**
   * Calcula el score de utilidad de un suplemento
   */
  private calculateUtilityScore(
    category: any,
    userProfile: UserProfile,
    healthAnalysis: HealthAnalysis
  ): number {
    let score = 0.5; // Base score

    // Factor 1: Alineación con objetivos de salud (30%)
    const healthGoalsAlignment = this.calculateHealthGoalsAlignment(category, healthAnalysis.healthGoals);
    score += healthGoalsAlignment * 0.3;

    // Factor 2: Análisis de deficiencias (25%)
    const deficiencyAlignment = this.calculateDeficiencyAlignment(category, healthAnalysis);
    score += deficiencyAlignment * 0.25;

    // Factor 3: Perfil demográfico (20%)
    const demographicAlignment = this.calculateDemographicAlignment(category, userProfile);
    score += demographicAlignment * 0.2;

    // Factor 4: Nivel de actividad (15%)
    const activityAlignment = this.calculateActivityAlignment(category, userProfile.activity_level);
    score += activityAlignment * 0.15;

    // Factor 5: Tipo de dieta (10%)
    const dietAlignment = this.calculateDietAlignment(category, userProfile.diet_type);
    score += dietAlignment * 0.1;

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calcula alineación con objetivos de salud
   */
  private calculateHealthGoalsAlignment(category: any, healthGoals: string[]): number {
    if (!healthGoals || healthGoals.length === 0) return 0.5;

    const categoryGoals = category.health_goals || '';
    let alignment = 0;

    for (const goal of healthGoals) {
      if (categoryGoals.toLowerCase().includes(goal.toLowerCase())) {
        alignment += 0.3;
      }
    }

    return Math.min(alignment, 1);
  }

  /**
   * Calcula alineación con análisis de deficiencias
   */
  private calculateDeficiencyAlignment(category: any, healthAnalysis: HealthAnalysis): number {
    const deficiencyRisk = healthAnalysis.deficiencyRisk;
    
    // Suplementos más útiles para usuarios con mayor riesgo de deficiencias
    if (deficiencyRisk > 0.7) {
      return 0.9; // Alta utilidad para deficiencias
    } else if (deficiencyRisk > 0.4) {
      return 0.7; // Utilidad moderada
    } else {
      return 0.3; // Utilidad baja
    }
  }

  /**
   * Calcula alineación demográfica
   */
  private calculateDemographicAlignment(category: any, userProfile: UserProfile): number {
    const age = userProfile.age || 30;
    const gender = userProfile.gender || 'unknown';
    
    let alignment = 0.5;

    // Ajustar basado en edad
    if (age < 25) {
      alignment += 0.1; // Suplementos para jóvenes
    } else if (age > 50) {
      alignment += 0.2; // Suplementos para adultos mayores
    }

    // Ajustar basado en género
    if (gender === 'female') {
      alignment += 0.1; // Suplementos específicos para mujeres
    }

    return Math.min(alignment, 1);
  }

  /**
   * Calcula alineación con nivel de actividad
   */
  private calculateActivityAlignment(category: any, activityLevel: string): number {
    const categoryName = category.name.toLowerCase();
    
    if (activityLevel === 'high') {
      if (categoryName.includes('protein') || categoryName.includes('creatine') || categoryName.includes('bcaa')) {
        return 0.9;
      }
    } else if (activityLevel === 'low') {
      if (categoryName.includes('vitamin') || categoryName.includes('multivitamin')) {
        return 0.8;
      }
    }

    return 0.5;
  }

  /**
   * Calcula alineación con tipo de dieta
   */
  private calculateDietAlignment(category: any, dietType: string): number {
    const categoryName = category.name.toLowerCase();
    
    if (dietType === 'vegan') {
      if (categoryName.includes('b12') || categoryName.includes('iron') || categoryName.includes('omega')) {
        return 0.9;
      }
    } else if (dietType === 'keto') {
      if (categoryName.includes('electrolyte') || categoryName.includes('magnesium')) {
        return 0.8;
      }
    }

    return 0.5;
  }

  /**
   * Calcula confianza en la evaluación
   */
  private calculateConfidence(userProfile: UserProfile, healthAnalysis: HealthAnalysis): number {
    let confidence = 0.5;

    // Más datos = mayor confianza
    if (userProfile.age) confidence += 0.1;
    if (userProfile.gender) confidence += 0.1;
    if (userProfile.activity_level) confidence += 0.1;
    if (userProfile.diet_type) confidence += 0.1;
    if (healthAnalysis.healthGoals.length > 0) confidence += 0.1;
    if (healthAnalysis.biomarkers && Object.keys(healthAnalysis.biomarkers).length > 0) confidence += 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * Genera razones personalizadas usando el sistema avanzado de AdvisoryService
   */
  private async generatePersonalizedReasons(
    category: any,
    userProfile: UserProfile,
    healthAnalysis: HealthAnalysis,
    utilityScore: number
  ): Promise<string[]> {
    try {
      // Importar AdvisoryService para usar el sistema de feedback personalizado
      const { AdvisoryService } = await import('./AdvisoryService');
      const advisoryService = AdvisoryService.getInstance();
      
      // Generar feedback personalizado detallado
      const personalizedFeedback = await advisoryService.generatePersonalizedSupplementFeedback(
        userProfile,
        category.name,
        utilityScore
      );
      
      return personalizedFeedback.personalizedReasons;
    } catch (error) {
      console.warn('Error generando razones personalizadas, usando fallback:', error);
      
      // Fallback a razones básicas
      const reasons: string[] = [];

      if (utilityScore > 0.8) {
        reasons.push('Alta compatibilidad con tu perfil de salud');
        reasons.push('Recomendado para tus objetivos específicos');
      } else if (utilityScore > 0.6) {
        reasons.push('Buena compatibilidad con tu perfil');
        reasons.push('Puede ser beneficioso para tu salud');
      } else if (utilityScore > 0.4) {
        reasons.push('Compatibilidad moderada');
        reasons.push('Considera consultar con un profesional');
      } else {
        reasons.push('Compatibilidad limitada con tu perfil actual');
      }

      // Razones específicas basadas en datos
      if (healthAnalysis.deficiencyRisk > 0.7) {
        reasons.push('Puede ayudar a corregir deficiencias detectadas');
      }

      if (userProfile.activity_level === 'high') {
        reasons.push('Adecuado para tu nivel de actividad física');
      }

      return reasons;
    }
  }

  /**
   * Obtiene feedback personalizado completo del AdvisoryService
   */
  private async getPersonalizedFeedback(
    category: any,
    userProfile: UserProfile,
    utilityScore: number
  ): Promise<{
    recommendedTiming: string;
    recommendedDosage: string;
    warnings: string[];
    interactions: string[];
  }> {
    try {
      // Importar AdvisoryService para usar el sistema de feedback personalizado
      const { AdvisoryService } = await import('./AdvisoryService');
      const advisoryService = AdvisoryService.getInstance();
      
      // Generar feedback personalizado detallado
      const personalizedFeedback = await advisoryService.generatePersonalizedSupplementFeedback(
        userProfile,
        category.name,
        utilityScore
      );
      
      return {
        recommendedTiming: personalizedFeedback.recommendedTiming,
        recommendedDosage: personalizedFeedback.recommendedDosage,
        warnings: personalizedFeedback.warnings,
        interactions: personalizedFeedback.interactions
      };
    } catch (error) {
      console.warn('Error obteniendo feedback personalizado, usando fallback:', error);
      
      // Fallback a métodos básicos
      return {
        recommendedTiming: this.determineRecommendedTiming(category, userProfile),
        recommendedDosage: this.determineRecommendedDosage(category, userProfile),
        warnings: this.generateWarnings(category, userProfile, { deficiencyRisk: 0.5, healthGoals: [], ageGroup: '', gender: '', activityLevel: '', dietType: '', healthConditions: [], allergies: [], currentStack: [], biomarkers: {} }),
        interactions: this.identifyInteractions(category, userProfile)
      };
    }
  }

  /**
   * Genera advertencias
   */
  private generateWarnings(category: any, userProfile: UserProfile, healthAnalysis: HealthAnalysis): string[] {
    const warnings: string[] = [];

    // Advertencias basadas en condiciones de salud
    if (userProfile.health_conditions && userProfile.health_conditions.length > 0) {
      warnings.push('Consulta con tu médico antes de usar este suplemento');
    }

    // Advertencias basadas en alergias
    if (userProfile.allergies && userProfile.allergies.length > 0) {
      warnings.push('Verifica los ingredientes para evitar alergias');
    }

    // Advertencias generales
    warnings.push('No excedas la dosis recomendada');
    warnings.push('Mantén una dieta equilibrada junto con el suplemento');

    return warnings;
  }

  /**
   * Determina el timing recomendado
   */
  private determineRecommendedTiming(category: any, userProfile: UserProfile): string {
    const categoryName = category.name.toLowerCase();
    
    if (categoryName.includes('melatonin') || categoryName.includes('sleep')) {
      return 'Antes de dormir';
    } else if (categoryName.includes('protein') || categoryName.includes('creatine')) {
      return 'Post-entrenamiento';
    } else if (categoryName.includes('vitamin') || categoryName.includes('multivitamin')) {
      return 'Con el desayuno';
    } else {
      return 'Según indicaciones del producto';
    }
  }

  /**
   * Determina la dosificación recomendada
   */
  private determineRecommendedDosage(category: any, userProfile: UserProfile): string {
    const categoryName = category.name.toLowerCase();
    
    if (categoryName.includes('vitamin d')) {
      return '1000-2000 IU diario';
    } else if (categoryName.includes('magnesium')) {
      return '200-400mg diario';
    } else if (categoryName.includes('protein')) {
      return '20-30g por porción';
    } else {
      return 'Según indicaciones del producto';
    }
  }

  /**
   * Identifica interacciones
   */
  private identifyInteractions(category: any, userProfile: UserProfile): string[] {
    const interactions: string[] = [];

    // Interacciones comunes
    if (category.name.toLowerCase().includes('iron')) {
      interactions.push('Evitar con calcio y café');
    }

    if (category.name.toLowerCase().includes('calcium')) {
      interactions.push('Evitar con hierro');
    }

    return interactions;
  }

  /**
   * Determina el nivel de riesgo
   */
  private determineRiskLevel(category: any, userProfile: UserProfile, healthAnalysis: HealthAnalysis): 'low' | 'medium' | 'high' {
    let riskFactors = 0;

    // Factores de riesgo
    if (userProfile.health_conditions && userProfile.health_conditions.length > 0) riskFactors++;
    if (userProfile.allergies && userProfile.allergies.length > 0) riskFactors++;
    if (healthAnalysis.deficiencyRisk > 0.8) riskFactors++;

    if (riskFactors >= 2) return 'high';
    if (riskFactors === 1) return 'medium';
    return 'low';
  }

  /**
   * Calcula la prioridad
   */
  private calculatePriority(utilityScore: number, riskLevel: string, healthAnalysis: HealthAnalysis): number {
    let priority = 3; // Base priority

    if (utilityScore > 0.8) priority = 5;
    else if (utilityScore > 0.6) priority = 4;
    else if (utilityScore > 0.4) priority = 3;
    else priority = 2;

    // Ajustar por riesgo
    if (riskLevel === 'high') priority = Math.max(priority - 1, 1);
    if (riskLevel === 'low') priority = Math.min(priority + 1, 5);

    return priority;
  }

  /**
   * Obtiene categorías de fallback
   */
  private getFallbackCategories(): any[] {
    return [
      { id: '1', name: 'Multivitaminas', health_goals: 'salud general', recommended_time: 'morning' },
      { id: '2', name: 'Vitamina D3', health_goals: 'huesos, inmunidad', recommended_time: 'morning' },
      { id: '3', name: 'Magnesio', health_goals: 'relajación, músculos', recommended_time: 'night' },
      { id: '4', name: 'Omega-3', health_goals: 'corazón, cerebro', recommended_time: 'morning' },
      { id: '5', name: 'Proteína Whey', health_goals: 'músculos, recuperación', recommended_time: 'post-workout' }
    ];
  }

  /**
   * Obtiene estadísticas de evaluación
   */
  getEvaluationStats(results: SupplementUtilityResult[]): any {
    const total = results.length;
    const useful = results.filter(r => r.isUseful).length;
    const highUtility = results.filter(r => r.utilityScore > 0.8).length;
    const averageScore = results.reduce((sum, r) => sum + r.utilityScore, 0) / total;

    return {
      totalSupplements: total,
      usefulSupplements: useful,
      highUtilitySupplements: highUtility,
      averageUtilityScore: averageScore,
      utilityRate: (useful / total) * 100
    };
  }
}
