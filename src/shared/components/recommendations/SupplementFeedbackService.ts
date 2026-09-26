import { SupplementFeedback } from './SupplementMatchingService';
import { supabase } from '../../supabase/client';

export interface StoredFeedback {
  id: string;
  userId: string;
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
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
}

export class SupplementFeedbackService {
  private supabaseUrl: string;
  private supabaseKey: string;

  constructor() {
    this.supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
    this.supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  }

  async storeSupplementFeedback(
    userId: string, 
    feedback: SupplementFeedback
  ): Promise<StoredFeedback | null> {
    try {
      // Verificar autenticación
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.warn('Usuario no autenticado, saltando almacenamiento de feedback');
        return null;
      }

      // Usar el cliente de Supabase directamente
      const { data, error } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          recommendation_type: 'supplement',
          title: feedback.supplementName,
          content: {
            supplementId: feedback.supplementId,
            isUseful: feedback.isUseful,
            utilityScore: feedback.utilityScore,
            personalizedReasons: feedback.personalizedReasons,
            warnings: feedback.warnings,
            recommendedTiming: feedback.recommendedTiming,
            recommendedDosage: feedback.recommendedDosage,
            interactions: feedback.interactions,
            category: feedback.category,
            confidence: feedback.confidence,
            generatedAt: new Date().toISOString()
          },
          confidence_score: feedback.confidence,
          status: 'pending',
          priority: feedback.utilityScore > 70 ? 1 : feedback.utilityScore > 50 ? 2 : 3
        })
        .select()
        .single();

      if (error) {
        console.error('Error storing supplement feedback:', error);
        return null;
      }

      return {
        id: data.id,
        userId: userId,
        supplementId: feedback.supplementId,
        supplementName: feedback.supplementName,
        isUseful: feedback.isUseful,
        utilityScore: feedback.utilityScore,
        personalizedReasons: feedback.personalizedReasons,
        warnings: feedback.warnings,
        recommendedTiming: feedback.recommendedTiming,
        recommendedDosage: feedback.recommendedDosage,
        interactions: feedback.interactions,
        category: feedback.category,
        confidence: feedback.confidence,
        status: 'pending',
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error storing supplement feedback:', error);
      return null;
    }
  }

  async getSupplementFeedback(
    userId: string, 
    supplementId?: string
  ): Promise<StoredFeedback[]> {
    try {
      // Obtener el token de autenticación del usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        console.warn('Usuario no autenticado, no se pueden obtener feedbacks');
        return [];
      }

      let url = `${this.supabaseUrl}/rest/v1/ai_recommendations?user_id=eq.${userId}&recommendation_type=eq.supplement`;
      
      if (supplementId) {
        url += `&content->>supplementId=eq.${supplementId}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': this.supabaseKey
        }
      });

      if (!response.ok) {
        throw new Error(`Error fetching feedback: ${response.statusText}`);
      }

      const results = await response.json();
      
      return results.map((item: any) => ({
        id: item.id,
        userId: item.user_id,
        supplementId: item.content.supplementId,
        supplementName: item.title,
        isUseful: item.content.isUseful,
        utilityScore: item.content.utilityScore,
        personalizedReasons: item.content.personalizedReasons,
        warnings: item.content.warnings,
        recommendedTiming: item.content.recommendedTiming,
        recommendedDosage: item.content.recommendedDosage,
        interactions: item.content.interactions,
        category: item.content.category,
        confidence: item.content.confidence,
        status: item.status || 'pending',
        createdAt: new Date(item.created_at)
      }));

    } catch (error) {
      console.error('Error fetching supplement feedback:', error);
      return [];
    }
  }

  async updateFeedbackStatus(
    feedbackId: string, 
    status: 'accepted' | 'rejected' | 'expired'
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.supabaseUrl}/rest/v1/ai_recommendations?id=eq.${feedbackId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        },
        body: JSON.stringify({
          status: status,
          updated_at: new Date().toISOString()
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error updating feedback status:', error);
      return false;
    }
  }

  async deleteOldFeedback(userId: string, daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const response = await fetch(`${this.supabaseUrl}/rest/v1/ai_recommendations?user_id=eq.${userId}&created_at=lt.${cutoffDate.toISOString()}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.supabaseKey}`,
          'apikey': this.supabaseKey
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting old feedback:', error);
      return false;
    }
  }
}
