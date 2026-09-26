import { useEffect } from 'react';
import { supabase } from '../supabase/client';

/**
 * Hook para manejar la migración de datos del onboarding
 * cuando un usuario se autentica después de completar el onboarding
 */
export const useOnboardingDataMigration = () => {
  useEffect(() => {
    const migrateTemporaryData = async () => {
      try {
        // Verificar si hay datos temporales guardados
        const temporaryData = localStorage.getItem('temporary_onboarding_data');
        if (!temporaryData) return;

        // Verificar si el usuario está autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('🔄 Migrando datos temporales del onboarding...');

        // Parsear los datos temporales
        const onboardingData = JSON.parse(temporaryData);
        
        // Guardar los datos en la base de datos del usuario autenticado
        const { error } = await supabase
          .from('profiles')
          .update({
            checkup_results: onboardingData,
            onboarding_completed: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error migrando datos del onboarding:', error);
          return;
        }

        // Limpiar datos temporales
        localStorage.removeItem('temporary_onboarding_data');
        console.log('✅ Datos del onboarding migrados exitosamente');

        // Mostrar notificación de éxito
        console.log('🎉 Tus datos del onboarding han sido guardados permanentemente');
        
        // Recargar la página para actualizar el estado de la aplicación
        window.location.reload();
        
      } catch (error) {
        console.error('Error en migración de datos:', error);
      }
    };

    // Ejecutar migración cuando el componente se monta
    migrateTemporaryData();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        migrateTemporaryData();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);
};
