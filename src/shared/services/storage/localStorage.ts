/**
 * Servicio para manejo de localStorage con tipado y validación
 * Proporciona métodos seguros para almacenar y recuperar datos
 */
export class LocalStorageService {
  /**
   * Almacena un valor en localStorage con validación
   */
  static setItem<T>(key: string, value: T): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error(`Error almacenando en localStorage (${key}):`, error);
      throw new Error(`No se pudo almacenar el valor para la clave: ${key}`);
    }
  }

  /**
   * Recupera un valor de localStorage con validación
   */
  static getItem<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue || null;
      }
      return JSON.parse(item) as T;
    } catch (error) {
      console.error(`Error recuperando de localStorage (${key}):`, error);
      return defaultValue || null;
    }
  }

  /**
   * Elimina un elemento de localStorage
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error eliminando de localStorage (${key}):`, error);
    }
  }

  /**
   * Limpia todo el localStorage
   */
  static clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error limpiando localStorage:', error);
    }
  }

  /**
   * Verifica si una clave existe en localStorage
   */
  static hasItem(key: string): boolean {
    return localStorage.getItem(key) !== null;
  }

  /**
   * Obtiene el tamaño del localStorage en bytes
   */
  static getSize(): number {
    let total = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        total += localStorage[key].length + key.length;
      }
    }
    return total;
  }

  /**
   * Obtiene todas las claves del localStorage
   */
  static getKeys(): string[] {
    return Object.keys(localStorage);
  }

  // Métodos específicos para la aplicación

  /**
   * Almacena las notas del usuario para un producto
   */
  static setProductNotes(ean: string, notes: string): void {
    const key = `product_notes_${ean}`;
    this.setItem(key, notes);
  }

  /**
   * Recupera las notas del usuario para un producto
   */
  static getProductNotes(ean: string): string | null {
    const key = `product_notes_${ean}`;
    return this.getItem(key, '');
  }

  /**
   * Almacena las preferencias del usuario
   */
  static setUserPreferences(preferences: Record<string, any>): void {
    this.setItem('user_preferences', preferences);
  }

  /**
   * Recupera las preferencias del usuario
   */
  static getUserPreferences(): Record<string, any> | null {
    return this.getItem('user_preferences', {});
  }

  /**
   * Almacena el estado de onboarding
   */
  static setOnboardingCompleted(completed: boolean): void {
    this.setItem('onboarding_completed', completed);
  }

  /**
   * Verifica si el onboarding está completado
   */
  static isOnboardingCompleted(): boolean {
    return this.getItem('onboarding_completed', false);
  }

  /**
   * Almacena la configuración de notificaciones
   */
  static setNotificationSettings(settings: {
    enabled: boolean;
    morning: boolean;
    midday: boolean;
    night: boolean;
  }): void {
    this.setItem('notification_settings', settings);
  }

  /**
   * Recupera la configuración de notificaciones
   */
  static getNotificationSettings(): {
    enabled: boolean;
    morning: boolean;
    midday: boolean;
    night: boolean;
  } {
    return this.getItem('notification_settings', {
      enabled: true,
      morning: true,
      midday: true,
      night: true
    });
  }

  /**
   * Almacena el historial de búsquedas
   */
  static addSearchHistory(searchTerm: string): void {
    const history = this.getSearchHistory();
    const newHistory = [searchTerm, ...history.filter(term => term !== searchTerm)].slice(0, 10);
    this.setItem('search_history', newHistory);
  }

  /**
   * Recupera el historial de búsquedas
   */
  static getSearchHistory(): string[] {
    return this.getItem('search_history', []);
  }

  /**
   * Limpia el historial de búsquedas
   */
  static clearSearchHistory(): void {
    this.removeItem('search_history');
  }
}
