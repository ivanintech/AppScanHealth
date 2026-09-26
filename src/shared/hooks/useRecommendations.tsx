import { useState, useEffect } from 'react';
import { 
  getRecommendations, 
  analyzeProduct, 
  submitFeedback,
  getRecommendationHistory,
  getNHANESPatterns,
  getClinicalEvidence,
  getBiomarkerAnalysis
} from '../services/api/recommendationApi';
import { RecommendationResult, ProductAnalysisResult, FeedbackData } from '../lib/recommendation';

interface UseRecommendationsProps {
  userId: string;
}

interface UseRecommendationsReturn {
  // Estado
  recommendations: RecommendationResult | null;
  productAnalysis: ProductAnalysisResult | null;
  history: any[];
  nhanesPatterns: any[];
  clinicalEvidence: any[];
  biomarkerAnalysis: any[];
  
  // Estados de carga
  loading: boolean;
  analyzing: boolean;
  submittingFeedback: boolean;
  
  // Estados de error
  error: string | null;
  
  // Acciones
  fetchRecommendations: () => Promise<void>;
  analyzeProductForUser: (productEan: string) => Promise<void>;
  submitRecommendationFeedback: (feedback: FeedbackData) => Promise<void>;
  fetchHistory: () => Promise<void>;
  fetchNHANESPatterns: (demographicGroup?: string) => Promise<void>;
  fetchClinicalEvidence: (supplementEan: string) => Promise<void>;
  fetchBiomarkerAnalysis: () => Promise<void>;
  
  // Utilidades
  clearError: () => void;
  clearRecommendations: () => void;
}

export function useRecommendations({ userId }: UseRecommendationsProps): UseRecommendationsReturn {
  // Estado principal
  const [recommendations, setRecommendations] = useState<RecommendationResult | null>(null);
  const [productAnalysis, setProductAnalysis] = useState<ProductAnalysisResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [nhanesPatterns, setNHANESPatterns] = useState<any[]>([]);
  const [clinicalEvidence, setClinicalEvidence] = useState<any[]>([]);
  const [biomarkerAnalysis, setBiomarkerAnalysis] = useState<any[]>([]);
  
  // Estados de carga
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  
  // Estados de error
  const [error, setError] = useState<string | null>(null);

  // Obtener recomendaciones
  const fetchRecommendations = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getRecommendations(userId);
      setRecommendations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo recomendaciones');
    } finally {
      setLoading(false);
    }
  };

  // Analizar producto
  const analyzeProductForUser = async (productEan: string) => {
    if (!userId || !productEan) return;
    
    setAnalyzing(true);
    setError(null);
    
    try {
      const result = await analyzeProduct(userId, productEan);
      setProductAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error analizando producto');
    } finally {
      setAnalyzing(false);
    }
  };

  // Enviar feedback
  const submitRecommendationFeedback = async (feedback: FeedbackData) => {
    if (!userId) return;
    
    setSubmittingFeedback(true);
    setError(null);
    
    try {
      await submitFeedback(userId, feedback.recommendation_id || '', feedback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error enviando feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Obtener historial
  const fetchHistory = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getRecommendationHistory(userId);
      setHistory(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo historial');
    } finally {
      setLoading(false);
    }
  };

  // Obtener patrones NHANES
  const fetchNHANESPatterns = async (demographicGroup?: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getNHANESPatterns(demographicGroup);
      setNHANESPatterns(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo patrones NHANES');
    } finally {
      setLoading(false);
    }
  };

  // Obtener evidencia clínica
  const fetchClinicalEvidence = async (supplementEan: string) => {
    if (!supplementEan) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getClinicalEvidence(supplementEan);
      setClinicalEvidence(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo evidencia clínica');
    } finally {
      setLoading(false);
    }
  };

  // Obtener análisis de biomarcadores
  const fetchBiomarkerAnalysis = async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await getBiomarkerAnalysis(userId);
      setBiomarkerAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error obteniendo análisis de biomarcadores');
    } finally {
      setLoading(false);
    }
  };

  // Utilidades
  const clearError = () => setError(null);
  const clearRecommendations = () => setRecommendations(null);

  // Cargar datos iniciales
  useEffect(() => {
    if (userId) {
      fetchRecommendations();
      fetchHistory();
      fetchBiomarkerAnalysis();
    }
  }, [userId]);

  return {
    // Estado
    recommendations,
    productAnalysis,
    history,
    nhanesPatterns,
    clinicalEvidence,
    biomarkerAnalysis,
    
    // Estados de carga
    loading,
    analyzing,
    submittingFeedback,
    
    // Estados de error
    error,
    
    // Acciones
    fetchRecommendations,
    analyzeProductForUser,
    submitRecommendationFeedback,
    fetchHistory,
    fetchNHANESPatterns,
    fetchClinicalEvidence,
    fetchBiomarkerAnalysis,
    
    // Utilidades
    clearError,
    clearRecommendations
  };
}