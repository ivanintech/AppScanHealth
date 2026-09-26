import { UserProfile, SimilarUser } from '../types';
import { supabase } from '@/shared/supabase/client';

/**
 * Motor de similitud de usuarios para recomendaciones colaborativas
 * Encuentra usuarios con perfiles similares y analiza sus suplementos exitosos
 */
export class UserSimilarityEngine {
  private readonly similarityWeights = {
    demographics: 0.2,      // edad, género, peso
    health_goals: 0.3,      // objetivos de salud
    health_conditions: 0.25, // condiciones médicas
    lifestyle: 0.15,        // nivel de actividad, dieta
    checkup_similarity: 0.1 // similitud en resultados de checkup
  };

  /**
   * Encuentra usuarios similares basándose en múltiples factores
   */
  async findSimilarUsers(targetUser: UserProfile, limit: number = 50): Promise<SimilarUser[]> {
    try {
      // Obtener todos los usuarios con datos completos
      const { data: allUsers, error } = await supabase
        .from('profiles')
        .select(`
          id,
          health_goals,
          checkup_results,
          user_supplement_stack(supplement_ean),
          supplement_logs(supplement_ean, mood_after, taken_at)
        `)
        .not('id', 'eq', targetUser.id)
        .not('health_goals', 'is', null);

      if (error) {
        console.error('Error fetching users for similarity:', error);
        return [];
      }

      if (!allUsers || allUsers.length === 0) {
        return [];
      }

      // Calcular similitud con cada usuario
      const similarities: SimilarUser[] = allUsers
        .map(user => {
          const similarity = this.calculateSimilarity(targetUser, user);
          return {
            user_id: user.id,
            similarity_score: similarity.total,
            shared_goals: similarity.sharedGoals,
            shared_conditions: similarity.sharedConditions,
            successful_supplements: this.getSuccessfulSupplements(user)
          };
        })
        .filter(sim => sim.similarity_score > 0.3) // Solo usuarios con similitud > 30%
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);

      return similarities;
    } catch (error) {
      console.error('Error in findSimilarUsers:', error);
      return [];
    }
  }

  /**
   * Calcula la similitud entre dos usuarios
   */
  private calculateSimilarity(user1: UserProfile, user2: any): {
    total: number;
    sharedGoals: string[];
    sharedConditions: string[];
  } {
    const similarities = {
      demographics: this.calculateDemographicSimilarity(user1, user2),
      health_goals: this.calculateHealthGoalsSimilarity(user1, user2),
      health_conditions: this.calculateHealthConditionsSimilarity(user1, user2),
      lifestyle: this.calculateLifestyleSimilarity(user1, user2),
      checkup_similarity: this.calculateCheckupSimilarity(user1, user2)
    };

    // Calcular similitud total ponderada
    const total = Object.entries(similarities).reduce((sum, [key, value]) => {
      return sum + (value * this.similarityWeights[key as keyof typeof this.similarityWeights]);
    }, 0);

    return {
      total,
      sharedGoals: this.getSharedGoals(user1, user2),
      sharedConditions: this.getSharedConditions(user1, user2)
    };
  }

  /**
   * Similitud demográfica (edad, género, peso)
   */
  private calculateDemographicSimilarity(user1: UserProfile, user2: any): number {
    let score = 0;
    let factors = 0;

    // Similitud de edad (±5 años = 100%, ±10 años = 50%, etc.)
    if (user1.age && user2.age) {
      const ageDiff = Math.abs(user1.age - user2.age);
      const ageSimilarity = Math.max(0, 1 - (ageDiff / 20)); // 20 años de diferencia = 0% similitud
      score += ageSimilarity;
      factors++;
    }

    // Similitud de género
    if (user1.gender && user2.gender) {
      const genderSimilarity = user1.gender === user2.gender ? 1 : 0.3; // Mismo género = 100%, diferente = 30%
      score += genderSimilarity;
      factors++;
    }

    // Similitud de peso (±10kg = 100%, ±20kg = 50%, etc.)
    if (user1.weight && user2.weight) {
      const weightDiff = Math.abs(user1.weight - user2.weight);
      const weightSimilarity = Math.max(0, 1 - (weightDiff / 40)); // 40kg de diferencia = 0% similitud
      score += weightSimilarity;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Similitud en objetivos de salud
   */
  private calculateHealthGoalsSimilarity(user1: UserProfile, user2: any): number {
    const goals1 = user1.health_goals || [];
    const goals2 = user2.health_goals || [];

    if (goals1.length === 0 || goals2.length === 0) return 0;

    const intersection = goals1.filter(goal => goals2.includes(goal));
    const union = [...new Set([...goals1, ...goals2])];

    return intersection.length / union.length; // Jaccard similarity
  }

  /**
   * Similitud en condiciones de salud
   */
  private calculateHealthConditionsSimilarity(user1: UserProfile, user2: any): number {
    const conditions1 = user1.health_conditions || [];
    const conditions2 = user2.health_conditions || [];

    if (conditions1.length === 0 && conditions2.length === 0) return 1; // Ambos sin condiciones
    if (conditions1.length === 0 || conditions2.length === 0) return 0;

    const intersection = conditions1.filter(condition => conditions2.includes(condition));
    const union = [...new Set([...conditions1, ...conditions2])];

    return intersection.length / union.length;
  }

  /**
   * Similitud en estilo de vida
   */
  private calculateLifestyleSimilarity(user1: UserProfile, user2: any): number {
    let score = 0;
    let factors = 0;

    // Similitud en nivel de actividad
    if (user1.activity_level && user2.activity_level) {
      const activitySimilarity = user1.activity_level === user2.activity_level ? 1 : 0.5;
      score += activitySimilarity;
      factors++;
    }

    // Similitud en tipo de dieta
    if (user1.diet_type && user2.diet_type) {
      const dietSimilarity = user1.diet_type === user2.diet_type ? 1 : 0.3;
      score += dietSimilarity;
      factors++;
    }

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Similitud en resultados de checkup
   */
  private calculateCheckupSimilarity(user1: UserProfile, user2: any): number {
    const checkup1 = user1.checkup_results;
    const checkup2 = user2.checkup_results;

    if (!checkup1 || !checkup2) return 0;

    let score = 0;
    let factors = 0;

    // Comparar biomarcadores clave
    const biomarkers = ['vitamin_d', 'b12', 'iron', 'magnesium', 'zinc'];
    
    biomarkers.forEach(biomarker => {
      const value1 = checkup1[biomarker as keyof typeof checkup1] as number;
      const value2 = checkup2[biomarker as keyof typeof checkup2] as number;
      
      if (value1 !== undefined && value2 !== undefined) {
        const diff = Math.abs(value1 - value2);
        const maxValue = Math.max(value1, value2);
        const similarity = Math.max(0, 1 - (diff / maxValue));
        score += similarity;
        factors++;
      }
    });

    return factors > 0 ? score / factors : 0;
  }

  /**
   * Obtiene objetivos compartidos entre usuarios
   */
  private getSharedGoals(user1: UserProfile, user2: any): string[] {
    const goals1 = user1.health_goals || [];
    const goals2 = user2.health_goals || [];
    return goals1.filter(goal => goals2.includes(goal));
  }

  /**
   * Obtiene condiciones compartidas entre usuarios
   */
  private getSharedConditions(user1: UserProfile, user2: any): string[] {
    const conditions1 = user1.health_conditions || [];
    const conditions2 = user2.health_conditions || [];
    return conditions1.filter(condition => conditions2.includes(condition));
  }

  /**
   * Identifica suplementos exitosos de un usuario basándose en logs y reviews
   */
  private getSuccessfulSupplements(user: any): string[] {
    const successfulSupplements: string[] = [];

    // Analizar logs de suplementos con mood_after positivo
    if (user.supplement_logs) {
      const positiveLogs = user.supplement_logs.filter((log: any) => 
        log.mood_after && log.mood_after >= 4
      );
      
      const supplementFrequency = positiveLogs.reduce((acc: any, log: any) => {
        acc[log.supplement_ean] = (acc[log.supplement_ean] || 0) + 1;
        return acc;
      }, {});

      // Suplementos con al menos 3 tomas positivas
      Object.entries(supplementFrequency).forEach(([ean, count]) => {
        if ((count as number) >= 3) {
          successfulSupplements.push(ean);
        }
      });
    }

    // Analizar stack actual (asumiendo que si está en el stack, es exitoso)
    if (user.user_supplement_stack) {
      user.user_supplement_stack.forEach((item: any) => {
        if (!successfulSupplements.includes(item.supplement_ean)) {
          successfulSupplements.push(item.supplement_ean);
        }
      });
    }

    return successfulSupplements;
  }

  /**
   * Obtiene recomendaciones basadas en usuarios similares
   */
  async getCollaborativeRecommendations(
    targetUser: UserProfile, 
    similarUsers: SimilarUser[]
  ): Promise<{ supplement_ean: string; score: number; reason: string }[]> {
    if (similarUsers.length === 0) return [];

    const supplementScores: { [ean: string]: { score: number; users: number; reasons: string[] } } = {};

    similarUsers.forEach(similarUser => {
      similarUser.successful_supplements.forEach(supplementEan => {
        if (!supplementScores[supplementEan]) {
          supplementScores[supplementEan] = { score: 0, users: 0, reasons: [] };
        }

        // Puntuar basándose en similitud del usuario
        const userScore = similarUser.similarity_score;
        supplementScores[supplementEan].score += userScore;
        supplementScores[supplementEan].users += 1;
        supplementScores[supplementEan].reasons.push(
          `Recomendado por usuario similar (${Math.round(similarUser.similarity_score * 100)}% similitud)`
        );
      });
    });

    // Convertir a array y ordenar por score
    return Object.entries(supplementScores)
      .map(([ean, data]) => ({
        supplement_ean: ean,
        score: data.score / data.users, // Promedio ponderado
        reason: data.reasons.join('; ')
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10); // Top 10 recomendaciones
  }

  /**
   * Calcula la confianza en las recomendaciones colaborativas
   */
  calculateCollaborativeConfidence(similarUsers: SimilarUser[]): number {
    if (similarUsers.length === 0) return 0;

    const avgSimilarity = similarUsers.reduce((sum, user) => sum + user.similarity_score, 0) / similarUsers.length;
    const userCount = similarUsers.length;
    
    // Confianza basada en similitud promedio y número de usuarios similares
    const similarityFactor = Math.min(avgSimilarity, 1);
    const countFactor = Math.min(userCount / 10, 1); // Máximo confianza con 10+ usuarios
    
    return (similarityFactor * 0.7) + (countFactor * 0.3);
  }
}
