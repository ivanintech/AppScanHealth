/**
 * 💾 SupplementUtilityStorage - Almacenamiento de Valoraciones de Utilidad
 * Servicio para almacenar y recuperar valoraciones de utilidad de suplementos
 */

import { SupplementUtilityResult } from './SupplementUtilityEvaluator';

export interface StoredUtilityResult {
  id: string;
  userId: string;
  supplementId: string;
  supplementName: string;
  utilityScore: number;
  isUseful: boolean;
  confidence: number;
  personalizedReasons: string[];
  warnings: string[];
  recommendedTiming: string;
  recommendedDosage: string;
  interactions: string[];
  category: string;
  riskLevel: string;
  priority: number;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

export class SupplementUtilityStorage {
  private supabase: any;

  constructor() {
    this.initializeSupabase();
  }

  /**
   * Inicializa la conexión con Supabase
   */
  private async initializeSupabase() {
    try {
      const { supabase } = await import('@/shared/supabase/client');
      this.supabase = supabase;
    } catch (error) {
      console.error('Error inicializando Supabase:', error);
    }
  }

  /**
   * Almacena valoraciones de utilidad en ai_recommendations
   */
  async storeUtilityResults(
    userId: string,
    utilityResults: SupplementUtilityResult[]
  ): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      console.log(`💾 Almacenando ${utilityResults.length} valoraciones de utilidad...`);

      // Limpiar valoraciones existentes para este usuario
      await this.clearExistingUtilityResults(userId);

      // Preparar datos para inserción
      const records = utilityResults.map(result => ({
        user_id: userId,
        recommendation_type: 'supplement',
        title: `Utilidad de ${result.supplementName}`,
        content: {
          supplementId: result.supplementId,
          supplementName: result.supplementName,
          categoryId: result.categoryId,
          utilityScore: result.utilityScore,
          isUseful: result.isUseful,
          confidence: result.confidence,
          personalizedReasons: result.personalizedReasons,
          warnings: result.warnings,
          recommendedTiming: result.recommendedTiming,
          recommendedDosage: result.recommendedDosage,
          interactions: result.interactions,
          category: result.category,
          riskLevel: result.riskLevel,
          priority: result.priority
        },
        confidence_score: result.confidence,
        status: 'pending',
        priority: result.priority
      }));

      // Insertar en lotes para mejor rendimiento
      const batchSize = 50;
      for (let i = 0; i < records.length; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        
        const { error } = await this.supabase
          .from('ai_recommendations')
          .insert(batch);

        if (error) {
          console.error(`Error insertando lote ${i}-${i + batchSize}:`, error);
          return false;
        }
      }

      console.log(`✅ Valoraciones almacenadas exitosamente: ${utilityResults.length} registros`);
      return true;
    } catch (error) {
      console.error('❌ Error almacenando valoraciones:', error);
      return false;
    }
  }

  /**
   * Limpia valoraciones existentes para un usuario
   */
  private async clearExistingUtilityResults(userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('ai_recommendations')
        .delete()
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement');

      if (error) {
        console.warn('Error limpiando valoraciones existentes:', error);
      } else {
        console.log('🧹 Valoraciones existentes eliminadas');
      }
    } catch (error) {
      console.warn('Error limpiando valoraciones:', error);
    }
  }

  /**
   * Recupera valoraciones de utilidad para un usuario
   */
  async getUtilityResults(userId: string): Promise<StoredUtilityResult[]> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      const { data, error } = await this.supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement')
        .order('priority', { ascending: false });

      if (error) {
        console.error('Error recuperando valoraciones:', error);
        return [];
      }

      return data.map((record: any) => ({
        id: record.id,
        userId: record.user_id,
        supplementId: record.content.supplementId,
        supplementName: record.content.supplementName,
        utilityScore: record.content.utilityScore,
        isUseful: record.content.isUseful,
        confidence: record.content.confidence,
        personalizedReasons: record.content.personalizedReasons,
        warnings: record.content.warnings,
        recommendedTiming: record.content.recommendedTiming,
        recommendedDosage: record.content.recommendedDosage,
        interactions: record.content.interactions,
        category: record.content.category,
        riskLevel: record.content.riskLevel,
        priority: record.content.priority,
        status: record.status,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      }));
    } catch (error) {
      console.error('Error recuperando valoraciones:', error);
      return [];
    }
  }

  /**
   * Recupera valoración específica de un suplemento
   */
  async getSupplementUtility(
    userId: string,
    supplementId: string
  ): Promise<StoredUtilityResult | null> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      const { data, error } = await this.supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement')
        .filter('content->>supplementId', 'eq', supplementId)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        userId: data.user_id,
        supplementId: data.content.supplementId,
        supplementName: data.content.supplementName,
        utilityScore: data.content.utilityScore,
        isUseful: data.content.isUseful,
        confidence: data.content.confidence,
        personalizedReasons: data.content.personalizedReasons,
        warnings: data.content.warnings,
        recommendedTiming: data.content.recommendedTiming,
        recommendedDosage: data.content.recommendedDosage,
        interactions: data.content.interactions,
        category: data.content.category,
        riskLevel: data.content.riskLevel,
        priority: data.content.priority,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error recuperando valoración específica:', error);
      return null;
    }
  }

  /**
   * Actualiza el estado de una valoración
   */
  async updateUtilityStatus(
    utilityId: string,
    status: 'accepted' | 'rejected' | 'expired'
  ): Promise<boolean> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      const { error } = await this.supabase
        .from('ai_recommendations')
        .update({
          status: status,
          updated_at: new Date().toISOString()
        })
        .eq('id', utilityId);

      if (error) {
        console.error('Error actualizando estado:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error actualizando estado:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de valoraciones
   */
  async getUtilityStats(userId: string): Promise<any> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      const { data, error } = await this.supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement');

      if (error) {
        console.error('Error obteniendo estadísticas:', error);
        return null;
      }

      const total = data.length;
      const useful = data.filter((d: any) => d.content.isUseful).length;
      const accepted = data.filter((d: any) => d.status === 'accepted').length;
      const rejected = data.filter((d: any) => d.status === 'rejected').length;
      const averageScore = data.reduce((sum: number, d: any) => sum + d.content.utilityScore, 0) / total;

      return {
        totalSupplements: total,
        usefulSupplements: useful,
        acceptedSupplements: accepted,
        rejectedSupplements: rejected,
        averageUtilityScore: averageScore,
        utilityRate: (useful / total) * 100,
        acceptanceRate: (accepted / total) * 100
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      return null;
    }
  }

  /**
   * Obtiene suplementos más útiles para un usuario
   */
  async getMostUsefulSupplements(
    userId: string,
    limit: number = 10
  ): Promise<StoredUtilityResult[]> {
    try {
      if (!this.supabase) {
        await this.initializeSupabase();
      }

      const { data, error } = await this.supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', userId)
        .eq('recommendation_type', 'supplement')
        .eq('content->>isUseful', true)
        .order('content->>utilityScore', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error obteniendo suplementos más útiles:', error);
        return [];
      }

      return data.map((record: any) => ({
        id: record.id,
        userId: record.user_id,
        supplementId: record.content.supplementId,
        supplementName: record.content.supplementName,
        utilityScore: record.content.utilityScore,
        isUseful: record.content.isUseful,
        confidence: record.content.confidence,
        personalizedReasons: record.content.personalizedReasons,
        warnings: record.content.warnings,
        recommendedTiming: record.content.recommendedTiming,
        recommendedDosage: record.content.recommendedDosage,
        interactions: record.content.interactions,
        category: record.content.category,
        riskLevel: record.content.riskLevel,
        priority: record.content.priority,
        status: record.status,
        createdAt: new Date(record.created_at),
        updatedAt: new Date(record.updated_at)
      }));
    } catch (error) {
      console.error('Error obteniendo suplementos más útiles:', error);
      return [];
    }
  }
}
