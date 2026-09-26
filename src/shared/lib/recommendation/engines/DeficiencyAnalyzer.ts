import { UserProfile, CheckupResults, Deficiency } from '../types';

/**
 * Analizador de carencias nutricionales basado en checkup_results
 * Identifica deficiencias y recomienda suplementos específicos
 */
export class DeficiencyAnalyzer {
  private readonly deficiencyThresholds = {
    vitamin_d: { min: 30, optimal: 50, critical: 20 },
    b12: { min: 200, optimal: 400, critical: 150 },
    iron: { min: 60, optimal: 120, critical: 30 },
    ferritin: { min: 15, optimal: 50, critical: 10 },
    magnesium: { min: 1.8, optimal: 2.2, critical: 1.5 },
    zinc: { min: 70, optimal: 100, critical: 50 },
    calcium: { min: 8.5, optimal: 10.5, critical: 8.0 }
  };

  private readonly supplementMappings = {
    vitamin_d: ['vitamin_d3', 'vitamin_d3_k2', 'multivitamin'],
    b12: ['b12', 'b_complex', 'methylcobalamin'],
    iron: ['iron', 'ferrous_sulfate', 'iron_bisglycinate'],
    ferritin: ['iron', 'vitamin_c', 'b12'], // B12 ayuda con absorción de hierro
    magnesium: ['magnesium', 'magnesium_glycinate', 'magnesium_citrate'],
    zinc: ['zinc', 'zinc_picolinate', 'zinc_gluconate'],
    calcium: ['calcium', 'calcium_citrate', 'calcium_carbonate']
  };

  /**
   * Analiza las carencias del usuario basándose en sus resultados de checkup
   */
  async analyzeDeficiencies(userProfile: UserProfile): Promise<Deficiency[]> {
    const deficiencies: Deficiency[] = [];
    const checkup = userProfile.checkup_results;

    if (!checkup) {
      return this.getLifestyleBasedDeficiencies(userProfile);
    }

    // Análisis de vitamina D
    if (checkup.vitamin_d !== undefined) {
      const deficiency = this.analyzeVitaminD(checkup.vitamin_d, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de B12
    if (checkup.b12 !== undefined) {
      const deficiency = this.analyzeB12(checkup.b12, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de hierro/ferritina
    if (checkup.iron !== undefined || checkup.ferritin !== undefined) {
      const deficiency = this.analyzeIron(checkup.iron, checkup.ferritin, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de magnesio
    if (checkup.magnesium !== undefined) {
      const deficiency = this.analyzeMagnesium(checkup.magnesium, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de zinc
    if (checkup.zinc !== undefined) {
      const deficiency = this.analyzeZinc(checkup.zinc, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de calcio
    if (checkup.calcium !== undefined) {
      const deficiency = this.analyzeCalcium(checkup.calcium, userProfile);
      if (deficiency) deficiencies.push(deficiency);
    }

    // Análisis de patrones de sueño y estrés
    if (checkup.sleep_quality !== undefined || checkup.stress_level !== undefined) {
      const sleepDeficiencies = this.analyzeSleepStress(checkup, userProfile);
      deficiencies.push(...sleepDeficiencies);
    }

    return deficiencies.sort((a, b) => b.priority - a.priority);
  }

  private analyzeVitaminD(level: number, userProfile: UserProfile): Deficiency | null {
    const thresholds = this.deficiencyThresholds.vitamin_d;
    
    if (level >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (level < thresholds.critical) {
      severity = 'critical';
      priority = 5;
    } else if (level < thresholds.min) {
      severity = 'high';
      priority = 4;
    } else {
      severity = 'medium';
      priority = 3;
    }

    return {
      type: 'vitamin_d_deficiency',
      severity,
      current_value: level,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getVitaminDSymptoms(level),
      recommended_supplements: this.supplementMappings.vitamin_d,
      explanation: this.getVitaminDExplanation(level, userProfile),
      priority
    };
  }

  private analyzeB12(level: number, userProfile: UserProfile): Deficiency | null {
    const thresholds = this.deficiencyThresholds.b12;
    
    if (level >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (level < thresholds.critical) {
      severity = 'critical';
      priority = 5;
    } else if (level < thresholds.min) {
      severity = 'high';
      priority = 4;
    } else {
      severity = 'medium';
      priority = 3;
    }

    return {
      type: 'b12_deficiency',
      severity,
      current_value: level,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getB12Symptoms(level),
      recommended_supplements: this.supplementMappings.b12,
      explanation: this.getB12Explanation(level, userProfile),
      priority
    };
  }

  private analyzeIron(iron?: number, ferritin?: number, userProfile?: UserProfile): Deficiency | null {
    // Priorizar ferritina sobre hierro sérico
    const value = ferritin || iron;
    if (!value) return null;

    const thresholds = ferritin ? this.deficiencyThresholds.ferritin : this.deficiencyThresholds.iron;
    
    if (value >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (value < thresholds.critical) {
      severity = 'critical';
      priority = 5;
    } else if (value < thresholds.min) {
      severity = 'high';
      priority = 4;
    } else {
      severity = 'medium';
      priority = 3;
    }

    return {
      type: ferritin ? 'ferritin_deficiency' : 'iron_deficiency',
      severity,
      current_value: value,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getIronSymptoms(value),
      recommended_supplements: this.supplementMappings.ferritin,
      explanation: this.getIronExplanation(value, userProfile),
      priority
    };
  }

  private analyzeMagnesium(level: number, userProfile: UserProfile): Deficiency | null {
    const thresholds = this.deficiencyThresholds.magnesium;
    
    if (level >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (level < thresholds.critical) {
      severity = 'critical';
      priority = 4;
    } else if (level < thresholds.min) {
      severity = 'high';
      priority = 3;
    } else {
      severity = 'medium';
      priority = 2;
    }

    return {
      type: 'magnesium_deficiency',
      severity,
      current_value: level,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getMagnesiumSymptoms(level),
      recommended_supplements: this.supplementMappings.magnesium,
      explanation: this.getMagnesiumExplanation(level, userProfile),
      priority
    };
  }

  private analyzeZinc(level: number, userProfile: UserProfile): Deficiency | null {
    const thresholds = this.deficiencyThresholds.zinc;
    
    if (level >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (level < thresholds.critical) {
      severity = 'critical';
      priority = 4;
    } else if (level < thresholds.min) {
      severity = 'high';
      priority = 3;
    } else {
      severity = 'medium';
      priority = 2;
    }

    return {
      type: 'zinc_deficiency',
      severity,
      current_value: level,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getZincSymptoms(level),
      recommended_supplements: this.supplementMappings.zinc,
      explanation: this.getZincExplanation(level, userProfile),
      priority
    };
  }

  private analyzeCalcium(level: number, userProfile: UserProfile): Deficiency | null {
    const thresholds = this.deficiencyThresholds.calcium;
    
    if (level >= thresholds.optimal) return null;

    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let priority = 1;

    if (level < thresholds.critical) {
      severity = 'critical';
      priority = 4;
    } else if (level < thresholds.min) {
      severity = 'high';
      priority = 3;
    } else {
      severity = 'medium';
      priority = 2;
    }

    return {
      type: 'calcium_deficiency',
      severity,
      current_value: level,
      normal_range: { min: thresholds.min, max: thresholds.optimal },
      symptoms: this.getCalciumSymptoms(level),
      recommended_supplements: this.supplementMappings.calcium,
      explanation: this.getCalciumExplanation(level, userProfile),
      priority
    };
  }

  private analyzeSleepStress(checkup: CheckupResults, userProfile: UserProfile): Deficiency[] {
    const deficiencies: Deficiency[] = [];

    // Análisis de calidad del sueño
    if (checkup.sleep_quality !== undefined && checkup.sleep_quality < 6) {
      deficiencies.push({
        type: 'sleep_support',
        severity: checkup.sleep_quality < 4 ? 'high' : 'medium',
        normal_range: { min: 6, max: 10 },
        symptoms: ['dificultad para dormir', 'sueño no reparador', 'fatiga matutina'],
        recommended_supplements: ['magnesium', 'melatonin', 'l_theanine', 'valerian'],
        explanation: 'La calidad del sueño puede mejorarse con suplementos que apoyen la relajación y el descanso',
        priority: checkup.sleep_quality < 4 ? 4 : 2
      });
    }

    // Análisis de estrés
    if (checkup.stress_level !== undefined && checkup.stress_level > 6) {
      deficiencies.push({
        type: 'stress_support',
        severity: checkup.stress_level > 8 ? 'high' : 'medium',
        normal_range: { min: 1, max: 6 },
        symptoms: ['ansiedad', 'tensión', 'dificultad para relajarse'],
        recommended_supplements: ['ashwagandha', 'rhodiola', 'l_theanine', 'magnesium'],
        explanation: 'El estrés elevado puede beneficiarse de adaptógenos y nutrientes que apoyen el sistema nervioso',
        priority: checkup.stress_level > 8 ? 4 : 2
      });
    }

    return deficiencies;
  }

  private getLifestyleBasedDeficiencies(userProfile: UserProfile): Deficiency[] {
    const deficiencies: Deficiency[] = [];

    // Análisis basado en dieta
    if (userProfile.onboarding_data) {
      const data = userProfile.onboarding_data;

      // Vitamina D si poca exposición solar
      if (data.sunExposure === 'low' || data.sunExposure === 'very_low') {
        deficiencies.push({
          type: 'vitamin_d_support',
          severity: 'medium',
          normal_range: { min: 30, max: 50 },
          symptoms: ['posible deficiencia de vitamina D'],
          recommended_supplements: ['vitamin_d3'],
          explanation: 'La baja exposición solar puede resultar en deficiencia de vitamina D',
          priority: 3
        });
      }

      // Omega-3 si poco consumo de pescado
      if (data.fishConsumption < 2) {
        deficiencies.push({
          type: 'omega3_support',
          severity: 'medium',
          normal_range: { min: 2, max: 4 },
          symptoms: ['inflamación', 'salud cardiovascular'],
          recommended_supplements: ['omega3', 'fish_oil'],
          explanation: 'El bajo consumo de pescado puede resultar en deficiencia de omega-3',
          priority: 2
        });
      }

      // Hierro si dieta vegetariana/vegana
      if (userProfile.diet_type === 'vegetarian' || userProfile.diet_type === 'vegan') {
        deficiencies.push({
          type: 'iron_support',
          severity: 'medium',
          normal_range: { min: 60, max: 120 },
          symptoms: ['fatiga', 'debilidad'],
          recommended_supplements: ['iron', 'vitamin_c'],
          explanation: 'Las dietas vegetarianas/veganas pueden requerir suplementación de hierro',
          priority: 3
        });
      }
    }

    return deficiencies;
  }

  // Métodos auxiliares para síntomas y explicaciones
  private getVitaminDSymptoms(level: number): string[] {
    if (level < 20) return ['fatiga extrema', 'dolor óseo', 'debilidad muscular', 'depresión'];
    if (level < 30) return ['fatiga', 'debilidad', 'dolor óseo'];
    return ['posible deficiencia leve'];
  }

  private getB12Symptoms(level: number): string[] {
    if (level < 150) return ['anemia', 'fatiga extrema', 'problemas neurológicos', 'depresión'];
    if (level < 200) return ['fatiga', 'debilidad', 'problemas de memoria'];
    return ['posible deficiencia leve'];
  }

  private getIronSymptoms(level: number): string[] {
    if (level < 30) return ['anemia severa', 'fatiga extrema', 'palidez', 'debilidad'];
    if (level < 60) return ['fatiga', 'debilidad', 'palidez'];
    return ['posible deficiencia leve'];
  }

  private getMagnesiumSymptoms(level: number): string[] {
    return ['calambres musculares', 'fatiga', 'irritabilidad', 'problemas de sueño'];
  }

  private getZincSymptoms(level: number): string[] {
    return ['inmunidad baja', 'cicatrización lenta', 'pérdida de apetito', 'problemas de piel'];
  }

  private getCalciumSymptoms(level: number): string[] {
    return ['debilidad ósea', 'calambres', 'problemas dentales'];
  }

  private getVitaminDExplanation(level: number, userProfile: UserProfile): string {
    return `Nivel de vitamina D: ${level} ng/mL. ${level < 20 ? 'Deficiencia severa' : level < 30 ? 'Deficiencia' : 'Nivel subóptimo'}. La vitamina D es esencial para la salud ósea, inmunidad y bienestar general.`;
  }

  private getB12Explanation(level: number, userProfile: UserProfile): string {
    return `Nivel de B12: ${level} pg/mL. ${level < 150 ? 'Deficiencia severa' : level < 200 ? 'Deficiencia' : 'Nivel subóptimo'}. La B12 es crucial para la función neurológica y la producción de glóbulos rojos.`;
  }

  private getIronExplanation(level: number, userProfile: UserProfile): string {
    return `Nivel de hierro: ${level} μg/dL. ${level < 30 ? 'Deficiencia severa' : level < 60 ? 'Deficiencia' : 'Nivel subóptimo'}. El hierro es esencial para el transporte de oxígeno y la energía.`;
  }

  private getMagnesiumExplanation(level: number, userProfile: UserProfile): string {
    return `Nivel de magnesio: ${level} mg/dL. ${level < 1.5 ? 'Deficiencia severa' : level < 1.8 ? 'Deficiencia' : 'Nivel subóptimo'}. El magnesio es crucial para la función muscular, nerviosa y el sueño.`;
  }

  private getZincExplanation(level: number, userProfile: UserProfile): string {
    return `Nivel de zinc: ${level} μg/dL. ${level < 50 ? 'Deficiencia severa' : level < 70 ? 'Deficiencia' : 'Nivel subóptimo'}. El zinc es esencial para la inmunidad, cicatrización y función cognitiva.`;
  }

  private getCalciumExplanation(level: number, userProfile: UserProfile): string {
    return `Nivel de calcio: ${level} mg/dL. ${level < 8.0 ? 'Deficiencia severa' : level < 8.5 ? 'Deficiencia' : 'Nivel subóptimo'}. El calcio es fundamental para la salud ósea y la función muscular.`;
  }
}
