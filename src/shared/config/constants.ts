/**
 * Constantes globales de la aplicación
 * Centraliza todas las constantes para facilitar el mantenimiento
 */

// URLs y endpoints
export const API_ENDPOINTS = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  OPENFOODFACTS_BASE: 'https://world.openfoodfacts.org/api/v0',
  EXAMINE_API: 'https://examine.com/api', // Simulado
} as const;

// Configuración de la aplicación
export const APP_CONFIG = {
  NAME: 'ScanHealth',
  VERSION: '1.1.0',
  DESCRIPTION: 'Tu Asistente Inteligente de Suplementación',
  AUTHOR: 'ScanHealth Team',
  SUPPORT_EMAIL: 'support@scanhealth.app',
} as const;

// Configuración de cache
export const CACHE_CONFIG = {
  STALE_TIME: 5 * 60 * 1000, // 5 minutos
  GC_TIME: 10 * 60 * 1000, // 10 minutos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

// Configuración de notificaciones
export const NOTIFICATION_CONFIG = {
  DEFAULT_DURATION: 5000, // 5 segundos
  MAX_NOTIFICATIONS: 5,
  POSITIONS: {
    TOP_LEFT: 'top-left',
    TOP_RIGHT: 'top-right',
    BOTTOM_LEFT: 'bottom-left',
    BOTTOM_RIGHT: 'bottom-right',
  },
} as const;

// Configuración de scoring
export const SCORING_CONFIG = {
  WEIGHTS: {
    EFFICACY: 0.3, // 30%
    SAFETY: 0.6,   // 60%
    EXTRA: 0.1,     // 10%
  },
  THRESHOLDS: {
    EXCELLENT: 90,
    VERY_GOOD: 80,
    GOOD: 70,
    REGULAR: 60,
    POOR: 0,
  },
} as const;

// Configuración de suplementos
export const SUPPLEMENT_CONFIG = {
  MAX_STACK_SIZE: 20,
  DEFAULT_QUANTITY: 1,
  TIMES: {
    MORNING: 'morning',
    MIDDAY: 'midday',
    NIGHT: 'night',
  },
} as const;

// Configuración de analytics
export const ANALYTICS_CONFIG = {
  TRACKING_ENABLED: true,
  EVENTS: {
    PRODUCT_SCANNED: 'product_scanned',
    SUPPLEMENT_ADDED: 'supplement_added',
    SUPPLEMENT_TAKEN: 'supplement_taken',
    ACHIEVEMENT_UNLOCKED: 'achievement_unlocked',
  },
} as const;

// Configuración de PWA
export const PWA_CONFIG = {
  CACHE_NAME: 'scanhealth-v1',
  CACHE_VERSION: '1.1.0',
  OFFLINE_PAGES: ['/offline'],
  BACKGROUND_SYNC: true,
} as const;

// Configuración de desarrollo
export const DEV_CONFIG = {
  DEBUG_MODE: import.meta.env.DEV,
  LOG_LEVEL: import.meta.env.DEV ? 'debug' : 'error',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
} as const;

// Configuración de validación
export const VALIDATION_CONFIG = {
  EAN_LENGTH: 13,
  MIN_PASSWORD_LENGTH: 8,
  MAX_NOTES_LENGTH: 1000,
  MAX_SEARCH_TERM_LENGTH: 100,
} as const;

// Configuración de UI
export const UI_CONFIG = {
  ANIMATION_DURATION: 300,
  DEBOUNCE_DELAY: 500,
  INFINITE_SCROLL_THRESHOLD: 100,
  MODAL_Z_INDEX: 1000,
  TOAST_Z_INDEX: 9999,
} as const;

// Configuración de red
export const NETWORK_CONFIG = {
  TIMEOUT: 10000, // 10 segundos
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  OFFLINE_CHECK_INTERVAL: 30000, // 30 segundos
} as const;
