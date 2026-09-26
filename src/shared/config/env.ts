/**
 * Configuración de variables de entorno
 * Centraliza y valida todas las variables de entorno
 */

// Validación de variables de entorno requeridas
const requiredEnvVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
} as const;

// Verificar que las variables requeridas estén definidas
Object.entries(requiredEnvVars).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Variable de entorno requerida no definida: ${key}`);
  }
});

/**
 * Configuración de entorno
 */
export const ENV_CONFIG = {
  // Entorno actual
  NODE_ENV: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD,
  
  // Supabase
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL!,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY!,
  
  // URLs de la aplicación
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:8080',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  
  // Configuración de desarrollo
  DEBUG: import.meta.env.VITE_DEBUG === 'true',
  MOCK_API: import.meta.env.VITE_MOCK_API === 'true',
  
  // Configuración de analytics
  ANALYTICS_ENABLED: import.meta.env.VITE_ANALYTICS_ENABLED !== 'false',
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID,
  
  // Configuración de notificaciones
  NOTIFICATIONS_ENABLED: import.meta.env.VITE_NOTIFICATIONS_ENABLED !== 'false',
  VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  
  // Configuración de PWA
  PWA_ENABLED: import.meta.env.VITE_PWA_ENABLED !== 'false',
  PWA_OFFLINE_ENABLED: import.meta.env.VITE_PWA_OFFLINE_ENABLED !== 'false',
  
  // Configuración de testing
  TESTING: import.meta.env.VITE_TESTING === 'true',
  TEST_USER_ID: import.meta.env.VITE_TEST_USER_ID,
} as const;

/**
 * Configuración específica por entorno
 */
export const getEnvironmentConfig = () => {
  if (ENV_CONFIG.DEV) {
    return {
      API_TIMEOUT: 30000, // 30 segundos en desarrollo
      LOG_LEVEL: 'debug',
      ENABLE_DEVTOOLS: true,
      MOCK_DELAYS: true,
    };
  }
  
  if (ENV_CONFIG.PROD) {
    return {
      API_TIMEOUT: 10000, // 10 segundos en producción
      LOG_LEVEL: 'error',
      ENABLE_DEVTOOLS: false,
      MOCK_DELAYS: false,
    };
  }
  
  // Configuración por defecto
  return {
    API_TIMEOUT: 15000, // 15 segundos
    LOG_LEVEL: 'info',
    ENABLE_DEVTOOLS: false,
    MOCK_DELAYS: false,
  };
};

/**
 * Utilidades de entorno
 */
export const EnvUtils = {
  /**
   * Verifica si estamos en desarrollo
   */
  isDevelopment: (): boolean => ENV_CONFIG.DEV,
  
  /**
   * Verifica si estamos en producción
   */
  isProduction: (): boolean => ENV_CONFIG.PROD,
  
  /**
   * Verifica si el testing está habilitado
   */
  isTesting: (): boolean => ENV_CONFIG.TESTING,
  
  /**
   * Obtiene la URL base de la API
   */
  getApiUrl: (): string => ENV_CONFIG.API_URL,
  
  /**
   * Obtiene la URL base de la aplicación
   */
  getAppUrl: (): string => ENV_CONFIG.APP_URL,
  
  /**
   * Verifica si una característica está habilitada
   */
  isFeatureEnabled: (feature: keyof typeof ENV_CONFIG): boolean => {
    const value = ENV_CONFIG[feature];
    return typeof value === 'boolean' ? value : Boolean(value);
  },
  
  /**
   * Obtiene una variable de entorno con valor por defecto
   */
  getEnvVar: <T>(key: string, defaultValue: T): T => {
    const value = import.meta.env[key];
    return value !== undefined ? value as T : defaultValue;
  },
};
