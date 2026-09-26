/**
 * Configuración centralizada de rutas
 * Define todas las rutas de la aplicación en un solo lugar
 */

export const ROUTES = {
  // Rutas principales
  HOME: '/',
  LANDING: '/landing',
  AUTH: '/auth',
  ONBOARDING: '/onboarding',
  
  // Dashboard
  DASHBOARD: '/dashboard',
  HOME_PAGE: '/home',
  
  // Suplementos
  SUPPLEMENTS: '/supplements',
  SUPPLEMENT_DETAIL: (ean: string) => `/supplements/${ean}`,
  
  // Protocolos
  PROTOCOLS: '/protocols',
  PROTOCOL_DETAIL: (id: string) => `/protocol/${id}`,
  
  // Stack
  STACK: '/stack',
  STACK_ANALYSIS: '/stack-analysis',
  
  // Explorar
  EXPLORE: '/explore',
  
  // Perfil
  PROFILE: '/profile',
  SETTINGS: '/settings',
  
  // Logros
  ACHIEVEMENTS: '/achievements',
  
  // Programar
  PROGRAMAR: '/programar',
  
  // Aprender
  LEARN: '/learn',
  
  // Cómo funciona
  HOW_IT_WORKS: '/how-it-works',
  
  // Error
  NOT_FOUND: '/404',
} as const;

/**
 * Configuración de navegación
 */
export const NAVIGATION_CONFIG = {
  // Tabs principales
  MAIN_TABS: [
    { id: 'inicio', label: 'Inicio', route: ROUTES.HOME_PAGE, icon: 'Home' },
    { id: 'explore', label: 'Explorar', route: ROUTES.EXPLORE, icon: 'Search' },
    { id: 'stack', label: 'Mi Stack', route: ROUTES.STACK, icon: 'Package' },
    { id: 'you', label: 'Tú', route: ROUTES.PROFILE, icon: 'User' },
  ],
  
  // Rutas que requieren autenticación
  PROTECTED_ROUTES: [
    ROUTES.HOME_PAGE,
    ROUTES.STACK,
    ROUTES.PROFILE,
    ROUTES.SETTINGS,
    ROUTES.ACHIEVEMENTS,
    ROUTES.PROGRAMAR,
  ],
  
  // Rutas públicas
  PUBLIC_ROUTES: [
    ROUTES.LANDING,
    ROUTES.AUTH,
    ROUTES.ONBOARDING,
  ],
  
  // Rutas que no requieren navegación
  NO_NAVIGATION_ROUTES: [
    ROUTES.AUTH,
    ROUTES.ONBOARDING,
    ROUTES.NOT_FOUND,
  ],
} as const;

/**
 * Configuración de breadcrumbs
 */
export const BREADCRUMB_CONFIG = {
  [ROUTES.HOME_PAGE]: [{ label: 'Inicio', href: ROUTES.HOME_PAGE }],
  [ROUTES.EXPLORE]: [{ label: 'Explorar', href: ROUTES.EXPLORE }],
  [ROUTES.STACK]: [{ label: 'Mi Stack', href: ROUTES.STACK }],
  [ROUTES.PROFILE]: [{ label: 'Perfil', href: ROUTES.PROFILE }],
  [ROUTES.SETTINGS]: [
    { label: 'Perfil', href: ROUTES.PROFILE },
    { label: 'Configuración', href: ROUTES.SETTINGS }
  ],
  [ROUTES.ACHIEVEMENTS]: [
    { label: 'Perfil', href: ROUTES.PROFILE },
    { label: 'Logros', href: ROUTES.ACHIEVEMENTS }
  ],
} as const;

/**
 * Utilidades para rutas
 */
export const RouteUtils = {
  /**
   * Verifica si una ruta es protegida
   */
  isProtectedRoute: (pathname: string): boolean => {
    return NAVIGATION_CONFIG.PROTECTED_ROUTES.some(route => 
      pathname.startsWith(route)
    );
  },

  /**
   * Verifica si una ruta es pública
   */
  isPublicRoute: (pathname: string): boolean => {
    return NAVIGATION_CONFIG.PUBLIC_ROUTES.some(route => 
      pathname.startsWith(route)
    );
  },

  /**
   * Verifica si una ruta no debe mostrar navegación
   */
  shouldHideNavigation: (pathname: string): boolean => {
    return NAVIGATION_CONFIG.NO_NAVIGATION_ROUTES.some(route => 
      pathname.startsWith(route)
    );
  },

  /**
   * Obtiene el breadcrumb para una ruta
   */
  getBreadcrumb: (pathname: string) => {
    return BREADCRUMB_CONFIG[pathname as keyof typeof BREADCRUMB_CONFIG] || [];
  },

  /**
   * Genera una ruta con parámetros
   */
  generateRoute: (route: string, params: Record<string, string>): string => {
    let generatedRoute = route;
    Object.entries(params).forEach(([key, value]) => {
      generatedRoute = generatedRoute.replace(`:${key}`, value);
    });
    return generatedRoute;
  },
};
