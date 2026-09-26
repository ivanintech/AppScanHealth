import { supabase } from '@/shared/supabase/client';
import type { SupplementCategory } from '@/shared/hooks/useCategories';

/**
 * Servicio centralizado para operaciones de Supabase
 * Proporciona una capa de abstracción sobre el cliente de Supabase
 */
export class SupabaseService {
  /**
   * Obtiene todas las categorías con estrategias de fallback
   */
  static async getCategories(): Promise<SupplementCategory[]> {
    try {
      // Estrategia 1: Consulta directa
      const { data: directData, error: directError } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!directError && directData && directData.length > 0) {
        return directData;
      }

      // Estrategia 2: Función RPC
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_categories_hierarchy');

      if (!rpcError && rpcData && rpcData.length > 0) {
        return rpcData;
      }

      // Estrategia 3: Datos estáticos
      const response = await fetch('/data/categories.json');
      if (response.ok) {
        return await response.json();
      }

      throw new Error('No se pudieron cargar las categorías');
    } catch (error) {
      console.error('Error en SupabaseService.getCategories:', error);
      throw error;
    }
  }

  /**
   * Obtiene productos por EAN
   */
  static async getProductByEAN(ean: string) {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('ean', ean)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo producto por EAN:', error);
      throw error;
    }
  }

  /**
   * Obtiene el stack de suplementos del usuario
   */
  static async getUserStack(userId: string) {
    try {
      const { data, error } = await supabase
        .from('user_supplement_stack')
        .select(`
          *,
          products:supplement_ean (
            ean,
            product_name,
            brands_tags,
            image_url,
            categories_tags,
            calculated_score
          )
        `)
        .eq('user_id', userId);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo stack del usuario:', error);
      throw error;
    }
  }

  /**
   * Añade suplemento al stack del usuario
   */
  static async addToUserStack(userId: string, supplementEan: string, preferredTime: string) {
    try {
      // Validar que el producto existe
      const { data: productExists } = await supabase
        .from('products')
        .select('ean')
        .eq('ean', supplementEan)
        .maybeSingle();

      if (!productExists) {
        throw new Error(`Producto con EAN ${supplementEan} no existe`);
      }

      const { data, error } = await supabase
        .from('user_supplement_stack')
        .insert({
          user_id: userId,
          supplement_ean: supplementEan,
          preferred_time: preferredTime
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error añadiendo al stack:', error);
      throw error;
    }
  }

  /**
   * Elimina suplemento del stack del usuario
   */
  static async removeFromUserStack(userId: string, supplementEan: string) {
    try {
      const { error } = await supabase
        .from('user_supplement_stack')
        .delete()
        .eq('user_id', userId)
        .eq('supplement_ean', supplementEan);

      if (error) throw error;
    } catch (error) {
      console.error('Error eliminando del stack:', error);
      throw error;
    }
  }

  /**
   * Obtiene logs de suplementos del usuario
   */
  static async getSupplementLogs(userId: string, date?: Date) {
    try {
      let query = supabase
        .from('supplement_logs')
        .select(`
          *,
          products:supplement_ean (
            ean,
            product_name,
            brands_tags,
            image_url
          )
        `)
        .eq('user_id', userId);

      if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        query = query
          .gte('taken_at', startOfDay.toISOString())
          .lte('taken_at', endOfDay.toISOString());
      }

      const { data, error } = await query.order('taken_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo logs de suplementos:', error);
      throw error;
    }
  }

  /**
   * Registra la toma de un suplemento
   */
  static async logSupplementIntake(userId: string, supplementEan: string, quantity: number = 1) {
    try {
      const { data, error } = await supabase
        .from('supplement_logs')
        .insert({
          user_id: userId,
          supplement_ean: supplementEan,
          quantity,
          taken_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error registrando toma de suplemento:', error);
      throw error;
    }
  }

  /**
   * Obtiene datos del dashboard histórico
   */
  static async getHistoricalDashboard(userId: string, selectedDate: Date) {
    try {
      const { data, error } = await supabase
        .rpc('get_historical_dashboard', {
          user_id: userId,
          selected_date: selectedDate.toISOString().split('T')[0]
        });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error obteniendo dashboard histórico:', error);
      throw error;
    }
  }
}
