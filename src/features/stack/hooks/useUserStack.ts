import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';
import { useToast } from '@/shared/hooks/use-toast';

/**
 * Define un tipo de dato detallado para los items del stack del usuario.
 * Este será el tipo estándar a través de toda la aplicación.
 */
export interface UserStackItem {
  supplement_ean: string;
  preferred_time: 'morning' | 'midday' | 'night';
  created_at: string; // Se mantiene para poder filtrar el stack en fechas pasadas.
  supplements: {
    ean: string;
    product_name?: string;
    brands_tags?: string;
    image_url?: string;
    categories_tags?: string;
    calculated_score?: number;
  } | null;
}

/**
 * Función asíncrona encargada de obtener el stack de suplementos del usuario desde Supabase.
 * Es la única función que hará esta petición a la base de datos.
 */
const fetchUserStack = async (): Promise<UserStackItem[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Si el usuario no está logueado, devuelve un array vacío en lugar de un error.
    // Esto permite que partes de la app funcionen sin necesidad de login.
    return [];
  }

  const { data, error } = await supabase
    .from('user_supplement_stack')
    .select(`
      supplement_ean,
      preferred_time,
      created_at,
      products (
        ean,
        product_name,
        brands_tags,
        image_url,
        categories_tags,
        calculated_score
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching user stack:', error);
    throw new Error('No se pudo cargar tu stack de suplementos.');
  }
  
  // Mapear la respuesta para que coincida con la interfaz esperada
  const mappedData = (data || []).map(item => ({
    supplement_ean: item.supplement_ean,
    preferred_time: item.preferred_time as 'morning' | 'midday' | 'night',
    created_at: item.created_at,
    supplements: item.products // Mapear products a supplements para mantener compatibilidad
  }));
  
  return mappedData;
};

/**
 * Hook personalizado `useUserStack`.
 * Este es el punto de entrada para cualquier componente que necesite acceder
 * al stack de suplementos del usuario. Utiliza React Query para cachear los datos,
 * mantenerlos actualizados y compartirlos eficientemente.
 */
export const useUserStack = () => {
  const { toast } = useToast();

  return useQuery<UserStackItem[], Error>({
    queryKey: ['userStack'], // Clave única para la caché de React Query.
    queryFn: fetchUserStack,
    staleTime: 5 * 60 * 1000, // 5 minutos - datos frescos por más tiempo
    refetchOnWindowFocus: false, // No refetch automático para mejor UX
    refetchOnMount: false, // No refetch al montar si hay datos en caché
    retry: 1, // Solo reintentar una vez
    retryDelay: 1000, // 1 segundo entre reintentos
  });
};
