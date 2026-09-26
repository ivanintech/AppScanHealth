/**
 * Tipos globales de la aplicación
 * Define interfaces y tipos compartidos en toda la aplicación
 */

// Tipos de usuario
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  onboarding_completed: boolean;
  health_goals: string[];
  preferences: UserPreferences;
  subscription_status: 'free' | 'premium' | 'pro';
}

export interface UserPreferences {
  notifications: {
    enabled: boolean;
    morning: boolean;
    midday: boolean;
    night: boolean;
  };
  theme: 'light' | 'dark' | 'system';
  language: string;
  timezone: string;
}

// Tipos de suplementos
export interface Supplement {
  ean: string;
  product_name: string;
  brands_tags?: string[];
  categories_tags?: string[];
  ingredients_text?: string;
  additives_tags?: string[];
  allergens_tags?: string[];
  image_url?: string;
  calculated_score?: number;
  nutriscore_score?: string;
  nutriments?: Record<string, any>;
  labels_tags?: string[];
  packaging_tags?: string[];
  origins?: string;
  manufacturing_places?: string;
  stores?: string;
  countries?: string;
  created_t?: number;
  last_modified_t?: number;
}

export interface UserSupplement extends Supplement {
  preferred_time: 'morning' | 'midday' | 'night';
  added_at: string;
  taken_today: boolean;
}

// Tipos de categorías
export interface SupplementCategory {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  color?: string;
  parent_category_id?: string[] | string | null;
  sort_order?: number;
  health_goals?: string;
  considerations?: string;
  usage_instructions?: string;
  recommended_time?: string;
  impact?: string;
  side_effects?: string;
  interactions?: string;
  search_keywords?: string;
  target_audience?: string;
  level?: number;
}

// Tipos de stack
export interface UserStackItem {
  id: string;
  user_id: string;
  supplement_ean: string;
  preferred_time: 'morning' | 'midday' | 'night';
  created_at: string;
  supplement?: Supplement;
}

// Tipos de logs
export interface SupplementLog {
  id: string;
  user_id: string;
  supplement_ean: string;
  taken_at: string;
  quantity: number;
  supplement?: Supplement;
}

// Tipos de analytics
export interface DashboardKPIs {
  weekly_adherence: number;
  active_days_last_30: number;
  current_streak: number;
  total_supplements: number;
  wellness_score: number;
}

export interface ChartDataPoint {
  date: string;
  adherence: number;
  supplements_taken: number;
  wellness_score: number;
}

// Tipos de logros
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  requirements: Record<string, any>;
  unlocked: boolean;
  unlocked_at?: string;
  progress: number;
  max_progress: number;
}

// Tipos de protocolos - movidos a protocols.ts

// Tipos de API
export interface BaseApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Tipos de errores
export interface AppError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Tipos de notificaciones
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Tipos de configuración
export interface AppConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxStackSize: number;
    maxNotesLength: number;
    maxSearchHistory: number;
  };
}

// Tipos de estado
export interface LoadingState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
}

export interface AsyncState<T> extends LoadingState {
  data: T | null;
}

// Tipos de navegación
export interface NavigationItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: number;
  disabled?: boolean;
}

// Tipos de formularios
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'textarea';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => string | null;
  };
}

// Tipos de eventos
export interface AppEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: string;
  userId?: string;
}

// Tipos de cache
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

// Tipos de métricas
export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkRequests: number;
}

// Tipos de validación
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Tipos de filtros
export interface FilterOptions {
  category?: string;
  score?: {
    min: number;
    max: number;
  };
  brand?: string;
  price?: {
    min: number;
    max: number;
  };
  availability?: boolean;
}

// Tipos de búsqueda
export interface SearchOptions {
  query: string;
  filters?: FilterOptions;
  sortBy?: 'name' | 'score' | 'price' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
