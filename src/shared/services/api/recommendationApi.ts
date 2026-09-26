import { createClient } from '@supabase/supabase-js';
import { 
  RecommendationResult, 
  ProductAnalysisResult, 
  FeedbackData,
  UltimateRecommendationEngine 
} from '../../lib/recommendation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Instancia del motor de recomendación
const recommendationEngine = new UltimateRecommendationEngine();

/**
 * Obtiene recomendaciones personalizadas para un usuario
 */
export async function getRecommendations(userId: string): Promise<RecommendationResult> {
  try {
    // Obtener datos del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener logs de suplementos del usuario
    const { data: supplementLogs, error: logsError } = await supabase
      .from('supplement_logs')
      .select('*')
      .eq('user_id', userId)
      .order('taken_at', { ascending: false })
      .limit(100);

    if (logsError) {
      console.warn('Error obteniendo logs de suplementos:', logsError);
    }

    // Obtener stack actual de suplementos
    const { data: currentStack, error: stackError } = await supabase
      .from('user_supplement_stack')
      .select('*')
      .eq('user_id', userId);

    if (stackError) {
      console.warn('Error obteniendo stack actual:', stackError);
    }

    // Obtener datos de salud importados
    const { data: healthData, error: healthError } = await supabase
      .from('health_data_imports')
      .select('*')
      .eq('user_id', userId)
      .order('import_date', { ascending: false })
      .limit(50);

    if (healthError) {
      console.warn('Error obteniendo datos de salud:', healthError);
    }

    // Generar recomendaciones usando el motor
    const recommendations = await recommendationEngine.getUltimateRecommendations(
      profile.id,
      profile,
      supplementLogs || [],
      currentStack || [],
      healthData || []
    );

    // Guardar recomendaciones en la base de datos
    const { error: saveError } = await supabase
      .from('ai_recommendations')
      .insert({
        user_id: userId,
        recommendation_type: 'supplement',
        title: 'Recomendaciones de Suplementos',
        content: recommendations,
        confidence_score: recommendations.confidence_overall,
        status: 'pending'
      });

    if (saveError) {
      console.warn('Error guardando recomendaciones:', saveError);
    }

    return recommendations;
  } catch (error) {
    console.error('Error obteniendo recomendaciones:', error);
    throw error;
  }
}

/**
 * Analiza un producto escaneado para un usuario específico
 */
export async function analyzeProduct(
  userId: string, 
  productEan: string
): Promise<ProductAnalysisResult> {
  try {
    // Obtener datos del producto
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('ean', productEan)
      .single();

    if (productError || !product) {
      throw new Error('Producto no encontrado');
    }

    // Obtener perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error('Usuario no encontrado');
    }

    // Obtener stack actual del usuario
    const { data: currentStack, error: stackError } = await supabase
      .from('user_supplement_stack')
      .select('*')
      .eq('user_id', userId);

    if (stackError) {
      console.warn('Error obteniendo stack actual:', stackError);
    }

    // Analizar el producto
    const analysis = await recommendationEngine.analyzeProduct({
      product,
      userProfile: profile,
      currentStack: currentStack || []
    });

    return analysis;
  } catch (error) {
    console.error('Error analizando producto:', error);
    throw error;
  }
}

/**
 * Envía feedback sobre una recomendación
 */
export async function submitFeedback(
  userId: string,
  recommendationId: string,
  feedback: FeedbackData
): Promise<void> {
  try {
    const { error } = await supabase
      .from('recommendation_feedback')
      .insert({
        user_id: userId,
        recommendation_id: recommendationId,
        feedback_type: feedback.type,
        rating: feedback.rating,
        comments: feedback.comments
      });

    if (error) {
      throw new Error('Error enviando feedback');
    }
  } catch (error) {
    console.error('Error enviando feedback:', error);
    throw error;
  }
}

/**
 * Obtiene el historial de recomendaciones de un usuario
 */
export async function getRecommendationHistory(userId: string) {
  try {
    const { data, error } = await supabase
      .from('ai_recommendations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Error obteniendo historial');
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo historial:', error);
    throw error;
  }
}

/**
 * Obtiene patrones NHANES para enriquecer recomendaciones
 */
export async function getNHANESPatterns(demographicGroup?: string) {
  try {
    let query = supabase
      .from('nhanes_patterns')
      .select('*');

    if (demographicGroup) {
      query = query.eq('demographic_group', demographicGroup);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error('Error obteniendo patrones NHANES');
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo patrones NHANES:', error);
    throw error;
  }
}

/**
 * Obtiene evidencia clínica para un suplemento
 */
export async function getClinicalEvidence(supplementEan: string) {
  try {
    const { data, error } = await supabase
      .from('clinical_evidence')
      .select('*')
      .eq('supplement_ean', supplementEan)
      .order('effectiveness_score', { ascending: false });

    if (error) {
      throw new Error('Error obteniendo evidencia clínica');
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo evidencia clínica:', error);
    throw error;
  }
}

/**
 * Obtiene análisis de biomarcadores de un usuario
 */
export async function getBiomarkerAnalysis(userId: string) {
  try {
    const { data, error } = await supabase
      .from('biomarker_analysis')
      .select('*')
      .eq('user_id', userId)
      .order('analysis_date', { ascending: false });

    if (error) {
      throw new Error('Error obteniendo análisis de biomarcadores');
    }

    return data;
  } catch (error) {
    console.error('Error obteniendo análisis de biomarcadores:', error);
    throw error;
  }
}