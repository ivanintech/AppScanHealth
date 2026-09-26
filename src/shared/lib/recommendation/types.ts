// Tipos para el sistema de recomendación de suplementos

export interface UserProfile {
  id: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  weight: number;
  height: number;
  health_goals: string[];
  checkup_results?: CheckupResults;
  onboarding_data?: OnboardingData;
  current_stack?: string[]; // EANs de suplementos actuales
  activity_level: 'low' | 'medium' | 'high';
  diet_type: string;
  health_conditions: string[];
  allergies: string[];
}

export interface CheckupResults {
  // Biomarcadores básicos
  vitamin_d?: number;
  b12?: number;
  iron?: number;
  ferritin?: number;
  magnesium?: number;
  zinc?: number;
  calcium?: number;
  
  // Parámetros de salud
  blood_pressure?: {
    systolic: number;
    diastolic: number;
  };
  cholesterol?: {
    total: number;
    hdl: number;
    ldl: number;
  };
  glucose?: number;
  hba1c?: number;
  
  // Parámetros de estilo de vida
  sleep_quality?: number; // 1-10
  stress_level?: number; // 1-10
  energy_level?: number; // 1-10
  
  // Fecha del último checkup
  last_checkup?: string;
}

export interface OnboardingData {
  // Datos del onboarding actual
  stressLevel: string;
  sleepQuality: string;
  sunExposure: string;
  exerciseType: string;
  exerciseHours: string;
  
  // Consumo alimentario
  fishConsumption: number;
  meatConsumption: number;
  vegetableConsumption: number;
  nutsConsumption: number;
  dairyConsumption: number;
  fruitConsumption: number;
  caffeineConsumption: string;
  
  // Hábitos de salud
  antibioticsUse: string;
  bowelMovements: string;
  smokingHabit: string;
  alcoholConsumption: string;
}

export interface Supplement {
  ean: string;
  product_name: string;
  category_id: string;
  subcategory_id?: string;
  brands_tags: string[];
  categories_tags: string[];
  ingredients_text: string;
  nutriments: Record<string, number>;
  calculated_score: number;
  image_url?: string;
}

export interface Deficiency {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  current_value?: number;
  normal_range: {
    min: number;
    max: number;
  };
  symptoms: string[];
  recommended_supplements: string[];
  explanation: string;
  priority: number;
}

export interface Recommendation {
  supplement_ean: string;
  supplement_name: string;
  category: string;
  score: number;
  confidence: number;
  reasons: RecommendationReason[];
  benefits: string[];
  dosage_recommendation?: string;
  timing_recommendation?: string;
  interactions_warnings?: string[];
  contraindications?: string[];
}

export interface RecommendationReason {
  type: 'deficiency' | 'goal_alignment' | 'similar_users' | 'content_match' | 'lifestyle' | 'biomarker' | 'clinical_evidence' | 'nhanes_pattern' | 'product_intelligence';
  description: string;
  weight: number;
  evidence?: string;
}

export interface SimilarUser {
  user_id: string;
  similarity_score: number;
  shared_goals: string[];
  shared_conditions: string[];
  successful_supplements: string[];
}

export interface ProductAnalysis {
  product: Supplement;
  compatibility_score: number;
  user_benefits: string[];
  warnings: string[];
  interactions: InteractionWarning[];
  recommendations: string[];
  explanation: string;
}

export interface InteractionWarning {
  type: 'positive' | 'negative' | 'caution' | 'timing';
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendation: string;
}

export interface RecommendationEngineConfig {
  weights: {
    deficiency_analysis: number;
    collaborative_filtering: number;
    content_based: number;
    lifestyle_matching: number;
    biomarker_analysis?: number;
    clinical_evidence?: number;
    nhanes_patterns?: number;
    product_intelligence?: number;
    ml_recommendations?: number; // Nuevo: peso para recomendaciones de ML
  };
  thresholds: {
    min_confidence: number;
    min_similarity: number;
    max_recommendations: number;
  };
}

export interface RecommendationResult {
  recommendations: Recommendation[];
  deficiencies: Deficiency[];
  similar_users: SimilarUser[];
  biomarker_analysis?: any;
  clinical_evidence?: any[];
  explanation: string;
  confidence_overall: number;
  confidence_score: number; // Alias para compatibilidad
  last_updated: string;
  ai_metadata?: { // Nuevo: metadatos de IA
    models_used: string[];
    model_versions: string;
    prediction_confidence: number;
    traditional_confidence: number;
    hybrid_confidence: number;
  };
}

export interface ProductAnalysisResult {
  product_ean: string;
  product_name: string;
  compatibility_score: number;
  is_suitable: boolean;
  benefits: string[];
  interactions: Array<{
    supplement_ean: string;
    severity: string;
    description: string;
    recommendation?: string;
  }>;
  warnings: string[];
  recommendations?: {
    dosage: string;
    timing: string;
    duration: string;
  };
  ai_metadata?: { // Nuevo: metadatos de IA para análisis de productos
    models_used: string[];
    prediction_confidence: number;
    risk_assessment: string;
  };
}

export interface FeedbackData {
  recommendation_id?: string;
  type: 'positive' | 'negative' | 'neutral' | 'rating' | 'feedback';
  rating?: number;
  comments?: string;
}
