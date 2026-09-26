import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Info, HelpCircle } from 'lucide-react';
import { Button } from '@/shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { AdvisoryScreen } from '@/features/onboarding/components/analysis/AdvisoryScreen';
import { UserProfile } from '@/shared/lib/recommendation/types';
import { supabase } from '@/shared/supabase/client';

export const AnalysisPage = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Buscar datos del onboarding en localStorage (temporales o normales)
          const temporaryData = localStorage.getItem('temporary_onboarding_data');
          const normalData = localStorage.getItem('onboarding_data');
          
          if (temporaryData) {
            console.log('📝 Cargando datos temporales del onboarding...');
            const parsedData = JSON.parse(temporaryData);
            setUserProfile(parsedData);
          } else if (normalData) {
            console.log('📝 Cargando datos normales del onboarding...');
            const parsedData = JSON.parse(normalData);
            setUserProfile(parsedData);
          } else {
            // Si no hay datos en localStorage, buscar en la base de datos
            console.log('🔍 Buscando datos del onboarding en la base de datos...');
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('checkup_results')
              .eq('id', user.id)
              .single();
              
            if (profileError) {
              console.error('Error obteniendo perfil de la BD:', profileError);
            } else if (profile?.checkup_results) {
              console.log('✅ Datos del onboarding encontrados en la base de datos');
              setUserProfile(profile.checkup_results as unknown as UserProfile);
            } else {
              console.log('❌ No se encontraron datos del onboarding');
            }
          }
        } else {
          console.log('❌ Usuario no autenticado');
        }
      } catch (error) {
        console.error('Error cargando perfil de usuario:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleBack = () => {
    navigate('/');
  };


  const handleReloadRandomData = () => {
    console.log('🔄 Generando datos aleatorios para testing...');
    
    // Generar datos aleatorios completos similares a los del onboarding
    const randomProfile: UserProfile = {
      id: 'random-user-' + Date.now(),
      age: Math.floor(Math.random() * 50) + 18, // 18-67 años
      gender: Math.random() > 0.5 ? 'male' : 'female',
      weight: Math.floor(Math.random() * 40) + 50, // 50-90 kg
      height: Math.floor(Math.random() * 30) + 150, // 150-180 cm
      activity_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
      health_goals: [['weight_loss', 'muscle_gain', 'general_health', 'energy', 'sleep'][Math.floor(Math.random() * 5)]],
      diet_type: ['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo'][Math.floor(Math.random() * 5)],
      health_conditions: Math.random() > 0.8 ? [['diabetes', 'hypertension', 'anemia'][Math.floor(Math.random() * 3)]] : [],
      allergies: Math.random() > 0.7 ? [['nuts', 'dairy', 'gluten'][Math.floor(Math.random() * 3)]] : [],
      current_stack: Math.random() > 0.7 ? [['1234567890123', '9876543210987'][Math.floor(Math.random() * 2)]] : [],
      // Agregar datos de onboarding completos
      onboarding_data: {
        stressLevel: ['low', 'medium', 'high', 'very_high'][Math.floor(Math.random() * 4)],
        sleepQuality: ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)],
        sunExposure: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        exerciseType: ['cardio', 'strength', 'yoga', 'sports', 'none'][Math.floor(Math.random() * 5)],
        exerciseHours: ['0-1', '1-3', '3-5', '5+'][Math.floor(Math.random() * 4)],
        fishConsumption: Math.floor(Math.random() * 4) + 1,
        meatConsumption: Math.floor(Math.random() * 4) + 1,
        vegetableConsumption: Math.floor(Math.random() * 4) + 1,
        nutsConsumption: Math.floor(Math.random() * 4) + 1,
        dairyConsumption: Math.floor(Math.random() * 4) + 1,
        fruitConsumption: Math.floor(Math.random() * 4) + 1,
        caffeineConsumption: ['none', 'light', 'moderate', 'heavy'][Math.floor(Math.random() * 4)],
        antibioticsUse: ['never', 'rarely', 'sometimes', 'frequently'][Math.floor(Math.random() * 4)],
        bowelMovements: ['irregular', 'regular', 'frequent'][Math.floor(Math.random() * 3)],
        smokingHabit: ['never', 'former', 'occasional', 'regular'][Math.floor(Math.random() * 4)],
        alcoholConsumption: ['none', 'light', 'moderate', 'heavy'][Math.floor(Math.random() * 4)]
      }
    };

    console.log('🎲 Datos aleatorios generados:', randomProfile);
    setUserProfile(randomProfile);
  };

  const handleHowItWorks = () => {
    navigate('/how-it-works');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando tu análisis personalizado...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md mx-4">
          <CardHeader>
            <CardTitle className="text-center text-destructive">No hay datos disponibles</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              No se encontraron datos del onboarding. Completa el proceso de onboarding para ver tu análisis personalizado.
            </p>
            <Button onClick={() => navigate('/onboarding')} className="w-full">
              Completar Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Botones fijos en el top - siempre visibles */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleHowItWorks}
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Cómo funciona
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('🔄 Reiniciando análisis...');
                  // Marcar que se quiere reiniciar el onboarding
                  localStorage.setItem('force_onboarding_restart', 'true');
                  // Limpiar datos existentes
                  localStorage.removeItem('onboarding_data');
                  localStorage.removeItem('onboarding_step');
                  localStorage.removeItem('temporary_onboarding_data');
                  // Navegar al onboarding
                  navigate('/onboarding');
                }}
                className="flex items-center gap-2 border-orange-300 text-orange-700 hover:bg-orange-50"
              >
                <RotateCcw className="w-4 h-4" />
                Reiniciar análisis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReloadRandomData}
                className="flex items-center gap-2 border-dashed border-gray-300 text-gray-600 hover:bg-gray-50"
              >
                <RotateCcw className="w-4 h-4" />
                🧪 Generar datos aleatorios
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="px-4 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <AdvisoryScreen
            onContinue={handleBack}
            onBack={handleBack}
            userProfile={userProfile}
            onReloadRandomData={handleReloadRandomData}
          />
        </motion.div>
      </main>
    </div>
  );
};
