import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface KaggleFitnessRecord {
  userId: string;
  gender: string;
  age: string;
  fitnessLevel: string;
  supplement: string;
  supplementType: string;
  usagePeriod: number;
  usageFrequency: number;
  performanceImprovement: number;
  satisfaction: number;
  weightChange: number;
  bodyFatChange: number;
}

export interface FitnessRecommendation {
  supplement: string;
  supplementType: string;
  expectedImprovement: number;
  confidence: number;
  userMatch: number;
  similarUsers: number;
  avgSatisfaction: number;
  usagePattern: {
    recommendedPeriod: number;
    recommendedFrequency: number;
  };
}

export interface KaggleFitnessConfig {
  enableUserMatching: boolean;
  enablePerformancePrediction: boolean;
  enableSatisfactionAnalysis: boolean;
  minSimilarUsers: number;
  minConfidence: number;
}

export class KaggleFitnessIntegration {
  private config: KaggleFitnessConfig;

  constructor(config: Partial<KaggleFitnessConfig> = {}) {
    this.config = {
      enableUserMatching: true,
      enablePerformancePrediction: true,
      enableSatisfactionAnalysis: true,
      minSimilarUsers: 10,
      minConfidence: 0.6,
      ...config
    };
  }

  /**
   * Obtiene recomendaciones basadas en datos de Kaggle Fitness
   */
  async getFitnessRecommendations(userProfile: any): Promise<FitnessRecommendation[]> {
    try {
      // Buscar usuarios similares
      const similarUsers = await this.findSimilarUsers(userProfile);
      
      if (similarUsers.length < this.config.minSimilarUsers) {
        return [];
      }

      // Analizar suplementos más efectivos para usuarios similares
      const supplementAnalysis = this.analyzeSupplementsForSimilarUsers(similarUsers);
      
      // Generar recomendaciones
      const recommendations = this.generateFitnessRecommendations(
        supplementAnalysis, 
        userProfile, 
        similarUsers
      );

      return recommendations.filter(rec => rec.confidence >= this.config.minConfidence);
    } catch (error) {
      console.error('Error obteniendo recomendaciones de fitness:', error);
      return [];
    }
  }

  /**
   * Encuentra usuarios similares basándose en perfil
   */
  private async findSimilarUsers(userProfile: any): Promise<KaggleFitnessRecord[]> {
    try {
      // Cargar datos reales de Kaggle Fitness
      const realData = await this.loadKaggleFitnessData();
      
      if (!realData || realData.length === 0) {
        console.log('No se encontraron datos reales de Kaggle Fitness');
        return [];
      }

      // Filtrar usuarios similares basándose en datos reales
      const similarUsers = realData.filter(record => 
        this.isSimilarUser(record, userProfile)
      );

      return similarUsers;
    } catch (error) {
      console.error('Error encontrando usuarios similares:', error);
      return [];
    }
  }

  /**
   * Carga datos reales de Kaggle Fitness
   */
  private async loadKaggleFitnessData(): Promise<KaggleFitnessRecord[]> {
    try {
      console.log('Cargando datos reales de Kaggle Fitness...');
      
      const fs = require('fs');
      const path = require('path');
      const csvPath = path.join(__dirname, '../../real_data/kaggle_fitness/fitness_supplements_dataset.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.error('Archivo CSV de Kaggle Fitness no encontrado:', csvPath);
        return [];
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const records: KaggleFitnessRecord[] = [];

      // Saltar header (línea 0)
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const columns = line.split(',');
        if (columns.length < 17) continue;

        try {
          const record: KaggleFitnessRecord = {
            userId: `kaggle_${i}`,
            gender: columns[0],
            age: columns[1],
            fitnessLevel: columns[5],
            supplement: columns[8],
            supplementType: columns[9],
            usagePeriod: parseInt(columns[10]) || 0,
            usageFrequency: parseInt(columns[11]) || 0,
            performanceImprovement: parseFloat(columns[15]) || 0,
            satisfaction: parseFloat(columns[16]) || 0,
            weightChange: parseFloat(columns[13]) || 0,
            bodyFatChange: parseFloat(columns[14]) || 0
          };
          records.push(record);
        } catch (parseError) {
          console.warn(`Error parseando línea ${i}:`, parseError);
        }
      }

      console.log(`Cargados ${records.length} registros reales de Kaggle Fitness`);
      return records;
    } catch (error) {
      console.error('Error cargando datos de Kaggle Fitness:', error);
      return [];
    }
  }

  /**
   * Determina si un usuario es similar al perfil dado
   */
  private isSimilarUser(record: KaggleFitnessRecord, userProfile: any): boolean {
    // Comparar género
    if (record.gender !== userProfile.gender) {
      return false;
    }

    // Comparar grupo de edad
    const userAgeGroup = this.getAgeGroup(userProfile.age);
    if (record.age !== userAgeGroup) {
      return false;
    }

    // Comparar nivel de fitness
    if (record.fitnessLevel !== userProfile.activity_level) {
      return false;
    }

    return true;
  }

  /**
   * Analiza suplementos para usuarios similares
   */
  private analyzeSupplementsForSimilarUsers(users: KaggleFitnessRecord[]): Map<string, any> {
    const supplementMap = new Map<string, any>();

    users.forEach(user => {
      const key = `${user.supplement}_${user.supplementType}`;
      
      if (!supplementMap.has(key)) {
        supplementMap.set(key, {
          supplement: user.supplement,
          supplementType: user.supplementType,
          users: [],
          totalImprovement: 0,
          totalSatisfaction: 0,
          totalWeightChange: 0,
          totalBodyFatChange: 0,
          avgPeriod: 0,
          avgFrequency: 0
        });
      }

      const data = supplementMap.get(key);
      data.users.push(user);
      data.totalImprovement += user.performanceImprovement;
      data.totalSatisfaction += user.satisfaction;
      data.totalWeightChange += user.weightChange;
      data.totalBodyFatChange += user.bodyFatChange;
      data.avgPeriod += user.usagePeriod;
      data.avgFrequency += user.usageFrequency;
    });

    // Calcular promedios
    supplementMap.forEach((data, key) => {
      const userCount = data.users.length;
      data.avgImprovement = data.totalImprovement / userCount;
      data.avgSatisfaction = data.totalSatisfaction / userCount;
      data.avgWeightChange = data.totalWeightChange / userCount;
      data.avgBodyFatChange = data.totalBodyFatChange / userCount;
      data.avgPeriod = data.avgPeriod / userCount;
      data.avgFrequency = data.avgFrequency / userCount;
      data.userCount = userCount;
    });

    return supplementMap;
  }

  /**
   * Genera recomendaciones de fitness
   */
  private generateFitnessRecommendations(
    supplementAnalysis: Map<string, any>,
    userProfile: any,
    similarUsers: KaggleFitnessRecord[]
  ): FitnessRecommendation[] {
    const recommendations: FitnessRecommendation[] = [];

    supplementAnalysis.forEach((data, key) => {
      // Calcular confianza basada en número de usuarios y satisfacción
      const confidence = Math.min(
        (data.userCount / similarUsers.length) * 0.5 + 
        (data.avgSatisfaction / 10) * 0.5,
        1
      );

      // Calcular match del usuario
      const userMatch = this.calculateUserMatch(userProfile, data);

      // Calcular mejora esperada
      const expectedImprovement = data.avgImprovement * userMatch;

      recommendations.push({
        supplement: data.supplement,
        supplementType: data.supplementType,
        expectedImprovement,
        confidence,
        userMatch,
        similarUsers: data.userCount,
        avgSatisfaction: data.avgSatisfaction,
        usagePattern: {
          recommendedPeriod: Math.round(data.avgPeriod),
          recommendedFrequency: Math.round(data.avgFrequency)
        }
      });
    });

    // Ordenar por confianza y mejora esperada
    return recommendations.sort((a, b) => 
      (b.confidence * b.expectedImprovement) - (a.confidence * a.expectedImprovement)
    );
  }

  /**
   * Calcula el match del usuario con el suplemento
   */
  private calculateUserMatch(userProfile: any, supplementData: any): number {
    let match = 0.5; // Base match

    // Match basado en nivel de actividad
    if (userProfile.activity_level === 'high' && supplementData.avgImprovement > 15) {
      match += 0.2;
    } else if (userProfile.activity_level === 'medium' && supplementData.avgImprovement > 10) {
      match += 0.1;
    }

    // Match basado en objetivos de salud
    if (userProfile.health_goals) {
      const goals = userProfile.health_goals.join(' ').toLowerCase();
      if (goals.includes('weight') && supplementData.avgWeightChange > 0) {
        match += 0.1;
      }
      if (goals.includes('muscle') && supplementData.avgImprovement > 10) {
        match += 0.1;
      }
    }

    return Math.min(Math.max(match, 0), 1);
  }

  /**
   * Obtiene grupo de edad
   */
  private getAgeGroup(age: number): string {
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    return '55+';
  }

  /**
   * Predice mejora de rendimiento para un suplemento
   */
  async predictPerformanceImprovement(
    supplement: string,
    userProfile: any
  ): Promise<{
    expectedImprovement: number;
    confidence: number;
    factors: string[];
  }> {
    try {
      // Buscar datos históricos del suplemento
      const historicalData = await this.getHistoricalData(supplement);
      
      if (historicalData.length === 0) {
        return {
          expectedImprovement: 0,
          confidence: 0,
          factors: ['No hay datos históricos suficientes']
        };
      }

      // Calcular mejora esperada basada en usuarios similares
      const avgImprovement = historicalData.reduce((sum, record) => 
        sum + record.performanceImprovement, 0) / historicalData.length;

      // Ajustar basado en perfil del usuario
      const userAdjustment = this.calculateUserAdjustment(userProfile, historicalData);
      const expectedImprovement = avgImprovement * userAdjustment;

      // Calcular confianza
      const confidence = Math.min(historicalData.length / 50, 1);

      // Identificar factores clave
      const factors = this.identifyKeyFactors(historicalData, userProfile);

      return {
        expectedImprovement,
        confidence,
        factors
      };
    } catch (error) {
      console.error('Error prediciendo mejora de rendimiento:', error);
      return {
        expectedImprovement: 0,
        confidence: 0,
        factors: ['Error en predicción']
      };
    }
  }

  /**
   * Obtiene datos históricos de un suplemento
   */
  private async getHistoricalData(supplement: string): Promise<KaggleFitnessRecord[]> {
    try {
      // Cargar datos reales de Kaggle Fitness
      const realData = await this.loadKaggleFitnessData();
      
      if (!realData || realData.length === 0) {
        console.log('No se encontraron datos históricos reales');
        return [];
      }

      // Filtrar por suplemento específico
      const historicalData = realData.filter(record => 
        record.supplement.toLowerCase().includes(supplement.toLowerCase())
      );

      return historicalData;
    } catch (error) {
      console.error('Error obteniendo datos históricos:', error);
      return [];
    }
  }

  /**
   * Calcula ajuste basado en perfil del usuario
   */
  private calculateUserAdjustment(userProfile: any, historicalData: KaggleFitnessRecord[]): number {
    let adjustment = 1.0;

    // Ajuste por nivel de actividad
    if (userProfile.activity_level === 'high') {
      adjustment += 0.1;
    } else if (userProfile.activity_level === 'low') {
      adjustment -= 0.1;
    }

    // Ajuste por edad
    const userAge = userProfile.age || 30;
    if (userAge < 25) {
      adjustment += 0.05; // Jóvenes responden mejor
    } else if (userAge > 50) {
      adjustment -= 0.05; // Mayores pueden responder menos
    }

    return Math.max(adjustment, 0.5); // Mínimo 50% de efectividad
  }

  /**
   * Identifica factores clave para la predicción
   */
  private identifyKeyFactors(historicalData: KaggleFitnessRecord[], userProfile: any): string[] {
    const factors: string[] = [];

    // Factor de satisfacción promedio
    const avgSatisfaction = historicalData.reduce((sum, record) => 
      sum + record.satisfaction, 0) / historicalData.length;
    
    if (avgSatisfaction > 8) {
      factors.push('Alta satisfacción histórica');
    }

    // Factor de mejora de rendimiento
    const avgImprovement = historicalData.reduce((sum, record) => 
      sum + record.performanceImprovement, 0) / historicalData.length;
    
    if (avgImprovement > 15) {
      factors.push('Mejora significativa de rendimiento');
    }

    // Factor de perfil del usuario
    if (userProfile.activity_level === 'high') {
      factors.push('Perfil de alta actividad');
    }

    return factors;
  }

  /**
   * Sincroniza datos de Kaggle Fitness
   */
  async syncKaggleFitnessData(): Promise<void> {
    try {
      console.log('Sincronizando datos de Kaggle Fitness...');
      // Aquí implementarías la lógica para cargar datos del CSV
      // Por ahora, solo log
      console.log('Datos de Kaggle Fitness sincronizados');
    } catch (error) {
      console.error('Error sincronizando datos de Kaggle Fitness:', error);
    }
  }
}
