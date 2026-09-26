import { QueryClient } from '@tanstack/react-query';

/**
 * Configuración centralizada de React Query
 * Define políticas de cache, retry y timeouts
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo de vida de los datos en cache (5 minutos)
      staleTime: 5 * 60 * 1000,
      // Tiempo antes de que los datos se consideren obsoletos (10 minutos)
      gcTime: 10 * 60 * 1000,
      // Reintentar automáticamente en caso de error
      retry: (failureCount, error) => {
        // No reintentar para errores 404 o 401
        if (error instanceof Error && 
            (error.message.includes('404') || error.message.includes('401'))) {
          return false;
        }
        // Máximo 3 reintentos
        return failureCount < 3;
      },
      // Tiempo entre reintentos (backoff exponencial)
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch automático cuando la ventana vuelve a tener foco
      refetchOnWindowFocus: true,
      // Refetch automático cuando se reconecta la red
      refetchOnReconnect: true,
      // No refetch automático en remount
      refetchOnMount: true,
    },
    mutations: {
      // Reintentar mutaciones en caso de error
      retry: (failureCount, error) => {
        // No reintentar para errores de validación
        if (error instanceof Error && 
            (error.message.includes('validation') || error.message.includes('400'))) {
          return false;
        }
        // Máximo 2 reintentos para mutaciones
        return failureCount < 2;
      },
    },
  },
});

/**
 * Claves de query para la aplicación
 * Centraliza todas las claves de cache para evitar duplicados
 */
export const QueryKeys = {
  // Usuario
  USER: ['user'] as const,
  USER_PROFILE: (userId: string) => ['user', userId, 'profile'] as const,
  
  // Categorías
  CATEGORIES: ['categories'] as const,
  MAIN_CATEGORIES: ['categories', 'main'] as const,
  SUBCATEGORIES: ['categories', 'sub'] as const,
  
  // Productos
  PRODUCTS: ['products'] as const,
  PRODUCT: (ean: string) => ['products', ean] as const,
  PRODUCT_SEARCH: (query: string) => ['products', 'search', query] as const,
  
  // Stack del usuario
  USER_STACK: (userId: string) => ['user', userId, 'stack'] as const,
  USER_STACK_ITEM: (userId: string, ean: string) => ['user', userId, 'stack', ean] as const,
  
  // Logs de suplementos
  SUPPLEMENT_LOGS: (userId: string, date?: string) => 
    ['user', userId, 'logs', ...(date ? [date] : [])] as const,
  
  // Dashboard
  HISTORICAL_DASHBOARD: (userId: string, date: string) => 
    ['user', userId, 'dashboard', date] as const,
  
  // Analytics
  ANALYTICS: (userId: string) => ['user', userId, 'analytics'] as const,
  ACHIEVEMENTS: (userId: string) => ['user', userId, 'achievements'] as const,
  
  // Protocolos
  PROTOCOLS: ['protocols'] as const,
  PROTOCOL: (id: string) => ['protocols', id] as const,
  
  // Enlaces de compra
  PURCHASE_LINKS: (ean: string) => ['products', ean, 'purchase-links'] as const,
  
  // Productos relacionados
  RELATED_PRODUCTS: (ean: string) => ['products', ean, 'related'] as const,
} as const;

/**
 * Utilidades para invalidar cache
 */
export const CacheUtils = {
  /**
   * Invalida todas las queries relacionadas con un usuario
   */
  invalidateUserQueries: (userId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['user', userId]
    });
  },

  /**
   * Invalida todas las queries de productos
   */
  invalidateProductQueries: () => {
    queryClient.invalidateQueries({
      queryKey: ['products']
    });
  },

  /**
   * Invalida queries de categorías
   */
  invalidateCategoryQueries: () => {
    queryClient.invalidateQueries({
      queryKey: ['categories']
    });
  },

  /**
   * Invalida queries del dashboard
   */
  invalidateDashboardQueries: (userId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['user', userId, 'dashboard']
    });
  },

  /**
   * Invalida queries de analytics
   */
  invalidateAnalyticsQueries: (userId: string) => {
    queryClient.invalidateQueries({
      queryKey: ['user', userId, 'analytics']
    });
  },

  /**
   * Limpia todo el cache
   */
  clearAllCache: () => {
    queryClient.clear();
  },

  /**
   * Obtiene datos del cache sin hacer fetch
   */
  getCachedData: <T>(queryKey: readonly unknown[]): T | undefined => {
    return queryClient.getQueryData<T>(queryKey);
  },

  /**
   * Establece datos en el cache
   */
  setCachedData: <T>(queryKey: readonly unknown[], data: T) => {
    queryClient.setQueryData(queryKey, data);
  },
};
