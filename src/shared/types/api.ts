/**
 * Tipos específicos para APIs y servicios
 * Define interfaces para comunicación con servicios externos
 */

// Tipos de OpenFoodFacts API
export interface OpenFoodFactsProduct {
  code: string;
  product_name: string;
  product_name_es?: string;
  brands_tags?: string[];
  categories_tags?: string[];
  ingredients_text?: string;
  ingredients_text_es?: string;
  additives_tags?: string[];
  allergens_tags?: string[];
  image_url?: string;
  image_front_url?: string;
  nutriments?: Record<string, any>;
  nutriscore_grade?: string;
  nova_group?: number;
  labels_tags?: string[];
  packaging_tags?: string[];
  origins?: string;
  manufacturing_places?: string;
  stores?: string;
  countries?: string;
  created_t?: number;
  last_modified_t?: number;
  warnings?: string[];
  health_claims?: string[];
}

export interface OpenFoodFactsSearchResponse {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

// Tipos de Supabase API
export interface SupabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: SupabaseUser;
}

// Tipos de Examine.com API (simulado)
export interface ExamineSupplement {
  name: string;
  scientific_name: string;
  category: string;
  efficacy: {
    score: number;
    evidence_level: 'A' | 'B' | 'C' | 'D' | 'F';
    studies_count: number;
  };
  safety: {
    score: number;
    side_effects: string[];
    interactions: string[];
    contraindications: string[];
  };
  dosage: {
    recommended: string;
    range: {
      min: number;
      max: number;
      unit: string;
    };
  };
  timing: {
    best_time: 'morning' | 'midday' | 'night' | 'anytime';
    with_food: boolean;
    with_water: boolean;
  };
  interactions: {
    with_supplements: string[];
    with_medications: string[];
    with_food: string[];
  };
  benefits: string[];
  side_effects: string[];
  research_summary: string;
  last_updated: string;
}

// Tipos de respuestas de API
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface ApiSuccess<T> {
  data: T;
  success: true;
  message?: string;
  timestamp: string;
}

export type ApiResponse<T> = ApiSuccess<T> | { success: false; error: ApiError };

// Tipos de paginación
export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Tipos de autenticación
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: SupabaseUser;
  session: SupabaseSession;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface RegisterResponse {
  user: SupabaseUser;
  session: SupabaseSession;
}

// Tipos de productos
export interface ProductSearchRequest {
  query: string;
  filters?: {
    category?: string;
    brand?: string;
    score_min?: number;
    score_max?: number;
  };
  pagination?: PaginationParams;
}

export interface ProductSearchResponse {
  products: any[];
  total: number;
  suggestions: string[];
  filters_applied: Record<string, any>;
}

// Tipos de stack de usuario
export interface AddToStackRequest {
  supplement_ean: string;
  preferred_time: 'morning' | 'midday' | 'night';
}

export interface AddToStackResponse {
  id: string;
  user_id: string;
  supplement_ean: string;
  preferred_time: string;
  created_at: string;
}

export interface RemoveFromStackRequest {
  supplement_ean: string;
}

// Tipos de logs de suplementos
export interface LogSupplementRequest {
  supplement_ean: string;
  quantity: number;
  taken_at?: string;
}

export interface LogSupplementResponse {
  id: string;
  user_id: string;
  supplement_ean: string;
  quantity: number;
  taken_at: string;
}

// Tipos de analytics
export interface AnalyticsRequest {
  user_id: string;
  date_range: {
    start: string;
    end: string;
  };
  metrics: string[];
}

export interface AnalyticsResponse {
  user_id: string;
  date_range: {
    start: string;
    end: string;
  };
  metrics: Record<string, any>;
  charts: {
    adherence: Array<{ date: string; value: number }>;
    wellness_score: Array<{ date: string; value: number }>;
    supplements_taken: Array<{ date: string; value: number }>;
  };
}

// Tipos de notificaciones push
export interface PushNotificationRequest {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  scheduled_for?: string;
}

export interface PushNotificationResponse {
  id: string;
  status: 'sent' | 'scheduled' | 'failed';
  sent_at?: string;
  error?: string;
}

// Tipos de configuración de usuario
export interface UpdateUserPreferencesRequest {
  preferences: {
    notifications?: {
      enabled: boolean;
      morning: boolean;
      midday: boolean;
      night: boolean;
    };
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
  };
}

export interface UpdateUserPreferencesResponse {
  preferences: Record<string, any>;
  updated_at: string;
}

// Tipos de validación de EAN
export interface EANValidationRequest {
  ean: string;
}

export interface EANValidationResponse {
  ean: string;
  valid: boolean;
  exists_in_off: boolean;
  exists_in_db: boolean;
  product_info?: {
    name: string;
    brand: string;
    image_url?: string;
  };
}

// Tipos de recomendaciones
export interface RecommendationRequest {
  user_id: string;
  context: 'stack' | 'health_goal' | 'category';
  filters?: {
    category?: string;
    health_goal?: string;
    exclude_eans?: string[];
  };
}

export interface RecommendationResponse {
  recommendations: Array<{
    ean: string;
    name: string;
    score: number;
    reason: string;
    category: string;
    image_url?: string;
  }>;
  total: number;
}
