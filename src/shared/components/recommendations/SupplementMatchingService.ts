import { UserProfile } from '@/shared/lib/recommendation/types';
import { supabase } from '@/shared/supabase/client';

export interface SupplementMatch {
  supplementId: string;
  supplementName: string;
  utilityScore: number; // 0-100
  isUseful: boolean;
  reasons: string[];
  warnings: string[];
  timing: string;
  dosage: string;
  interactions: string[];
  category: string;
}

export interface SupplementFeedback {
  supplementId: string;
  supplementName: string;
  isUseful: boolean;
  utilityScore: number;
  personalizedReasons: string[];
  warnings: string[];
  recommendedTiming: string;
  recommendedDosage: string;
  interactions: string[];
  category: string;
  confidence: number;
}

export class SupplementMatchingService {
  private categories: any[] = [];
  private userProfile: UserProfile | null = null;
  private healthAnalysis: any[] = [];

  constructor() {
    this.loadCategories();
  }

  private async loadCategories() {
    try {
      // Cargar categorías desde la base de datos real
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .not('recommended_time', 'is', null);
      
      if (error) {
        console.error('Error cargando categorías:', error);
        // Fallback a datos simulados
        this.categories = [
        {
          id: "1",
          name: "Magnesio Bisglicinato",
          description: "Forma altamente absorbible de magnesio",
          recommended_time: "Noche, 1-2 h antes de acostarse, con o sin comida",
          usage_instructions: "Tomar 1-2 cápsulas por la noche, aproximadamente 1-2 horas antes de acostarse",
          health_goals: ["Mejorar la calidad del sueño", "Reducir el estrés", "Apoyo muscular"],
          considerations: "Evitar con medicamentos para la presión arterial",
          interactions: ["Puede potenciar efectos de sedantes", "Tomar separado de calcio"]
        },
        {
          id: "2", 
          name: "Ashwagandha",
          description: "Planta adaptógena de medicina ayurvédica",
          recommended_time: "Noche, ~30-60 min después de la cena",
          usage_instructions: "Tomar 1 cápsula por la noche, 30-60 minutos después de la cena",
          health_goals: ["Reducir el estrés", "Mejorar el sueño", "Equilibrio hormonal"],
          considerations: "Puede interactuar con medicamentos para tiroides",
          interactions: ["Evitar con sedantes", "Consultar con médico si hay problemas de tiroides"]
        },
        {
          id: "3",
          name: "Vitamina D3",
          description: "Vitamina esencial para la salud ósea e inmunológica",
          recommended_time: "Con comida que contenga grasas (almuerzo o cena)",
          usage_instructions: "Tomar 1 cápsula al día con una comida que contenga grasas",
          health_goals: ["Fortalecer el sistema inmunológico", "Salud ósea", "Mood y energía"],
          considerations: "Monitorear niveles en sangre",
          interactions: ["Mejor absorción con magnesio", "Evitar con anticoagulantes"]
        },
        {
          id: "4",
          name: "Omega-3",
          description: "Ácidos grasos esenciales para la salud cardiovascular",
          recommended_time: "Con comida que contenga grasas",
          usage_instructions: "Tomar 1-2 cápsulas con la comida más completa del día",
          health_goals: ["Salud cardiovascular", "Reducir inflamación", "Función cerebral"],
          considerations: "Puede aumentar riesgo de sangrado",
          interactions: ["Evitar con anticoagulantes", "Tomar con vitamina E"]
        },
        {
          id: "5",
          name: "Zinc",
          description: "Mineral esencial para el sistema inmunológico",
          recommended_time: "Con comida, preferiblemente con el estómago lleno",
          usage_instructions: "Tomar 1 cápsula al día con una comida que contenga proteínas",
          health_goals: ["Reforzar el sistema inmunológico", "Apoyo a la función tiroidea", "Cicatrización"],
          considerations: "Puede interferir con la absorción de cobre",
          interactions: ["Tomar separado de calcio y hierro", "Evitar con antibióticos"]
        },
        {
          id: "6",
          name: "Melatonina",
          description: "Hormona natural que regula el ciclo sueño-vigilia",
          recommended_time: "30-60 min antes de apagar las luces para dormir",
          usage_instructions: "Tomar una dosis baja (0.5-3 mg) 30-60 minutos antes de acostarse",
          health_goals: ["Inducción más rápida del sueño", "Mejor calidad del sueño", "Regulación del ritmo circadiano"],
          considerations: "Puede causar somnolencia matutina",
          interactions: ["Evitar con alcohol", "No conducir después de tomar"]
        },
        {
          id: "7",
          name: "Creatina",
          description: "Compuesto que mejora la fuerza y masa muscular",
          recommended_time: "En cualquier momento, preferiblemente con carbohidratos",
          usage_instructions: "Tomar 3-5g diarios, con agua o jugo",
          health_goals: ["Aumento de la fuerza", "Mejora del rendimiento", "Recuperación muscular"],
          considerations: "Aumenta la retención de agua",
          interactions: ["Tomar con abundante agua", "Evitar con cafeína en exceso"]
        },
        {
          id: "8",
          name: "Probióticos",
          description: "Bacterias beneficiosas para la salud digestiva",
          recommended_time: "Con el primer bocado de comida que contenga grasas",
          usage_instructions: "Tomar 1 cápsula al día con el desayuno",
          health_goals: ["Salud digestiva", "Sistema inmunológico", "Equilibrio de la microbiota"],
          considerations: "Refrigerar para mantener viabilidad",
          interactions: ["Tomar separado de antibióticos", "Mejor con prebióticos"]
        }
      ];
      } else {
        // Usar datos reales de la base de datos
        this.categories = data || [];
        console.log('✅ Categorías cargadas desde la base de datos:', this.categories.length);
      }
    } catch (error) {
      console.error('Error cargando categorías:', error);
    }
  }

  async matchSupplementsWithUserProfile(
    userProfile: UserProfile, 
    healthAnalysis: any[]
  ): Promise<SupplementFeedback[]> {
    this.userProfile = userProfile;
    this.healthAnalysis = healthAnalysis;

    const matches: SupplementFeedback[] = [];

    for (const category of this.categories) {
      const match = await this.analyzeSupplementUtility(category);
      if (match.utilityScore > 30) { // Solo incluir suplementos con utilidad > 30%
        matches.push(match);
      }
    }

    // Ordenar por utilidad descendente
    return matches.sort((a, b) => b.utilityScore - a.utilityScore);
  }

  /**
   * Busca feedback específico para un suplemento por EAN
   */
  async findSupplementFeedbackByEAN(
    userProfile: UserProfile,
    healthAnalysis: any[],
    productEAN: string
  ): Promise<SupplementFeedback | null> {
    this.userProfile = userProfile;
    this.healthAnalysis = healthAnalysis;

    try {
      // Buscar el producto en la base de datos para obtener su categoría
      
      const { data: product, error } = await supabase
        .from('products')
        .select('category_id, product_name')
        .eq('ean', productEAN)
        .single();

      if (error || !product) {
        console.log('Producto no encontrado en la base de datos:', productEAN);
        return null;
      }

      // Buscar la categoría correspondiente
      const category = this.categories.find(cat => cat.id === product.category_id);
      if (!category) {
        console.log('Categoría no encontrada para el producto:', productEAN);
        return null;
      }

      // Analizar la utilidad del suplemento
      const match = await this.analyzeSupplementUtility(category);
      
      // Actualizar el nombre del suplemento con el nombre real del producto
      match.supplementName = product.product_name;
      match.supplementId = productEAN; // Usar EAN como ID

      return match;
    } catch (error) {
      console.error('Error buscando feedback por EAN:', error);
      return null;
    }
  }

  private async analyzeSupplementUtility(category: any): Promise<SupplementFeedback> {
    const age = parseInt(String(this.userProfile?.age)) || 30;
    const gender = this.userProfile?.gender || 'other';
    const stressLevel = this.userProfile?.onboarding_data?.stressLevel || 'low';
    const exerciseType = this.userProfile?.onboarding_data?.exerciseType || 'mixed';
    const sleepQuality = this.userProfile?.onboarding_data?.sleepQuality || 'good';
    const dietType = this.userProfile?.diet_type || 'balanced';
    const conditions = this.userProfile?.health_conditions || [];
    const familyHistory = (this.userProfile?.onboarding_data as any)?.familyHistory || [];
    const sunExposure = this.userProfile?.onboarding_data?.sunExposure || 'medium';

    let utilityScore = 0;
    const reasons: string[] = [];
    const warnings: string[] = [];

    // Análisis específico por suplemento
    switch (category.name) {
      case "Magnesio Bisglicinato":
        utilityScore = this.analyzeMagnesiumUtility(age, gender, stressLevel, sleepQuality, exerciseType, reasons, warnings);
        break;
      
      case "Ashwagandha":
        utilityScore = this.analyzeAshwagandhaUtility(stressLevel, sleepQuality, age, gender, reasons, warnings);
        break;
      
      case "Vitamina D3":
        utilityScore = this.analyzeVitaminDUtility(sunExposure, age, gender, dietType, conditions, reasons, warnings);
        break;
      
      case "Omega-3":
        utilityScore = this.analyzeOmega3Utility(dietType, age, gender, familyHistory, conditions, reasons, warnings);
        break;
      
      case "Zinc":
        utilityScore = this.analyzeZincUtility(age, gender, exerciseType, dietType, conditions, reasons, warnings);
        break;
      
      case "Melatonina":
        utilityScore = this.analyzeMelatoninUtility(sleepQuality, stressLevel, age, exerciseType, reasons, warnings);
        break;
      
      case "Creatina":
        utilityScore = this.analyzeCreatineUtility(exerciseType, age, gender, conditions, reasons, warnings);
        break;
      
      case "Probióticos":
        utilityScore = this.analyzeProbioticsUtility(dietType, age, conditions, reasons, warnings);
        break;
      
      default:
        utilityScore = this.analyzeGenericUtility(category, age, gender, reasons, warnings);
    }

    return {
      supplementId: category.id,
      supplementName: category.name,
      isUseful: utilityScore > 50,
      utilityScore: Math.min(100, Math.max(0, utilityScore)),
      personalizedReasons: reasons,
      warnings: warnings,
      recommendedTiming: category.recommended_time,
      recommendedDosage: category.usage_instructions,
      interactions: category.interactions || [],
      category: category.health_goals?.[0] || 'General',
      confidence: Math.min(1, utilityScore / 100)
    };
  }

  private analyzeMagnesiumUtility(
    age: number, 
    gender: string, 
    stressLevel: string, 
    sleepQuality: string, 
    exerciseType: string,
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Estrés alto = +40 puntos
    if (stressLevel === 'high' || stressLevel === 'very_high') {
      score += 40;
      reasons.push("El magnesio es esencial para combatir el estrés crónico");
    }

    // Problemas de sueño = +30 puntos
    if (sleepQuality === 'poor' || sleepQuality === 'fair') {
      score += 30;
      reasons.push("El magnesio mejora la calidad del sueño y la relajación muscular");
    }

    // Ejercicio intenso = +25 puntos
    if (exerciseType === 'strength' && this.userProfile?.activity_level === 'high') {
      score += 25;
      reasons.push("El magnesio es crucial para la contracción muscular y recuperación");
    }

    // Edad avanzada = +20 puntos
    if (age > 50) {
      score += 20;
      reasons.push("La absorción de magnesio disminuye con la edad");
    }

    // Mujeres = +15 puntos
    if (gender === 'female') {
      score += 15;
      reasons.push("Las mujeres tienen mayor riesgo de deficiencia de magnesio");
    }

    // Advertencias
    if (this.userProfile?.health_conditions?.includes('kidney_disease')) {
      warnings.push("Consultar con médico si tienes problemas renales");
    }

    return score;
  }

  private analyzeAshwagandhaUtility(
    stressLevel: string, 
    sleepQuality: string, 
    age: number, 
    gender: string,
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Estrés muy alto = +50 puntos
    if (stressLevel === 'very_high') {
      score += 50;
      reasons.push("Ashwagandha es un adaptógeno potente para manejar el estrés extremo");
    } else if (stressLevel === 'high') {
      score += 35;
      reasons.push("Ashwagandha ayuda a reducir los niveles de cortisol");
    }

    // Problemas de sueño = +25 puntos
    if (sleepQuality === 'poor') {
      score += 25;
      reasons.push("Ashwagandha mejora la calidad del sueño y reduce la ansiedad");
    }

    // Mujeres en edad reproductiva = +20 puntos
    if (gender === 'female' && age >= 25 && age <= 45) {
      score += 20;
      reasons.push("Ashwagandha ayuda a equilibrar las hormonas femeninas");
    }

    // Advertencias
    if (this.userProfile?.health_conditions?.includes('hypothyroidism')) {
      warnings.push("Puede afectar la función tiroidea - consultar con endocrinólogo");
    }

    return score;
  }

  private analyzeVitaminDUtility(
    sunExposure: string, 
    age: number, 
    gender: string, 
    dietType: string, 
    conditions: string[],
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Exposición solar baja = +40 puntos
    if (sunExposure === 'low') {
      score += 40;
      reasons.push("Exposición solar limitada requiere suplementación de vitamina D");
    }

    // Edad avanzada = +30 puntos
    if (age > 50) {
      score += 30;
      reasons.push("La síntesis de vitamina D disminuye significativamente con la edad");
    }

    // Dieta vegana/vegetariana = +25 puntos
    if (dietType === 'vegan' || dietType === 'vegetarian') {
      score += 25;
      reasons.push("Las dietas veganas/vegetarianas tienen menor ingesta de vitamina D");
    }

    // Condiciones específicas = +35 puntos
    if (conditions.includes('osteoporosis') || conditions.includes('depression')) {
      score += 35;
      reasons.push("La vitamina D es crucial para la salud ósea y el estado de ánimo");
    }

    // Mujeres = +15 puntos
    if (gender === 'female') {
      score += 15;
      reasons.push("Las mujeres tienen mayor riesgo de deficiencia de vitamina D");
    }

    return score;
  }

  private analyzeOmega3Utility(
    dietType: string, 
    age: number, 
    gender: string, 
    familyHistory: string[], 
    conditions: string[],
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Dieta occidental = +30 puntos
    if (dietType === 'western' || dietType === 'processed') {
      score += 30;
      reasons.push("Las dietas occidentales son deficientes en omega-3");
    }

    // Historial familiar de problemas cardiovasculares = +40 puntos
    if (familyHistory.includes('heart_disease') || familyHistory.includes('stroke')) {
      score += 40;
      reasons.push("El omega-3 reduce significativamente el riesgo cardiovascular");
    }

    // Edad avanzada = +25 puntos
    if (age > 40) {
      score += 25;
      reasons.push("El omega-3 es crucial para la salud cardiovascular en adultos");
    }

    // Condiciones inflamatorias = +35 puntos
    if (conditions.includes('arthritis') || conditions.includes('inflammation')) {
      score += 35;
      reasons.push("El omega-3 tiene potentes efectos antiinflamatorios");
    }

    // Advertencias
    if (conditions.includes('bleeding_disorder')) {
      warnings.push("Puede aumentar el riesgo de sangrado - consultar con médico");
    }

    return score;
  }

  private analyzeZincUtility(
    age: number, 
    gender: string, 
    exerciseType: string, 
    dietType: string, 
    conditions: string[],
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Ejercicio intenso = +30 puntos
    if (exerciseType === 'strength' && this.userProfile?.activity_level === 'high') {
      score += 30;
      reasons.push("El zinc es esencial para la síntesis de proteínas y recuperación muscular");
    }

    // Dieta vegetariana/vegana = +35 puntos
    if (dietType === 'vegetarian' || dietType === 'vegan') {
      score += 35;
      reasons.push("Las dietas vegetales tienen menor biodisponibilidad de zinc");
    }

    // Hombres = +20 puntos
    if (gender === 'male') {
      score += 20;
      reasons.push("Los hombres tienen mayores necesidades de zinc");
    }

    // Condiciones inmunológicas = +40 puntos
    if (conditions.includes('frequent_colds') || conditions.includes('immune_issues')) {
      score += 40;
      reasons.push("El zinc es crucial para la función inmunológica");
    }

    return score;
  }

  private analyzeMelatoninUtility(
    sleepQuality: string, 
    stressLevel: string, 
    age: number, 
    exerciseType: string,
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Problemas de sueño = +50 puntos
    if (sleepQuality === 'poor') {
      score += 50;
      reasons.push("La melatonina es ideal para regular el ciclo sueño-vigilia");
    }

    // Estrés alto = +25 puntos
    if (stressLevel === 'high' || stressLevel === 'very_high') {
      score += 25;
      reasons.push("El estrés altera la producción natural de melatonina");
    }

    // Edad avanzada = +30 puntos
    if (age > 50) {
      score += 30;
      reasons.push("La producción de melatonina disminuye con la edad");
    }

    // Advertencias
    if (this.userProfile?.health_conditions?.includes('depression')) {
      warnings.push("Puede interactuar con antidepresivos - consultar con psiquiatra");
    }

    return score;
  }

  private analyzeCreatineUtility(
    exerciseType: string, 
    age: number, 
    gender: string, 
    conditions: string[],
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Ejercicio de fuerza = +50 puntos
    if (exerciseType === 'strength') {
      score += 50;
      reasons.push("La creatina es el suplemento más efectivo para el entrenamiento de fuerza");
    }

    // Ejercicio de alta intensidad = +35 puntos
    if (exerciseType === 'cardio' && this.userProfile?.activity_level === 'high') {
      score += 35;
      reasons.push("La creatina mejora el rendimiento en ejercicios de alta intensidad");
    }

    // Hombres jóvenes = +25 puntos
    if (gender === 'male' && age < 40) {
      score += 25;
      reasons.push("Los hombres responden mejor a la creatina");
    }

    // Advertencias
    if (conditions.includes('kidney_disease')) {
      warnings.push("Consultar con nefrólogo antes de tomar creatina");
    }

    return score;
  }

  private analyzeProbioticsUtility(
    dietType: string, 
    age: number, 
    conditions: string[],
    reasons: string[], 
    warnings: string[]
  ): number {
    let score = 0;

    // Dieta procesada = +30 puntos
    if (dietType === 'processed' || dietType === 'western') {
      score += 30;
      reasons.push("Las dietas procesadas alteran la microbiota intestinal");
    }

    // Uso reciente de antibióticos = +40 puntos
    const antibioticsUse = this.userProfile?.onboarding_data?.antibioticsUse;
    if (antibioticsUse === 'recent' || antibioticsUse === 'multiple') {
      score += 40;
      reasons.push("Los antibióticos destruyen las bacterias beneficiosas del intestino");
    }

    // Problemas digestivos = +45 puntos
    if (conditions.includes('IBS') || conditions.includes('digestive_issues')) {
      score += 45;
      reasons.push("Los probióticos son fundamentales para la salud digestiva");
    }

    // Edad avanzada = +20 puntos
    if (age > 50) {
      score += 20;
      reasons.push("La diversidad de la microbiota disminuye con la edad");
    }

    return score;
  }

  private analyzeGenericUtility(
    category: any, 
    age: number, 
    gender: string,
    reasons: string[], 
    warnings: string[]
  ): number {
    // Análisis genérico basado en objetivos de salud
    let score = 20; // Score base

    if (category.health_goals && Array.isArray(category.health_goals)) {
      // Aumentar score basado en objetivos de salud relevantes
      score += category.health_goals.length * 10;
      reasons.push(`Este suplemento puede apoyar tus objetivos de salud: ${category.health_goals.join(', ')}`);
    }

    return Math.min(100, score);
  }
}
