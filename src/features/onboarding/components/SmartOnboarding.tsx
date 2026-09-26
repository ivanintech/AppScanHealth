import React, { useState, useEffect } from "react";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Label } from "@/shared/components/ui/label";
import { Progress } from "@/shared/components/ui/progress";
// import { Slider } from "@/components/ui/slider"; // Not available
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/shared/supabase/client";
import { toast } from "sonner";
import { AnalysisScreen, ResultsReadyScreen, AdvisoryScreen } from "./analysis";
import {
  User,
  Target,
  DollarSign,
  Clock,
  HeartPulse,
  TrendingUp,
  AlertTriangle,
  FlaskConical,
  Heart,
  Brain,
  Shield,
  Zap as ZapIcon,
  Moon,
  PlusCircle,
  Search,
  X,
  Sparkles,
  Award,
  CheckCircle,
  ArrowLeft,
  Pill,
  BarChart3,
  Users,
  Star,
  BookOpen,
  Lightbulb,
  Scale,
  Sun,
  Dumbbell,
  Coffee,
  Utensils,
  Cigarette,
  Wine,
  Stethoscope,
  Smile,
  Bell,
  Gift,
  Activity,
  Leaf,
  Apple,
  Wheat,
  Milk,
  Beef,
  Fish,
  Egg,
  MapPin,
  Briefcase
} from "lucide-react";

interface Supplement {
  ean: string;
  name: string;
  brand: string;
  image_url: string;
}

interface OnboardingData {
  // Datos personales principales
  name: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  howHeard: string[];
  dailySupplements: string;
  monthlySpending: string;
  healthGoals: string[];
  
  // Datos secundarios
  stressLevel: string;
  sleepQuality: string;
  sunExposure: string;
  exerciseType: string;
  exerciseHours: string;
  
  // Alimentación detallada
  fishConsumption: number;
  meatConsumption: number;
  eggConsumption: number;
  vegetableConsumption: number;
  nutsConsumption: number;
  breadConsumption: string;
  dairyConsumption: number;
  fruitConsumption: number;
  caffeineConsumption: string;
  legumeConsumption: number;
  potatoConsumption: number;
  wholegrainConsumption: number;
  dietType: string;
  
  // Salud
  antibioticsUse: string;
  bowelMovements: string;
  smokingHabit: string;
  alcoholConsumption: string;
  
  // Preguntas nutricionales adicionales
  hasBloodTest: boolean;
  bloodTestDate: string;
  bloodTestResults: string[];
  symptoms: string[];
  otherSymptoms: string;
  medicalConditions: string[];
  medications: string[];
  sleepSchedule: {
    bedtime: string;
    wakeTime: string;
  };
  workType: string;
  environment: string;
  allergies: string[];
  supplementPreferences: string[];
  currentSupplements: string[];
  
  // Nuevas preguntas avanzadas
  recentSurgeries: string;
  heartMedications: string;
  intestinalIssues: string;
  familyHistory: string[];
  familyDeficiencies: string;
  shiftWork: string;
  pollutantExposure: string;
  intermittentFasting: string;
  
  // Extra
  wantsNotifications: boolean;
  referralCode: string;
  initialStack: Supplement[];
}

interface OnboardingState {
  currentStep: number;
  isVisible: boolean;
  isLoading: boolean;
  showAnalysis: boolean;
  showResultsReady: boolean;
  showAdvisory: boolean;
  data: OnboardingData;
}

interface SmartOnboardingProps {
  onComplete?: () => void;
  onDismiss?: () => void;
}

export const SmartOnboarding = ({ onComplete, onDismiss }: SmartOnboardingProps = {}) => {
  console.log("🎬 SmartOnboarding component mounted");
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    isVisible: false,
    isLoading: true,
    showAnalysis: false,
    showResultsReady: false,
    showAdvisory: false,
    data: {
      name: "",
      age: "",
      gender: "",
      weight: "",
      height: "",
      howHeard: [],
      dailySupplements: "",
      monthlySpending: "",
      healthGoals: [],
      stressLevel: "",
      sleepQuality: "",
      sunExposure: "",
      exerciseType: "",
      exerciseHours: "",
      fishConsumption: 1,
      meatConsumption: 3,
      eggConsumption: 0,
      vegetableConsumption: 0,
      nutsConsumption: 0,
      breadConsumption: "",
      dairyConsumption: 0,
      fruitConsumption: 0,
      caffeineConsumption: "",
      legumeConsumption: 0,
      potatoConsumption: 0,
      wholegrainConsumption: 0,
      dietType: "",
      antibioticsUse: "",
      bowelMovements: "",
      smokingHabit: "",
      alcoholConsumption: "",
      // Preguntas nutricionales adicionales
      hasBloodTest: false,
      bloodTestDate: '',
      bloodTestResults: [],
      symptoms: [],
      otherSymptoms: '',
      medicalConditions: [],
      medications: [],
      sleepSchedule: { bedtime: '', wakeTime: '' },
      workType: '',
      environment: '',
      allergies: [],
      supplementPreferences: [],
      currentSupplements: [],
      
      // Nuevas preguntas avanzadas
      recentSurgeries: '',
      heartMedications: '',
      intestinalIssues: '',
      familyHistory: [],
      familyDeficiencies: '',
      shiftWork: '',
      pollutantExposure: '',
      intermittentFasting: '',
      
      // Extra
      wantsNotifications: false,
      referralCode: "",
      initialStack: []
    }
  });

  useEffect(() => {
    console.log("🎯 SmartOnboarding useEffect triggered");
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    console.log("🔍 checkOnboardingStatus called");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("👤 User status:", user ? "authenticated" : "not authenticated");

      if (!user) {
        console.log("✅ No user found, showing onboarding");
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: false
        }));
        return;
      }

      // Verificar si hay datos temporales del onboarding
      const temporaryData = localStorage.getItem('temporary_onboarding_data');
      if (temporaryData) {
        console.log('📝 Datos temporales encontrados, esperando migración...');
        // Mostrar onboarding para permitir reinicio
        setState(prev => ({ 
          ...prev, 
          isVisible: true,
          isLoading: false 
        }));
        return;
      }

      // Verificar si se quiere reiniciar el onboarding (parámetro de URL o localStorage)
      const urlParams = new URLSearchParams(window.location.search);
      const forceRestart = urlParams.get('restart') === 'true' || localStorage.getItem('force_onboarding_restart') === 'true';
      
      if (forceRestart) {
        console.log('🔄 Reiniciando onboarding forzadamente...');
        // Limpiar el flag de reinicio
        localStorage.removeItem('force_onboarding_restart');
        // Limpiar datos existentes
        localStorage.removeItem('onboarding_data');
        localStorage.removeItem('onboarding_step');
        localStorage.removeItem('temporary_onboarding_data');
        
        // Actualizar el estado en la base de datos para permitir reinicio
        if (user) {
          try {
            await supabase
              .from('profiles')
              .update({ onboarding_completed: false })
              .eq('id', user.id);
            console.log('✅ Estado de onboarding actualizado en la base de datos');
          } catch (error) {
            console.error('❌ Error actualizando estado de onboarding:', error);
          }
        }
        
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: false
        }));
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, checkup_results')
        .eq('id', user.id)
        .single();

      console.log("📊 Profile data:", profile);
      console.log("📊 onboarding_completed:", profile?.onboarding_completed);
      console.log("📊 checkup_results:", profile?.checkup_results ? 'present' : 'missing');

      // Solo redirigir si el onboarding está explícitamente completado
      // NO redirigir si solo tiene datos (permite reiniciar el onboarding)
      if (profile?.onboarding_completed) {
        console.log("✅ Onboarding already completed, redirecting to app");
        // Si ya completó el onboarding, ir a la app
        if (onComplete) {
          onComplete();
        } else {
          window.location.href = '/';
        }
        return;
      }

      if (!profile?.onboarding_completed) {
        console.log("✅ Onboarding not completed, showing onboarding");
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: false
        }));
      } else {
        console.log("⚠️ Onboarding already completed, but allowing restart");
        // Permitir reiniciar el onboarding incluso si ya está completado
        setState(prev => ({
          ...prev,
          isVisible: true,
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setState(prev => ({
        ...prev,
        isVisible: true,
        isLoading: false
      }));
    }
  };

  const updateData = (field: keyof OnboardingData, value: any) => {
    console.log('updateData called with field:', field, 'value:', value);
    
    if (field === 'age' && typeof value === 'string') {
      const age = parseInt(value, 10);
      if (age < 0 || age > 105) return;
      }
    if ((field === 'weight' || field === 'height') && typeof value === 'string') {
      const num = parseInt(value, 10);
      if (num < 0 || num > 300) return;
    }

    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        [field]: value,
      }
    }));
  };

  const handleNext = () => {
    if (state.currentStep < onboardingSteps.length - 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (state.currentStep > 0) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    }
  };

  const handleDismiss = () => {
    setState(prev => ({ ...prev, isVisible: false }));
    if (onDismiss) {
      onDismiss();
    } else if (onComplete) {
      onComplete();
    }
  };

  const handleAnalysisComplete = () => {
    setState(prev => ({ ...prev, showAnalysis: false, showResultsReady: true }));
  };

  const handleViewResults = () => {
    setState(prev => ({ ...prev, showResultsReady: false, showAdvisory: true }));
  };

  const handleAdvisoryContinue = () => {
    setState(prev => ({ ...prev, showAdvisory: false, isVisible: false }));
    toast.success("¡Bienvenido a Scan Health!");
    if (onComplete) {
      onComplete();
    }
  };

  const handleAdvisoryBack = () => {
    setState(prev => ({ ...prev, showAdvisory: false, showResultsReady: true }));
  };

  // Función para recargar con otros datos aleatorios desde el AdvisoryScreen
  const handleReloadRandomData = () => {
    handleQuickTesting(); // Reutilizar la función existente
  };

  // Función para testing rápido con datos aleatorios
  const handleQuickTesting = () => {
    // Generar datos aleatorios para testing
    const randomData = {
      name: 'Usuario Test',
      age: String(Math.floor(Math.random() * 50) + 20), // 20-70 años
      gender: (['male', 'female', 'other'] as const)[Math.floor(Math.random() * 3)],
      weight: String(Math.floor(Math.random() * 40) + 50), // 50-90 kg
      height: String(Math.floor(Math.random() * 30) + 150), // 150-180 cm
      healthGoals: [
        'weight_loss', 'muscle_gain', 'energy', 'sleep', 'immune', 'heart'
      ].slice(0, Math.floor(Math.random() * 3) + 1), // 1-3 objetivos
      activityLevel: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
      dietType: (['balanced', 'vegetarian', 'vegan', 'keto', 'mediterranean'] as const)[Math.floor(Math.random() * 5)],
      healthConditions: Math.random() > 0.7 ? ['diabetes', 'hypertension'] : [],
      allergies: Math.random() > 0.8 ? ['nuts', 'dairy'] : [],
      
      // Datos de onboarding
      stressLevel: (['low', 'medium', 'high', 'very_high'] as const)[Math.floor(Math.random() * 4)],
      sleepQuality: (['poor', 'fair', 'good', 'excellent'] as const)[Math.floor(Math.random() * 4)],
      sunExposure: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
      exerciseType: (['cardio', 'strength', 'mixed', 'yoga'] as const)[Math.floor(Math.random() * 4)],
      exerciseHours: (['1-2', '3-5', '6-8', '9+'] as const)[Math.floor(Math.random() * 4)],
      fishConsumption: Math.floor(Math.random() * 5), // 0-4
      meatConsumption: Math.floor(Math.random() * 5), // 0-4
      vegetableConsumption: Math.floor(Math.random() * 5), // 0-4
      nutsConsumption: Math.floor(Math.random() * 5), // 0-4
      dairyConsumption: Math.floor(Math.random() * 5), // 0-4
      fruitConsumption: Math.floor(Math.random() * 5), // 0-4
      caffeineConsumption: (['none', 'low', 'moderate', 'high'] as const)[Math.floor(Math.random() * 4)],
      antibioticsUse: (['never', 'rare', 'recent', 'multiple'] as const)[Math.floor(Math.random() * 4)],
      bowelMovements: (['irregular', 'regular', 'frequent'] as const)[Math.floor(Math.random() * 3)],
      smokingHabit: (['never', 'occasional', 'regular'] as const)[Math.floor(Math.random() * 3)],
      alcoholConsumption: (['never', 'occasional', 'moderate', 'high'] as const)[Math.floor(Math.random() * 4)],
      
      // Datos adicionales para testing
      recentSurgeries: Math.random() > 0.8 ? 'appendectomy' : '',
      heartMedications: Math.random() > 0.9 ? 'beta-blockers' : '',
      intestinalIssues: Math.random() > 0.7 ? 'IBS' : 'no',
      familyHistory: Math.random() > 0.6 ? ['diabetes'] : [],
      familyDeficiencies: Math.random() > 0.7 ? 'vitamin_d' : '',
      shiftWork: (['never', 'occasional', 'regular', 'always'] as const)[Math.floor(Math.random() * 4)],
      pollutantExposure: (['low', 'medium', 'high'] as const)[Math.floor(Math.random() * 3)],
      intermittentFasting: Math.random() > 0.5 ? 'yes' : 'no'
    };

    // Mostrar valores aleatorios por consola
    console.log('🧪 DATOS ALEATORIOS GENERADOS PARA TESTING:');
    console.log('==========================================');
    console.log('👤 Datos Personales:');
    console.log(`   - Nombre: ${randomData.name}`);
    console.log(`   - Edad: ${randomData.age} años`);
    console.log(`   - Género: ${randomData.gender}`);
    console.log(`   - Peso: ${randomData.weight} kg`);
    console.log(`   - Altura: ${randomData.height} cm`);
    console.log('🎯 Objetivos de Salud:', randomData.healthGoals);
    console.log('🏃 Nivel de Actividad:', randomData.activityLevel);
    console.log('🥗 Tipo de Dieta:', randomData.dietType);
    console.log('💊 Condiciones de Salud:', randomData.healthConditions);
    console.log('🚫 Alergias:', randomData.allergies);
    console.log('😰 Nivel de Estrés:', randomData.stressLevel);
    console.log('😴 Calidad del Sueño:', randomData.sleepQuality);
    console.log('☀️ Exposición Solar:', randomData.sunExposure);
    console.log('🏋️ Tipo de Ejercicio:', randomData.exerciseType);
    console.log('⏰ Horas de Ejercicio:', randomData.exerciseHours);
    console.log('🐟 Consumo de Pescado:', randomData.fishConsumption);
    console.log('🥩 Consumo de Carne:', randomData.meatConsumption);
    console.log('🥬 Consumo de Verduras:', randomData.vegetableConsumption);
    console.log('🥜 Consumo de Frutos Secos:', randomData.nutsConsumption);
    console.log('🥛 Consumo de Lácteos:', randomData.dairyConsumption);
    console.log('🍎 Consumo de Frutas:', randomData.fruitConsumption);
    console.log('☕ Consumo de Cafeína:', randomData.caffeineConsumption);
    console.log('💊 Uso de Antibióticos:', randomData.antibioticsUse);
    console.log('🚽 Movimientos Intestinales:', randomData.bowelMovements);
    console.log('🚬 Hábito de Fumar:', randomData.smokingHabit);
    console.log('🍷 Consumo de Alcohol:', randomData.alcoholConsumption);
    console.log('🏥 Cirugías Recientes:', randomData.recentSurgeries);
    console.log('💊 Medicamentos Cardíacos:', randomData.heartMedications);
    console.log('🫁 Problemas Intestinales:', randomData.intestinalIssues);
    console.log('👨‍👩‍👧‍👦 Historial Familiar:', randomData.familyHistory);
    console.log('🔬 Deficiencias Familiares:', randomData.familyDeficiencies);
    console.log('🌙 Trabajo por Turnos:', randomData.shiftWork);
    console.log('🌫️ Exposición a Contaminantes:', randomData.pollutantExposure);
    console.log('⏰ Ayuno Intermitente:', randomData.intermittentFasting);
    console.log('==========================================');

    // Actualizar el estado con datos aleatorios y ir directamente al plan personalizado
    setState(prev => ({
      ...prev,
      data: { ...prev.data, ...randomData } as any,
      showAdvisory: true // Ir directamente al plan personalizado
    }));

    toast.success("🧪 Datos de testing generados! Saltando al plan personalizado...");
  };

  const completeOnboarding = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Guardar todos los datos del onboarding en la base de datos
        const onboardingData = {
          ...state.data,
          timestamp: new Date().toISOString(),
          isTemporary: false
        };

        console.log('💾 Guardando datos del onboarding en la base de datos...');
        console.log('💾 onboardingData:', onboardingData);

        await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            onboarding_completed: true,
            full_name: state.data.name,
            checkup_results: onboardingData as any, // Convertir a any para evitar problemas de tipos
            updated_at: new Date().toISOString()
          });

        console.log('✅ Datos del onboarding guardados en la base de datos');

        if (state.data.initialStack.length > 0) {
          const stackItems = state.data.initialStack.map(s => ({
            user_id: user.id,
            supplement_ean: s.ean,
          }));
          await supabase.from('user_supplement_stack').insert(stackItems);
        }
      } else {
        // Usuario no autenticado - guardar en localStorage (funcionalidad existente)
        console.log('💾 Usuario no autenticado, guardando en localStorage...');
        const onboardingData = {
          ...state.data,
          timestamp: new Date().toISOString(),
          isTemporary: true
        };
        
        localStorage.setItem('temporary_onboarding_data', JSON.stringify(onboardingData));
        console.log('✅ Datos del onboarding guardados en localStorage');
      }

      // Mostrar pantalla de análisis en lugar de completar inmediatamente
      setState(prev => ({ ...prev, showAnalysis: true }));
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setState(prev => ({ ...prev, isVisible: false }));
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Calculate BMI
  const calculateBMI = () => {
    if (!state.data.weight || !state.data.height) return null;
    const weight = parseFloat(state.data.weight);
    const height = parseFloat(state.data.height) / 100; // cm to m
    return (weight / (height * height)).toFixed(1);
  };

  // Calculate lifetime spending
  const calculateLifetimeSpending = () => {
    if (!state.data.monthlySpending || !state.data.age) return 0;
    const monthly = parseInt(state.data.monthlySpending.split('-')[1] || state.data.monthlySpending.replace('+', ''));
    const currentAge = parseInt(state.data.age);
    const yearsLeft = Math.max(80 - currentAge, 1);
    return monthly * 12 * yearsLeft;
  };

  // Slider component for portion questions
  const SliderQuestion = ({ 
    value, 
    onChange, 
    min = 0, 
    max, 
    step = 1, 
    unit = "porciones",
    formatValue = (v: number) => `${v} ${unit}`
  }: {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max: number;
    step?: number;
    unit?: string;
    formatValue?: (v: number) => string;
  }) => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="text-3xl font-bold text-emerald-600 mb-2">
          {formatValue(value)}
        </div>
      </div>
      
      <div className="px-4">
        <div className="relative">
          <input
            type="range"
            value={value}
            onChange={(e) => onChange(parseInt(e.target.value))}
            min={min}
            max={max}
            step={step}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider-green"
            style={{
              background: `linear-gradient(to right, #10b981 0%, #10b981 ${(value - min) / (max - min) * 100}%, #e5e7eb ${(value - min) / (max - min) * 100}%, #e5e7eb 100%)`,
              WebkitAppearance: 'none',
              appearance: 'none',
              accentColor: '#10b981'
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-2">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    </div>
  );

  const onboardingSteps = [
    // Step 1: Welcome
    {
      id: "welcome",
      component: (
        <div className="space-y-8 text-center py-8">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
          >
            <HeartPulse className="w-16 h-16 text-white" strokeWidth={2} />
          </motion.div>
          
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-3xl font-bold text-foreground">
              Bienvenido a Scan Health
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
              Tu asistente inteligente para una suplementación más saludable y efectiva
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex items-center justify-center gap-2 text-emerald-600"
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-sm font-medium">Personalización inteligente</span>
          </motion.div>

          {/* Botón de Testing Rápido */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="pt-4"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickTesting()}
              className="text-xs text-muted-foreground hover:text-foreground border-dashed"
            >
              <FlaskConical className="w-3 h-3 mr-1" />
              Testing Rápido (Datos Aleatorios)
            </Button>
          </motion.div>
        </div>
      )
    },

    // Step 2: Name
    {
      id: "name-question",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cómo te llamas?</h2>
            <p className="text-muted-foreground">Queremos personalizar tu experiencia</p>
          </div>

          <div className="space-y-4">
            <Input
              value={state.data.name}
              onChange={(e) => updateData('name', e.target.value)}
              placeholder="Escribe tu nombre"
              className="text-center py-4"
              autoFocus
            />
          </div>
        </div>
      )
    },

    // Step 3: Age
    {
      id: "age-question",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Qué edad tienes?</h2>
            <p className="text-muted-foreground">Esto nos ayuda a personalizar las recomendaciones</p>
          </div>

          <div className="space-y-6">
            <div className="text-center">
              <div className="text-5xl font-bold text-emerald-600 mb-2">
                {state.data.age || "25"}
              </div>
              <p className="text-sm text-muted-foreground">años</p>
            </div>

            <Input
              type="number"
              min="13"
              max="105"
              value={state.data.age}
              onChange={(e) => updateData('age', e.target.value)}
              placeholder="25"
              className="text-center py-4"
            />
          </div>
        </div>
      )
    },

    // Step 4: Weight and Height (BMI)
    {
      id: "weight-height",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cuál es tu peso y altura?</h2>
            <p className="text-muted-foreground">Nos ayuda a calcular tu IMC para mejores recomendaciones</p>
          </div>

        <div className="space-y-6">
            {calculateBMI() && (
              <div className="text-center bg-purple-50 rounded-2xl p-4">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  IMC: {calculateBMI()}
          </div>
                <p className="text-sm text-muted-foreground">
                  {parseFloat(calculateBMI()!) < 18.5 ? 'Bajo peso' :
                   parseFloat(calculateBMI()!) < 25 ? 'Peso normal' :
                   parseFloat(calculateBMI()!) < 30 ? 'Sobrepeso' : 'Obesidad'}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Peso (kg)</Label>
                <Input
                  type="number"
                  min="30"
                  max="200"
                  value={state.data.weight}
                  onChange={(e) => updateData('weight', e.target.value)}
                  placeholder="70"
                  className="text-center py-4"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Altura (cm)</Label>
                <Input
                  type="number"
                  min="120"
                  max="220"
                  value={state.data.height}
                  onChange={(e) => updateData('height', e.target.value)}
                  placeholder="175"
                  className="text-center py-4"
                />
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Step 5: Gender
    {
      id: "gender-question",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cuál es tu género?</h2>
            <p className="text-muted-foreground">Nos ayuda a darte mejores recomendaciones</p>
          </div>

          <div className="space-y-4">
            <RadioGroup
              value={state.data.gender}
              onValueChange={(value) => updateData('gender', value)}
              className="space-y-4"
            >
              {[
                { value: "man", label: "Hombre", emoji: "👨", color: "blue" },
                { value: "woman", label: "Mujer", emoji: "👩", color: "pink" }
              ].map((option) => (
                <div key={option.value}>
                  <Label
                    htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                      state.data.gender === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                    }`}
                  >
                    <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                      {option.value === "man" && <User className="w-5 h-5 text-emerald-600" />}
                      {option.value === "woman" && <User className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
              ))}
            </RadioGroup>
          </div>
        </div>
      )
    },

    // Step 6: How heard about us
    {
      id: "how-heard",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Dónde nos conociste?</h2>
            <p className="text-muted-foreground">Nos ayuda a mejorar nuestro alcance</p>
          </div>

          <RadioGroup
            value={state.data.howHeard[0] || ""}
            onValueChange={(value) => {
              console.log('RadioGroup onValueChange called with:', value);
              updateData('howHeard', [value]);
            }}
            className="space-y-4"
          >
            {[
              { value: "google", label: "Búsqueda en Google", icon: Search },
              { value: "social", label: "Redes sociales", icon: Users },
              { value: "friend", label: "Un amigo me recomendó", icon: Heart },
              { value: "ad", label: "Publicidad online", icon: TrendingUp },
              { value: "store", label: "App Store", icon: PlusCircle },
              { value: "other", label: "Otro", icon: Lightbulb }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    (state.data.howHeard[0] || "") === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 7: Daily Supplements
    {
      id: "daily-supplements",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cuántos suplementos tomas al día?</h2>
            <p className="text-muted-foreground">Incluyendo vitaminas, proteínas, etc.</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Los suplementos pueden interactuar entre sí. Conocer la cantidad nos ayuda a detectar posibles interacciones."
            </p>
          </div>

          <RadioGroup
            value={state.data.dailySupplements}
            onValueChange={(value) => updateData('dailySupplements', value)}
            className="space-y-4"
          >
            {[
              { value: "none", label: "Ninguno", desc: "No tomo suplementos", icon: X },
              { value: "1-3", label: "1-3 suplementos", desc: "Pocos suplementos", icon: Pill },
              { value: "4-6", label: "4-6 suplementos", desc: "Cantidad moderada", icon: Pill },
              { value: "7-10", label: "7-10 suplementos", desc: "Bastantes suplementos", icon: Pill },
              { value: "10+", label: "Más de 10", desc: "Muchos suplementos", icon: Pill }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.dailySupplements === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-lg">{option.label}</div>
                    <div className="text-sm text-muted-foreground">{option.desc}</div>
                  </div>
                </Label>
              </div>
            ))}
            </RadioGroup>
        </div>
      )
    },

    // Step 8: Supplements Facts
    {
      id: "supplements-facts",
      component: (
        <div className="space-y-8">
          {/* Patrón de pastillas en la parte superior */}
          <div className="bg-gradient-to-b from-emerald-50 to-white p-8 rounded-2xl">
            <div className="grid grid-cols-5 gap-4 mb-4">
              {/* Pastillas verdes y blancas */}
              {Array.from({ length: 30 }, (_, i) => (
                <div
                  key={i}
                  className={`h-8 rounded-full ${
                    i % 2 === 0 ? 'bg-emerald-500' : 'bg-white border-2 border-emerald-200'
                  } ${
                    i % 3 === 0 ? 'w-8' : i % 3 === 1 ? 'w-10' : 'w-6'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Información sobre suplementos */}
          <div className="text-center space-y-4 -mt-4">
            <p className="text-muted-foreground text-sm">¿Sabías que?</p>
            <h2 className="text-2xl font-semibold text-foreground">
              Solo el 30% de los suplementos tienen evidencia que respalde sus afirmaciones
            </h2>
          </div>
        </div>
      )
    },

    // Step 9: Supplements Tested
    {
      id: "supplements-tested",
      component: (
        <div className="space-y-8">
          {/* Fila de botellas de suplementos */}
          <div className="bg-gradient-to-b from-emerald-50 to-white p-8 rounded-2xl">
            <div className="flex justify-center items-center space-x-4">
              {/* Botellas de suplementos */}
              {Array.from({ length: 7 }, (_, i) => (
                <div
                  key={i}
                  className="relative"
                >
                  {/* Botella */}
                  <div className="w-8 h-16 bg-white rounded-t-lg rounded-b-sm border-2 border-gray-200">
                    {/* Tapa */}
                    <div className="w-6 h-2 bg-white border border-gray-300 rounded-full mx-auto mt-1"></div>
                    {/* Etiqueta TESTED en la botella del medio */}
                    {i === 4 && (
                      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                        <div className="bg-white border border-gray-300 rounded-full px-2 py-1">
                          <span className="text-xs font-bold text-gray-800">TESTED</span>
                  </div>
                      </div>
                  )}
                  </div>
              </div>
            ))}
            </div>
          </div>

          {/* Información sobre suplementos probados */}
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">¿Sabías que?</p>
            <h2 className="text-2xl font-semibold text-foreground">
              Solo el 20% de los suplementos son probados por terceros para confirmar su precisión
            </h2>
          </div>
        </div>
      )
    },

    // Step 10: Supplements Side Effects
    {
      id: "supplements-side-effects",
      component: (
        <div className="space-y-8">
          {/* Botella con sombra de advertencia */}
          <div className="bg-gradient-to-b from-emerald-50 to-white p-8 rounded-2xl">
            <div className="flex justify-center items-center">
              <div className="relative">
                {/* Botella de suplemento */}
                <div className="w-12 h-20 bg-white rounded-t-lg rounded-b-sm border-2 border-gray-200 relative z-10">
                  {/* Tapa con ranuras */}
                  <div className="w-10 h-3 bg-white border border-gray-300 rounded-full mx-auto mt-1">
                    {/* Ranuras en la tapa */}
                    <div className="flex justify-center space-x-1 mt-1">
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Sombra de advertencia en forma de exclamación */}
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-12 bg-gray-800 rounded-full opacity-60"></div>
                  <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-2 h-6 bg-gray-800 rounded-full"></div>
                  <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-800 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Información sobre efectos secundarios */}
          <div className="text-center space-y-4">
            <p className="text-muted-foreground text-sm">¿Sabías que?</p>
            <h2 className="text-2xl font-semibold text-foreground">
              El 12% de los adultos han sufrido efectos secundarios graves por tomar suplementos inseguros
            </h2>
          </div>
        </div>
      )
    },

    // Step 11: Health Goals
    {
      id: "health-goals",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cuáles son tus objetivos?</h2>
            <p className="text-muted-foreground">Selecciona hasta 3 para personalizar tu experiencia</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { name: "Energía", icon: ZapIcon, color: "yellow", desc: "Más vitalidad diaria" },
              { name: "Inmunidad", icon: Shield, color: "green", desc: "Defensas más fuertes" },
              { name: "Sueño", icon: Moon, color: "blue", desc: "Descanso de calidad" },
              { name: "Cognición", icon: Brain, color: "purple", desc: "Memoria y focus" },
              { name: "Digestión", icon: Heart, color: "pink", desc: "Salud intestinal" },
              { name: "Músculos", icon: Dumbbell, color: "red", desc: "Fuerza y masa" },
              { name: "Piel", icon: Sun, color: "orange", desc: "Aspecto saludable" },
              { name: "Huesos", icon: Activity, color: "slate", desc: "Estructura fuerte" }
            ].map((goal) => {
              const isSelected = state.data.healthGoals.includes(goal.name);
              return (
                <motion.div
                  key={goal.name}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    const currentGoals = state.data.healthGoals;
                    if (isSelected) {
                      updateData('healthGoals', currentGoals.filter(g => g !== goal.name));
                    } else if (currentGoals.length < 3) {
                      updateData('healthGoals', [...currentGoals, goal.name]);
                    }
                  }}
                  className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all duration-200 cursor-pointer ${
                    isSelected
                        ? `bg-white border-2 ${
                          goal.color === 'pink' ? 'border-pink-500' :
                          goal.color === 'orange' ? 'border-orange-500' :
                          goal.color === 'blue' ? 'border-blue-500' :
                          goal.color === 'purple' ? 'border-purple-500' :
                          goal.color === 'red' ? 'border-red-500' :
                          goal.color === 'green' ? 'border-green-500' :
                          goal.color === 'yellow' ? 'border-yellow-500' :
                          goal.color === 'slate' ? 'border-slate-500' :
                          'border-gray-500'
                        } ${
                          goal.color === 'pink' ? 'text-pink-700' :
                          goal.color === 'orange' ? 'text-orange-700' :
                          goal.color === 'blue' ? 'text-blue-700' :
                          goal.color === 'purple' ? 'text-purple-700' :
                          goal.color === 'red' ? 'text-red-700' :
                          goal.color === 'green' ? 'text-green-700' :
                          goal.color === 'yellow' ? 'text-yellow-700' :
                          goal.color === 'slate' ? 'text-slate-700' :
                          'text-gray-700'
                        }`
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <goal.icon className={`w-6 h-6 ${
                    isSelected ? (
                      goal.color === 'pink' ? 'text-pink-600' :
                      goal.color === 'orange' ? 'text-orange-600' :
                      goal.color === 'blue' ? 'text-blue-600' :
                      goal.color === 'purple' ? 'text-purple-600' :
                      goal.color === 'red' ? 'text-red-600' :
                      goal.color === 'green' ? 'text-green-600' :
                      goal.color === 'yellow' ? 'text-yellow-600' :
                      goal.color === 'slate' ? 'text-slate-600' :
                      'text-gray-600'
                    ) : 'text-gray-400'
                  }`} />
                  <div className="text-center">
                    <div className={`font-semibold text-xs ${
                      isSelected ? (
                        goal.color === 'pink' ? 'text-pink-700' :
                        goal.color === 'orange' ? 'text-orange-700' :
                        goal.color === 'blue' ? 'text-blue-700' :
                        goal.color === 'purple' ? 'text-purple-700' :
                        goal.color === 'red' ? 'text-red-700' :
                        goal.color === 'green' ? 'text-green-700' :
                        goal.color === 'yellow' ? 'text-yellow-700' :
                        goal.color === 'slate' ? 'text-slate-700' :
                        'text-gray-700'
                      ) : 'text-gray-700'
                    }`}>
                      {goal.name}
                </div>
                    <div className={`text-xs mt-1 ${
                      isSelected ? (
                        goal.color === 'pink' ? 'text-pink-600' :
                        goal.color === 'orange' ? 'text-orange-600' :
                        goal.color === 'blue' ? 'text-blue-600' :
                        goal.color === 'purple' ? 'text-purple-600' :
                        goal.color === 'red' ? 'text-red-600' :
                        goal.color === 'green' ? 'text-green-600' :
                        goal.color === 'yellow' ? 'text-yellow-600' :
                        goal.color === 'slate' ? 'text-slate-600' :
                        'text-gray-600'
                      ) : 'text-muted-foreground'
                    }`}>
                      {goal.desc}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )
    },

    // Step 9: Long-term Results
    {
      id: "long-term-results",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Scan Health crea resultados a largo plazo</h2>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tu esperanza de vida</h3>
            
            {/* Gráfico de comparación de esperanza de vida */}
            <div className="relative h-48 mb-4">
              {/* Líneas de cuadrícula */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-200"></div>
                ))}
                  </div>
              
              {/* Línea del gráfico */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120">
                {/* Área sombreada para Scan Health */}
                <defs>
                  <linearGradient id="scanHealthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                
                {/* Área bajo la curva de Scan Health */}
                <path
                  d="M 30 100 Q 80 95 120 85 Q 160 70 200 50 Q 240 25 270 15 L 270 100 L 30 100 Z"
                  fill="url(#scanHealthGradient)"
                />
                
                {/* Línea de Scan Health - curva exponencial creciente */}
                <path
                  d="M 30 100 Q 80 95 120 85 Q 160 70 200 50 Q 240 25 270 15"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                />
                
                {/* Línea de dieta tradicional - empieza desde abajo y termina más abajo */}
                <path
                  d="M 30 100 Q 80 95 120 90 Q 160 85 200 80 Q 240 75 270 70"
                  stroke="#ef4444"
                  strokeWidth="3"
                  fill="none"
                />
                
                {/* Puntos del gráfico de Scan Health */}
                <circle cx="30" cy="100" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                <circle cx="120" cy="85" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                <circle cx="200" cy="50" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                <circle cx="270" cy="15" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                
                {/* Puntos del gráfico de dieta tradicional */}
                <circle cx="30" cy="100" r="4" fill="white" stroke="#ef4444" strokeWidth="2"/>
                <circle cx="120" cy="90" r="4" fill="white" stroke="#ef4444" strokeWidth="2"/>
                <circle cx="200" cy="80" r="4" fill="white" stroke="#ef4444" strokeWidth="2"/>
                <circle cx="270" cy="70" r="4" fill="white" stroke="#ef4444" strokeWidth="2"/>
              </svg>
              
              {/* Etiquetas del eje X */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                <span className="text-xs text-gray-500">0 años</span>
                <span className="text-xs text-gray-500">80 años</span>
                </div>
              
              {/* Etiquetas de las líneas */}
              <div className="absolute top-2 left-4">
                <div className="flex items-center gap-2 bg-emerald-500 text-white px-2 py-1 rounded text-xs">
                  <span>💚</span>
                  <span>Scan Health</span>
                </div>
              </div>
              
              <div className="absolute top-2 right-4">
                <div className="flex items-center gap-2 bg-red-500 text-white px-2 py-1 rounded text-xs">
                  <span>Sin Scan Health</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              80% de los usuarios de Scan Health aumentan significativamente su esperanza de vida incluso 6 meses después.
            </p>
          </div>
        </div>
      )
    },

    // Step 10: Motivational Message
    {
      id: "motivational-message",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Perder <span className="text-emerald-500 font-bold">10 kg</span> es un objetivo realista. ¡No es nada difícil!
            </h2>
            <p className="text-muted-foreground text-left">
              90% de los usuarios dicen que el cambio es obvio después de usar Scan Health y no es fácil recaer.
            </p>
          </div>
        </div>
      )
    },

    // Step 10: Health Improvement Prediction
    {
      id: "health-improvement",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Tienes un gran potencial para alcanzar tu objetivo</h2>
              </div>

          <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">Tu evolución de salud</h3>
            
            {/* Gráfico de mejora de salud */}
            <div className="relative h-48 mb-4">
              {/* Líneas de cuadrícula */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="border-t border-gray-200"></div>
                ))}
              </div>
              
              {/* Línea del gráfico */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 120">
                {/* Área sombreada */}
                <defs>
                  <linearGradient id="healthGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
                
                {/* Área bajo la curva */}
                <path
                  d="M 30 95 Q 80 90 120 85 Q 160 75 200 55 Q 240 25 270 15 L 270 100 L 30 100 Z"
                  fill="url(#healthGradient)"
                />
                
                {/* Línea principal */}
                <path
                  d="M 30 95 Q 80 90 120 85 Q 160 75 200 55 Q 240 25 270 15"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                />
                
                {/* Puntos del gráfico */}
                <circle cx="30" cy="95" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                <circle cx="120" cy="85" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                <circle cx="200" cy="55" r="4" fill="white" stroke="#10b981" strokeWidth="2"/>
                
                {/* Icono de trofeo al final */}
                <g transform="translate(270, 15)">
                  <text x="0" y="2" textAnchor="middle" fontSize="16" fill="#10b981">🏆</text>
                </g>
              </svg>
              
              {/* Etiquetas del eje X */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
                <span className="text-xs text-gray-500">1 Semana</span>
                <span className="text-xs text-gray-500">1 Mes</span>
                <span className="text-xs text-gray-500">3 Meses</span>
              </div>
            </div>
            
            {/* Caso específico basado en los objetivos del usuario */}
            <div className="space-y-3">
              {state.data.healthGoals.includes("Energía") && (
                <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Energía: +40% de vitalidad en 30 días</span>
                </div>
              )}
              {state.data.healthGoals.includes("Inmunidad") && (
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Inmunidad: Defensas 60% más fuertes</span>
                </div>
              )}
              {state.data.healthGoals.includes("Sueño") && (
                <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-lg">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm font-medium">Sueño: 2 horas más de descanso profundo</span>
                </div>
              )}
              {state.data.healthGoals.includes("Cognición") && (
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm font-medium">Cognición: +35% de concentración y memoria</span>
                </div>
              )}
            </div>
            
            <p className="text-sm text-muted-foreground mt-4">
              Basado en tu perfil único, estos son los resultados esperados con una suplementación personalizada. ¡Tu cuerpo está listo para transformarse!
            </p>
          </div>
        </div>
      )
    },

    // Step 10: Stress Level
    {
      id: "stress-level",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Estrés promedio esta semana?</h2>
            <p className="text-muted-foreground">Seleccione el nivel que corresponda a su experiencia</p>
            </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "El estrés elevado consume magnesio y vitamina B6, el cortisol también aumenta la pérdida urinaria de zinc, elevando su requerimiento diario."
            </p>
          </div>

          <RadioGroup
            value={state.data.stressLevel}
            onValueChange={(value) => updateData('stressLevel', value)}
            className="space-y-4"
          >
            {[
              { value: "zen", label: "Totalmente zen", icon: Smile },
              { value: "relaxed", label: "Bastante relajado", icon: Heart },
              { value: "somewhat", label: "Algo estresado", icon: AlertTriangle },
              { value: "very", label: "Muy estresado", icon: AlertTriangle }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.stressLevel === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
          </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 11: Exercise Volume
    {
      id: "exercise-volume",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Qué volumen de entrenamiento de fuerza realizas?</h2>
            <p className="text-muted-foreground">Seleccione su volumen de entrenamiento semanal</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Desarrollar o mantener masa muscular aumenta la demanda de aminoácidos, creatina y calcio."
            </p>
              </div>

          <RadioGroup
            value={state.data.exerciseHours}
            onValueChange={(value) => updateData('exerciseHours', value)}
            className="space-y-4"
          >
            {[
              { value: "none", label: "Ninguno", icon: X },
              { value: "light", label: "Ligero (30-60 min/semana)", icon: Activity },
              { value: "moderate", label: "Moderado (1-2 horas/semana)", icon: Dumbbell },
              { value: "regular", label: "Regular (2-4 horas/semana)", icon: ZapIcon }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.exerciseHours === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 12: Sun Exposure
    {
      id: "sun-exposure",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Minutos al sol directo por día?</h2>
            <p className="text-muted-foreground">Seleccione su exposición típica al sol</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Menos de 15 min de sol al mediodía raramente producen suficiente UVB para sintetizar 1000 UI de vitamina D."
            </p>
            </div>

            <RadioGroup
            value={state.data.sunExposure}
            onValueChange={(value) => updateData('sunExposure', value)}
            className="space-y-4"
          >
            {[
              { value: "none", label: "Sin sol (0 min)", icon: Moon },
              { value: "little", label: "Muy poco (<10 min)", icon: Moon },
              { value: "some", label: "Algo (10-20 min)", icon: Sun },
              { value: "moderate", label: "Moderado (20-30 min)", icon: Sun }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.sunExposure === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
                </div>
              ))}
            </RadioGroup>
        </div>
      )
    },

    // Step 13: Diet Type
    {
      id: "diet-type",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Qué tipo de dieta consumes?</h2>
            <p className="text-muted-foreground">Selecciona el tipo de alimentación que sigues</p>
          </div>

          <RadioGroup
            value={state.data.dietType}
            onValueChange={(value) => updateData('dietType', value)}
            className="space-y-4"
          >
            {[
              { value: "carnivora", label: "Carnívora" },
              { value: "omnivora", label: "Omnívora" },
              { value: "cetogenica", label: "Cetogénica" },
              { value: "vegetariana", label: "Vegetariana" },
              { value: "vegana", label: "Vegana" }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.dietType === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 14: Eggs per week
    {
      id: "eggs-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Huevos por semana?</h2>
            <p className="text-muted-foreground">Huevos enteros - cualquier estilo de cocción</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "La yema de huevo es la fuente n°1 de colina, también contiene B12 biodisponible, riboflavina y proteínas de alta calidad."
            </p>
            </div>

          <SliderQuestion
            value={state.data.eggConsumption}
            onChange={(value) => updateData('eggConsumption', value)}
            max={14}
            unit="x / semana"
            formatValue={(v) => `${v} x / semana`}
          />
            </div>
      )
    },

    // Step 14: Meat consumption
    {
      id: "meat-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Comidas de carne/aves por semana?</h2>
            <p className="text-muted-foreground">Hamburguesas, pechuga de pollo, pavo...</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Las proteínas animales proporcionan aminoácidos completos, zinc y creatina natural; un consumo bajo señala posibles carencias."
            </p>
          </div>

          <SliderQuestion
            value={state.data.meatConsumption}
            onChange={(value) => updateData('meatConsumption', value)}
            max={10}
            unit="x / semana"
            formatValue={(v) => `${v} x / semana`}
          />
        </div>
      )
    },

    // Step 15: Green leafy vegetables
    {
      id: "vegetables-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Porciones de verduras de hoja verde por día?</h2>
            <p className="text-muted-foreground">Espinacas, kale, rúcula, etc.</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Las verduras de hoja verde concentran folato, vitamina C y fibras prebióticas vitales para la reparación del ADN y la flora intestinal."
            </p>
            </div>

          <SliderQuestion
            value={state.data.vegetableConsumption}
            onChange={(value) => updateData('vegetableConsumption', value)}
            max={5}
            unit="porciones"
          />
            </div>
      )
    },

    // Step 16: Nuts consumption
    {
      id: "nuts-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Puñados de frutos secos por día?</h2>
            <p className="text-muted-foreground">Almendras, nueces, anacardos, etc.</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Los frutos secos son excelentes fuentes de magnesio, vitamina E y zinc vegetal—cofactores clave para la reparación del estrés y la inmunidad."
            </p>
          </div>

          <SliderQuestion
            value={state.data.nutsConsumption}
            onChange={(value) => updateData('nutsConsumption', value)}
            max={5}
            unit="puñados"
          />
        </div>
      )
    },

    // Step 17: Dairy products
    {
      id: "dairy-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Productos lácteos por día?</h2>
            <p className="text-muted-foreground">Leche, yogur, queso, etc.</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "La leche y el yogur proporcionan calcio y B2 con alta biodisponibilidad; los quesos añejos añaden vitamina K2 para la matriz ósea."
            </p>
            </div>

          <SliderQuestion
            value={state.data.dairyConsumption}
            onChange={(value) => updateData('dairyConsumption', value)}
            max={4}
            unit="porciones"
          />
        </div>
      )
    },

    // Step 18: Bread type
    {
      id: "bread-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Tipo de pan que consume habitualmente?</h2>
            <p className="text-muted-foreground">Elija su estilo principal</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "El pan integral o de masa madre reduce los fitatos, aumentando la absorción de magnesio, zinc y fibras beneficiosas para el intestino en comparación con el pan blanco."
              </p>
            </div>

          <RadioGroup
            value={state.data.breadConsumption}
            onValueChange={(value) => updateData('breadConsumption', value)}
            className="space-y-4"
          >
            {[
              { value: "white", label: "Blanco/refinado", icon: Wheat },
              { value: "whole", label: "100% integral", icon: Wheat },
              { value: "sourdough", label: "Pan de masa madre", icon: Wheat }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.breadConsumption === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
          </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 19: Caffeine consumption
    {
      id: "caffeine-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Tazas de café/té por día?</h2>
            <p className="text-muted-foreground">Seleccione su consumo diario de cafeína</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Un alto consumo de cafeína aumenta la pérdida urinaria de magnesio y puede reducir la absorción de hierro."
            </p>
          </div>

          <RadioGroup
            value={state.data.caffeineConsumption}
            onValueChange={(value) => updateData('caffeineConsumption', value)}
            className="space-y-4"
          >
            {[
              { value: "none", label: "Ninguna", icon: X },
              { value: "one", label: "Solo 1 taza", icon: Coffee },
              { value: "two-three", label: "2-3 tazas", icon: Coffee },
              { value: "four-five", label: "4-5 tazas", icon: Coffee }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.caffeineConsumption === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>
            </div>
      )
    },

    // Step 20: Fruit consumption
    {
      id: "fruit-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Porciones de fruta por día?</h2>
            <p className="text-muted-foreground">1 porción = 1 manzana mediana / 1 taza de bayas</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Los cítricos, el kiwi y las bayas son las principales fuentes de vitamina C."
            </p>
          </div>

          <SliderQuestion
            value={state.data.fruitConsumption}
            onChange={(value) => updateData('fruitConsumption', value)}
            max={5}
            unit="porciones"
          />
        </div>
      )
    },

    // Step 21: Legumes consumption
    {
      id: "legumes-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Porciones de legumbres por semana?</h2>
            <p className="text-muted-foreground">Frijoles, lentejas o garbanzos</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Las legumbres complementan las proteínas cuando se combinan con cereales."
            </p>
          </div>

          <SliderQuestion
            value={state.data.legumeConsumption}
            onChange={(value) => updateData('legumeConsumption', value)}
            max={14}
            unit="porciones"
          />
        </div>
      )
    },

    // Step 22: Potatoes consumption
    {
      id: "potatoes-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Porciones de patatas por semana?</h2>
            <p className="text-muted-foreground">Todas las variedades</p>
                  </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Las patatas son una fuente principal de B6 en muchas dietas."
            </p>
                  </div>

          <SliderQuestion
            value={state.data.potatoConsumption}
            onChange={(value) => updateData('potatoConsumption', value)}
            max={14}
            unit="porciones"
          />
                </div>
      )
    },

    // Step 23: Whole grains consumption
    {
      id: "wholegrains-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Porciones de cereales integrales por día?</h2>
            <p className="text-muted-foreground">Avena, arroz integral, quinoa, etc.</p>
                  </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "La avena, el arroz integral y el trigo integral son ricos en B1 (tiamina)."
            </p>
                  </div>

          <SliderQuestion
            value={state.data.wholegrainConsumption}
            onChange={(value) => updateData('wholegrainConsumption', value)}
            max={6}
            unit="porciones"
          />
                  </div>
      )
    },

    // Step 24: Antibiotics use
    {
      id: "antibiotics-use",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Ha tomado antibióticos recientemente?</h2>
            <p className="text-muted-foreground">Una prescripción de ≤ 3 días cuenta</p>
                </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Los antibióticos perturban la flora intestinal; los probióticos específicos pueden ayudar a restaurar el equilibrio."
            </p>
              </div>

          <RadioGroup
            value={state.data.antibioticsUse}
            onValueChange={(value) => updateData('antibioticsUse', value)}
            className="space-y-4"
          >
            {[
              { value: "no-recent", label: "No, no durante el último año", icon: CheckCircle },
              { value: "short", label: "Sí, un tratamiento corto", icon: Pill },
              { value: "multiple", label: "Sí, varios tratamientos", icon: Stethoscope }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.antibioticsUse === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
            </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
          </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 25: Bowel movements
    {
      id: "bowel-movements",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Frecuencia media de evacuación?</h2>
            <p className="text-muted-foreground">Seleccione la opción que mejor corresponda</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "Las evacuaciones poco frecuentes pueden indicar falta de fibra o magnesio; ambos ayudan al tránsito intestinal."
            </p>
          </div>

          <RadioGroup
            value={state.data.bowelMovements}
            onValueChange={(value) => {
              console.log('Bowel movements changed to:', value);
              updateData('bowelMovements', value);
            }}
            className="space-y-4"
          >
            {[
              { value: "less-than-daily", label: "<1 / día" },
              { value: "daily", label: "1 / día" },
              { value: "more-than-daily", label: ">2 / día" }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center justify-center p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.bowelMovements === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
                  </div>
            ))}
          </RadioGroup>
                  </div>
      )
    },

    // Step 26: Smoking
    {
      id: "smoking-habit",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Fuma tabaco?</h2>
            <p className="text-muted-foreground">Cualquier tipo de tabaco (excluido vapeo)</p>
                </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "El humo del cigarrillo oxida la vitamina C dos veces más rápido; los fumadores tienen necesidades diarias más altas."
            </p>
                  </div>

          <RadioGroup
            value={state.data.smokingHabit}
            onValueChange={(value) => updateData('smokingHabit', value)}
            className="space-y-4"
          >
            {[
              { value: "no", label: "No" },
              { value: "yes", label: "Sí" }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.smokingHabit === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
                  </div>
            ))}
          </RadioGroup>
                  </div>
      )
    },

    // Step 27: Alcohol consumption
    {
      id: "alcohol-consumption",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Bebidas alcohólicas por semana?</h2>
            <p className="text-muted-foreground">Seleccione su consumo semanal de alcohol</p>
                </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "El consumo regular de alcohol agota las vitaminas del complejo B, especialmente la tiamina (B1) y el folato."
            </p>
              </div>

          <RadioGroup
            value={state.data.alcoholConsumption}
            onValueChange={(value) => updateData('alcoholConsumption', value)}
            className="space-y-4"
          >
            {[
              { value: "none", label: "Ninguna", icon: X },
              { value: "rare", label: "Raramente (1-2)", icon: Wine },
              { value: "moderate", label: "Moderado (3-6)", icon: Wine }
            ].map((option) => (
              <div key={option.value}>
                <Label
                  htmlFor={option.value}
                  className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                    state.data.alcoholConsumption === option.value
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100">
                    <option.icon className="w-5 h-5 text-emerald-600" />
            </div>
                  <span className="font-medium text-lg">{option.label}</span>
                </Label>
          </div>
            ))}
          </RadioGroup>
        </div>
      )
    },

    // Step 28: ScanHealth Comparison
    {
      id: "scanhealth-comparison",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">Mejora el doble de tu salud con Scan Health vs por tu cuenta</h2>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <div className="grid grid-cols-2 gap-6">
              {/* Sin Scan Health */}
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Sin Scan Health</h3>
                <div className="bg-white rounded-lg p-4 h-32 flex items-end justify-center">
                  <div className="w-16 h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-gray-200 rounded-lg p-3">
                  <span className="text-2xl font-bold text-gray-600">20%</span>
                </div>
              </div>

              {/* Con Scan Health */}
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Con Scan Health</h3>
                <div className="bg-white rounded-lg p-4 h-32 flex items-end justify-center">
                  <div className="w-16 h-20 bg-emerald-500 rounded"></div>
            </div>
                <div className="bg-emerald-500 rounded-lg p-3">
                  <span className="text-2xl font-bold text-white">2X</span>
                </div>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground mt-6 text-center">
              Scan Health hace que sea fácil y te mantiene responsable de tu salud.
            </p>
          </div>
        </div>
      )
    },

    // Step 29: Monthly Spending
    {
      id: "spending",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Cuánto gastas mensualmente?</h2>
            <p className="text-muted-foreground">En suplementos aproximadamente</p>
          </div>

          <div className="bg-gray-100 rounded-2xl p-4 mb-6">
            <p className="text-sm text-muted-foreground">
              "El mercado de suplementos mueve €150 billones anuales. Asegúrate de que tu dinero esté bien invertido."
            </p>
          </div>

          <RadioGroup
            value={state.data.monthlySpending}
            onValueChange={(value) => updateData('monthlySpending', value)}
            className="space-y-3"
          >
            {["0-50", "51-100", "101-200", "201-300", "301-500", "500+"].map(range => (
              <div key={range}>
                <Label
                  htmlFor={range}
                  className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-all duration-200 ${
                    state.data.monthlySpending === range
                      ? "bg-white border-2 border-emerald-500 text-emerald-700"
                      : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value={range} id={range} className="sr-only" />
                    <span className="font-medium">{range === "500+" ? "+500€" : `${range}€`}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>
            </div>
      )
    },

    // Step 29: Lifetime Spending Impact
    {
      id: "lifetime-spending",
      component: (
        <div className="space-y-8 text-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Tu Gasto Estimado de por Vida</h2>
            
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6 space-y-4">
              <div className="text-4xl font-bold text-red-600">
                {calculateLifetimeSpending().toLocaleString()}€
              </div>
              <p className="text-lg text-foreground">
                Gastos estimados en suplementos hasta los 80 años
              </p>
              <p className="text-sm text-muted-foreground">
                Basado en tu gasto mensual actual de {state.data.monthlySpending === "500+" ? "+500€" : `${state.data.monthlySpending}€`}
              </p>
          </div>

            <div className="flex items-center justify-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-sm font-medium">¡Por eso es importante elegir bien!</span>
            </div>
          </div>
        </div>
      )
    },

    // Step 29: Analyzing Results
    {
      id: "analyzing-results",
      component: (
        <div className="space-y-8 text-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Analizando tus Resultados</h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  <span className="text-sm">Análisis nutricional personalizado</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
                  <span className="text-sm">Basado en su estilo de vida, alimentación y factores de salud</span>
                </div>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
                  <span className="text-sm">Plan de suplementos práctico</span>
                </div>
              </div>
          </div>

            <div className="bg-emerald-50 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BarChart3 className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-emerald-700">Análisis nutricional personalizado</span>
              </div>
              <p className="text-sm text-emerald-600">
                Recomendaciones prioritarias para sus necesidades específicas
              </p>
            </div>

            <div className="bg-blue-50 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <BookOpen className="w-6 h-6 text-emerald-600" />
                <span className="font-semibold text-blue-700">Consejos para optimizar la salud</span>
              </div>
              <p className="text-sm text-emerald-600">
                Consejos personalizados basados en su perfil nutricional
              </p>
              </div>
            </div>
        </div>
      )
    },

    // Step 30: Nutritional Questions - Blood Analysis
    {
      id: "blood-analysis",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-400 to-red-600 rounded-full flex items-center justify-center">
              <FlaskConical className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Análisis de Sangre
            </h2>
            <p className="text-muted-foreground">
              Si tienes resultados de análisis de sangre de los últimos 6 meses, 
              podemos hacer un análisis más preciso
            </p>
          </div>

          <RadioGroup
            value={state.data.hasBloodTest ? 'yes' : 'no'}
            onValueChange={(value) => updateData('hasBloodTest', value === 'yes')}
            className="space-y-4"
          >
            <div>
              <Label
                htmlFor="yes"
                className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                  state.data.hasBloodTest
                    ? "bg-white border-2 border-emerald-500 text-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                <RadioGroupItem value="yes" id="yes" className="sr-only" />
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-lg">Sí, tengo análisis recientes</span>
              </Label>
            </div>
            <div>
              <Label
                htmlFor="no"
                className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                  !state.data.hasBloodTest
                    ? "bg-white border-2 border-emerald-500 text-emerald-700"
                    : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                }`}
              >
                <RadioGroupItem value="no" id="no" className="sr-only" />
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-lg">No, no tengo análisis recientes</span>
              </Label>
            </div>
          </RadioGroup>

          {state.data.hasBloodTest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Fecha del análisis</Label>
                <Input
                  type="date"
                  value={state.data.bloodTestDate || ''}
                  onChange={(e) => updateData('bloodTestDate', e.target.value)}
                  className="text-center py-4"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2 block">¿Qué análisis tienes? (Selecciona todos los que apliquen)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'Hemograma completo',
                    'Vitamina D (25-OH)',
                    'B12 (Cobalamina)',
                    'Ácido fólico',
                    'Hierro/Ferritina',
                    'Magnesio',
                    'Zinc',
                    'Selenio',
                    'Omega-3 (EPA/DHA)',
                    'Perfil lipídico',
                    'Glucosa/HbA1c',
                    'Función tiroidea (TSH, T3, T4)',
                    'Proteína C reactiva',
                    'Homocisteína',
                    'Cortisol',
                    'Testosterona',
                    'Estradiol',
                    'Progesterona'
                  ].map((test) => (
                    <div key={test} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={test}
                        checked={state.data.bloodTestResults?.includes(test) || false}
                        onChange={(e) => {
                          const currentResults = state.data.bloodTestResults || [];
                          if (e.target.checked) {
                            updateData('bloodTestResults', [...currentResults, test]);
                          } else {
                            updateData('bloodTestResults', currentResults.filter(item => item !== test));
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={test} className="text-sm">{test}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    },

    // Step 31: Nutritional Questions - Symptoms
    {
      id: "symptoms",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-orange-400 to-orange-600 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Síntomas Actuales
            </h2>
            <p className="text-muted-foreground">
              Selecciona todos los síntomas que experimentas regularmente
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'fatigue', label: 'Fatiga constante', icon: ZapIcon },
              { id: 'muscle_cramps', label: 'Calambres musculares', icon: Activity },
              { id: 'sleep_issues', label: 'Problemas de sueño', icon: Moon },
              { id: 'mood_changes', label: 'Cambios de humor', icon: Heart },
              { id: 'memory_issues', label: 'Problemas de memoria', icon: Brain },
              { id: 'weakness', label: 'Debilidad muscular', icon: Activity },
              { id: 'hair_loss', label: 'Pérdida de cabello', icon: Sun },
              { id: 'skin_issues', label: 'Problemas de piel', icon: Shield },
              { id: 'digestive', label: 'Problemas digestivos', icon: Stethoscope },
              { id: 'frequent_colds', label: 'Resfriados frecuentes', icon: AlertTriangle },
              { id: 'joint_pain', label: 'Dolores articulares', icon: Activity },
              { id: 'headaches', label: 'Dolores de cabeza', icon: Brain },
              { id: 'anxiety', label: 'Ansiedad', icon: Heart },
              { id: 'depression', label: 'Depresión', icon: Heart },
              { id: 'weight_gain', label: 'Aumento de peso', icon: Activity },
              { id: 'weight_loss', label: 'Pérdida de peso', icon: Activity },
              { id: 'dry_skin', label: 'Piel seca', icon: Sun },
              { id: 'brittle_nails', label: 'Uñas quebradizas', icon: Shield },
              { id: 'vision_problems', label: 'Problemas de visión', icon: Sun },
              { id: 'tinnitus', label: 'Zumbido en oídos', icon: Brain }
            ].map((symptom) => (
              <div key={symptom.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id={symptom.id}
                  checked={state.data.symptoms?.includes(symptom.id) || false}
                  onChange={(e) => {
                    const currentSymptoms = state.data.symptoms || [];
                    if (e.target.checked) {
                      updateData('symptoms', [...currentSymptoms, symptom.id]);
                    } else {
                      updateData('symptoms', currentSymptoms.filter(item => item !== symptom.id));
                    }
                  }}
                  className="rounded"
                />
                <Label htmlFor={symptom.id} className="text-sm flex items-center gap-2">
                  <symptom.icon className="w-4 h-4" />
                  {symptom.label}
                </Label>
              </div>
            ))}
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Otros síntomas (opcional)</Label>
            <Input
              value={state.data.otherSymptoms || ''}
              onChange={(e) => updateData('otherSymptoms', e.target.value)}
              placeholder="Describe otros síntomas que experimentas"
              className="text-center py-4"
            />
          </div>
        </div>
      )
    },

    // Step 32: Nutritional Questions - Medical Conditions
    {
      id: "medical-conditions",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
              <Stethoscope className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Salud Médica
            </h2>
            <p className="text-muted-foreground">
              Información médica para recomendaciones seguras
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Condiciones médicas (selecciona todas las que apliquen)</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Diabetes',
                  'Hipertensión',
                  'Problemas de tiroides',
                  'Enfermedades cardíacas',
                  'Problemas digestivos',
                  'Ansiedad/Depresión',
                  'Artritis',
                  'Osteoporosis',
                  'Ninguna'
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={condition}
                      checked={state.data.medicalConditions?.includes(condition) || false}
                      onChange={(e) => {
                        const currentConditions = state.data.medicalConditions || [];
                        if (e.target.checked) {
                          updateData('medicalConditions', [...currentConditions, condition]);
                        } else {
                          updateData('medicalConditions', currentConditions.filter(item => item !== condition));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={condition} className="text-sm">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Medicamentos actuales (opcional)</Label>
              <Input
                value={state.data.medications?.join(', ') || ''}
                onChange={(e) => updateData('medications', e.target.value.split(', ').filter(m => m.trim()))}
                placeholder="Ej: Metformina, Omeprazol, etc."
                className="text-center py-4"
              />
            </div>
          </div>
        </div>
      )
    },

    // Step 33: Nutritional Questions - Lifestyle
    {
      id: "lifestyle",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Estilo de Vida
            </h2>
            <p className="text-muted-foreground">
              Tu rutina diaria afecta tus necesidades nutricionales
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Horario de sueño</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-gray-500">Hora de acostarse</Label>
                  <Input
                    type="time"
                    value={state.data.sleepSchedule?.bedtime || ''}
                    onChange={(e) => {
                      const currentSchedule = state.data.sleepSchedule || { bedtime: '', wakeTime: '' };
                      setState(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          sleepSchedule: {
                            ...currentSchedule,
                            bedtime: e.target.value
                          }
                        }
                      }));
                    }}
                    className="text-center py-4"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hora de despertar</Label>
                  <Input
                    type="time"
                    value={state.data.sleepSchedule?.wakeTime || ''}
                    onChange={(e) => {
                      const currentSchedule = state.data.sleepSchedule || { bedtime: '', wakeTime: '' };
                      setState(prev => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          sleepSchedule: {
                            ...currentSchedule,
                            wakeTime: e.target.value
                          }
                        }
                      }));
                    }}
                    className="text-center py-4"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de trabajo</Label>
              <RadioGroup
                value={state.data.workType || ''}
                onValueChange={(value) => updateData('workType', value)}
                className="space-y-3"
              >
                {[
                  { value: 'office', label: 'Oficina (sedentario)', icon: Briefcase },
                  { value: 'physical', label: 'Físico (activo)', icon: Activity },
                  { value: 'night', label: 'Trabajo nocturno', icon: Moon },
                  { value: 'stressful', label: 'Alto estrés', icon: AlertTriangle }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.workType === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <option.icon className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Ambiente de trabajo</Label>
              <RadioGroup
                value={state.data.environment || ''}
                onValueChange={(value) => updateData('environment', value)}
                className="space-y-3"
              >
                {[
                  { value: 'city', label: 'Ciudad (contaminación)', icon: MapPin },
                  { value: 'suburban', label: 'Suburbio', icon: Sun },
                  { value: 'rural', label: 'Rural (aire limpio)', icon: Heart },
                  { value: 'indoor', label: 'Solo interior', icon: Shield }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.environment === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <option.icon className="w-5 h-5 text-emerald-600" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      )
    },

    // Step 34: Nutritional Questions - Allergies and Preferences
    {
      id: "allergies-preferences",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
              <Pill className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Preferencias de Suplementos
            </h2>
            <p className="text-muted-foreground">
              Para recomendaciones que se adapten a ti
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Alergias alimentarias</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Lácteos',
                  'Gluten',
                  'Frutos secos',
                  'Mariscos',
                  'Huevos',
                  'Soja',
                  'Ninguna'
                ].map((allergy) => (
                  <div key={allergy} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={allergy}
                      checked={state.data.allergies?.includes(allergy) || false}
                      onChange={(e) => {
                        const currentAllergies = state.data.allergies || [];
                        if (e.target.checked) {
                          updateData('allergies', [...currentAllergies, allergy]);
                        } else {
                          updateData('allergies', currentAllergies.filter(item => item !== allergy));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={allergy} className="text-sm">{allergy}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Preferencias de formato</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Cápsulas',
                  'Polvos',
                  'Líquidos',
                  'Gummies',
                  'Tabletas',
                  'Cualquiera'
                ].map((format) => (
                  <div key={format} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={format}
                      checked={state.data.supplementPreferences?.includes(format) || false}
                      onChange={(e) => {
                        const currentPreferences = state.data.supplementPreferences || [];
                        if (e.target.checked) {
                          updateData('supplementPreferences', [...currentPreferences, format]);
                        } else {
                          updateData('supplementPreferences', currentPreferences.filter(item => item !== format));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={format} className="text-sm">{format}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Suplementos que tomas actualmente</Label>
              <Input
                value={state.data.currentSupplements?.join(', ') || ''}
                onChange={(e) => updateData('currentSupplements', e.target.value.split(', ').filter(s => s.trim()))}
                placeholder="Ej: Multivitamínico, Omega-3, etc."
                className="text-center py-4"
              />
            </div>
          </div>
        </div>
      )
    },

    // Step 35: Enhanced Health History
    {
      id: "health-history",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Historial de Salud
            </h2>
            <p className="text-muted-foreground">
              Información adicional para recomendaciones más precisas
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">¿Has tenido cirugías recientes? (últimos 2 años)</Label>
              <RadioGroup
                value={state.data.recentSurgeries || ''}
                onValueChange={(value) => updateData('recentSurgeries', value)}
                className="space-y-3"
              >
                {[
                  { value: 'none', label: 'Ninguna' },
                  { value: 'minor', label: 'Cirugías menores' },
                  { value: 'major', label: 'Cirugías mayores' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.recentSurgeries === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Tomas medicamentos para el corazón?</Label>
              <RadioGroup
                value={state.data.heartMedications || ''}
                onValueChange={(value) => updateData('heartMedications', value)}
                className="space-y-3"
              >
                {[
                  { value: 'no', label: 'No' },
                  { value: 'yes', label: 'Sí (estatinas, betabloqueadores, etc.)' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.heartMedications === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Tienes problemas de absorción intestinal?</Label>
              <RadioGroup
                value={state.data.intestinalIssues || ''}
                onValueChange={(value) => updateData('intestinalIssues', value)}
                className="space-y-3"
              >
                {[
                  { value: 'no', label: 'No' },
                  { value: 'ibs', label: 'Síndrome del intestino irritable' },
                  { value: 'crohns', label: 'Enfermedad de Crohn' },
                  { value: 'celiac', label: 'Enfermedad celíaca' },
                  { value: 'other', label: 'Otros problemas digestivos' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.intestinalIssues === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      )
    },

    // Step 36: Family Health History
    {
      id: "family-history",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Historial Familiar
            </h2>
            <p className="text-muted-foreground">
              La genética influye en tus necesidades nutricionales
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Condiciones familiares (selecciona todas las que apliquen)</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Diabetes tipo 2',
                  'Enfermedades cardíacas',
                  'Osteoporosis',
                  'Cáncer de colon',
                  'Problemas de tiroides',
                  'Alzheimer/Demencia',
                  'Depresión/Ansiedad',
                  'Ninguna'
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={condition}
                      checked={state.data.familyHistory?.includes(condition) || false}
                      onChange={(e) => {
                        const currentHistory = state.data.familyHistory || [];
                        if (e.target.checked) {
                          updateData('familyHistory', [...currentHistory, condition]);
                        } else {
                          updateData('familyHistory', currentHistory.filter(item => item !== condition));
                        }
                      }}
                      className="rounded"
                    />
                    <Label htmlFor={condition} className="text-sm">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Algún familiar tiene deficiencias nutricionales conocidas?</Label>
              <Input
                value={state.data.familyDeficiencies || ''}
                onChange={(e) => updateData('familyDeficiencies', e.target.value)}
                placeholder="Ej: Vitamina D, B12, hierro, etc."
                className="text-center py-4"
              />
            </div>
          </div>
        </div>
      )
    },

    // Step 37: Advanced Lifestyle Factors
    {
      id: "advanced-lifestyle",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-teal-400 to-teal-600 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Factores Avanzados de Estilo de Vida
            </h2>
            <p className="text-muted-foreground">
              Detalles que afectan tus necesidades nutricionales
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">¿Trabajas en turnos nocturnos o rotativos?</Label>
              <RadioGroup
                value={state.data.shiftWork || ''}
                onValueChange={(value) => updateData('shiftWork', value)}
                className="space-y-3"
              >
                {[
                  { value: 'no', label: 'No, horario diurno normal' },
                  { value: 'occasional', label: 'Ocasionalmente' },
                  { value: 'regular', label: 'Regularmente' },
                  { value: 'always', label: 'Siempre trabajo nocturno' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.shiftWork === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Tienes exposición a contaminantes en el trabajo?</Label>
              <RadioGroup
                value={state.data.pollutantExposure || ''}
                onValueChange={(value) => updateData('pollutantExposure', value)}
                className="space-y-3"
              >
                {[
                  { value: 'none', label: 'Ninguna' },
                  { value: 'low', label: 'Baja (oficina con ventanas)' },
                  { value: 'medium', label: 'Media (ciudad, tráfico)' },
                  { value: 'high', label: 'Alta (industria, construcción)' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.pollutantExposure === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Practicas ayuno intermitente?</Label>
              <RadioGroup
                value={state.data.intermittentFasting || ''}
                onValueChange={(value) => updateData('intermittentFasting', value)}
                className="space-y-3"
              >
                {[
                  { value: 'no', label: 'No' },
                  { value: 'occasional', label: 'Ocasionalmente' },
                  { value: 'regular', label: 'Regularmente (16:8)' },
                  { value: 'extended', label: 'Ayunos largos (24h+)' }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        state.data.intermittentFasting === option.value
                          ? "bg-white border-2 border-emerald-500 text-emerald-700"
                          : "bg-gray-100 hover:bg-gray-200 border-2 border-transparent"
                      }`}
                    >
                      <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
                      <span className="font-medium">{option.label}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        </div>
      )
    },

    // Step 38: Community Reviews
    {
      id: "community-reviews",
      component: (
        <div className="space-y-8 text-center">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">Lo que Dice Nuestra Comunidad</h2>
            
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star key={star} className="w-6 h-6 fill-yellow-400 text-yellow-400" />
                ))}
                <span className="ml-2 font-bold text-lg">4.9</span>
          </div>

          <div className="space-y-4">
                <div className="text-left bg-white rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">AC</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Ana C.</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "Antes gastaba €200/mes en suplementos que no necesitaba. Ahora ahorro dinero y me siento mejor que nunca."
                  </p>
            </div>

                <div className="text-left bg-white rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-semibold">MR</span>
                    </div>
                    <div>
                      <div className="font-semibold text-sm">Miguel R.</div>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(star => (
                          <Star key={star} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    "La app me ayudó a detectar que mi proteína tenía metales pesados. ¡Cambié de marca inmediatamente!"
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-orange-600">
              <Heart className="w-5 h-5" />
              <span className="text-sm font-medium">Más de 100,000 usuarios satisfechos</span>
            </div>
          </div>
        </div>
      )
    },

    // Step 39: Notifications
    {
      id: "notifications",
      component: (
        <div className="space-y-8 text-center">
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">¿Te gustaría recibir notificaciones?</h2>
            <p className="text-muted-foreground">Te mantendremos informado sobre análisis de productos y recordatorios</p>
            
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 space-y-4">
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm">Alertas de productos con ingredientes peligrosos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                  <span className="text-sm">Recordatorios para tomar tus suplementos</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  <span className="text-sm">Nuevas recomendaciones personalizadas</span>
                </div>
              </div>
          </div>

            <div className="space-y-4 pb-8">
              <Button
                onClick={() => {
                  updateData('wantsNotifications', true);
                  handleNext();
                }}
                className="w-full py-6 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl"
              >
                <Bell className="w-5 h-5 mr-2" />
                Sí, quiero recibir notificaciones
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  updateData('wantsNotifications', false);
                  handleNext();
                }}
                className="w-full py-6 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-xl border border-gray-300"
              >
                Ahora no
              </Button>
                </div>
                  </div>
                </div>
      )
    },

    // Step 40: Referral Code
    {
      id: "referral-code",
      component: (
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">¿Tienes código de invitación?</h2>
            <p className="text-muted-foreground">Si alguien te invitó, ingresa su código para obtener beneficios</p>
              </div>

          <div className="space-y-6">
            <Input
              value={state.data.referralCode}
              onChange={(e) => updateData('referralCode', e.target.value.toUpperCase())}
              placeholder="Código de invitación (opcional)"
              className="text-center py-4"
              maxLength={20}
            />
            
            {state.data.referralCode && (
              <div className="bg-purple-50 rounded-xl p-4 text-center">
                <div className="text-purple-600 font-semibold">¡Código válido!</div>
                <div className="text-sm text-purple-600 mt-1">Recibirás beneficios especiales</div>
            </div>
            )}
          </div>
        </div>
      )
    },

    // Step 41: Final commitment screen
    {
      id: "commitment",
      component: (
        <div className="space-y-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center shadow-2xl"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>

          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">¡{state.data.name}, estás listo!</h2>
            
            <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6 space-y-4">
              <p className="text-lg text-foreground">
                Tu plan personalizado incluye:
              </p>
              
              <div className="space-y-3 text-left max-w-sm mx-auto">
                {[
                  { icon: FlaskConical, text: "Análisis científico de ingredientes" },
                  { icon: Shield, text: "Detección de metales pesados y contaminantes" },
                  { icon: Target, text: `Recomendaciones para ${state.data.healthGoals.join(', ').toLowerCase()}` },
                  { icon: BarChart3, text: "Seguimiento de progreso personalizado" },
                  { icon: DollarSign, text: "Ahorro en suplementos innecesarios" }
                ].map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <feature.icon className="w-5 h-5 text-emerald-600" />
                    <span className="text-sm">{feature.text}</span>
                  </motion.div>
                ))}
              </div>
          </div>

            <div className="flex items-center justify-center gap-2 text-emerald-600">
              <Sparkles className="w-5 h-5" />
              <span className="text-sm font-medium">Tu viaje hacia una salud óptima comienza ahora</span>
            </div>
          </div>
        </div>
      )
    },

  ];

  // Show loading state
  if (state.isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-center text-muted-foreground">Preparando tu experiencia...</p>
        </div>
      </motion.div>
    );
  }

  // Show analysis screen
  if (state.showAnalysis) {
    return <AnalysisScreen onComplete={handleAnalysisComplete} />;
  }

  // Show results ready screen
  if (state.showResultsReady) {
    return <ResultsReadyScreen onViewResults={handleViewResults} />;
  }

  // Show advisory screen
  if (state.showAdvisory) {
    // Crear perfil de usuario basado en los datos del onboarding
    const userProfile = {
      id: 'onboarding-user',
      age: Number(state.data.age) || 30,
      gender: (state.data.gender as 'male' | 'female' | 'other') || 'other',
      weight: Number(state.data.weight) || 70,
      height: Number(state.data.height) || 170,
      health_goals: state.data.healthGoals || [],
      activity_level: (() => {
        const exerciseType = state.data.exerciseType || 'mixed';
        if (exerciseType === 'cardio' || exerciseType === 'strength') return 'high' as const;
        if (exerciseType === 'mixed') return 'medium' as const;
        return 'low' as const;
      })(),
      diet_type: state.data.dietType || 'balanced',
      health_conditions: [],
      allergies: state.data.allergies || [],
      onboarding_data: {
        stressLevel: state.data.stressLevel || 'medium',
        sleepQuality: state.data.sleepQuality || 'good',
        sunExposure: state.data.sunExposure || 'medium',
        exerciseType: state.data.exerciseType || 'mixed',
        exerciseHours: state.data.exerciseHours || '3-5',
        fishConsumption: state.data.fishConsumption || 2,
        meatConsumption: state.data.meatConsumption || 3,
        vegetableConsumption: state.data.vegetableConsumption || 4,
        nutsConsumption: state.data.nutsConsumption || 2,
        dairyConsumption: state.data.dairyConsumption || 3,
        fruitConsumption: state.data.fruitConsumption || 3,
        caffeineConsumption: state.data.caffeineConsumption || 'moderate',
        antibioticsUse: state.data.antibioticsUse || 'rare',
        bowelMovements: state.data.bowelMovements || 'regular',
        smokingHabit: state.data.smokingHabit || 'never',
        alcoholConsumption: state.data.alcoholConsumption || 'occasional',
        recentSurgeries: state.data.recentSurgeries,
        heartMedications: state.data.heartMedications,
        intestinalIssues: state.data.intestinalIssues,
        familyHistory: state.data.familyHistory,
        familyDeficiencies: state.data.familyDeficiencies,
        shiftWork: state.data.shiftWork,
        pollutantExposure: state.data.pollutantExposure,
        intermittentFasting: state.data.intermittentFasting
      }
    };

    return (
      <AdvisoryScreen
        onContinue={handleAdvisoryContinue}
        onBack={handleAdvisoryBack}
        userProfile={userProfile}
        onReloadRandomData={handleReloadRandomData}
      />
    );
  }


  // Don't show if not visible
  console.log("🎭 SmartOnboarding render - isVisible:", state.isVisible, "isLoading:", state.isLoading);
  if (!state.isVisible) {
    console.log("❌ SmartOnboarding not visible, returning null");
    return null;
  }

  console.log("✅ SmartOnboarding is visible, rendering onboarding steps");

  const progress = ((state.currentStep + 1) / onboardingSteps.length) * 100;
  const currentStep = onboardingSteps[state.currentStep];

  // Validation logic
  const isStepValid = () => {
    console.log('Validating step:', state.currentStep);
    switch (state.currentStep) {
      case 0: return true; // Welcome - no validation needed
      case 1: return !!state.data.name; // Name
      case 2: return !!state.data.age; // Age
      case 3: return !!state.data.weight && !!state.data.height; // Weight and Height
      case 4: return !!state.data.gender; // Gender
      case 5: 
        console.log('Validating howHeard step - length:', state.data.howHeard.length, 'data:', state.data.howHeard);
        return state.data.howHeard.length > 0; // How heard about us
      case 6: return !!state.data.dailySupplements; // Daily supplements
      case 7: return true; // Supplements facts - no validation needed
      case 8: return true; // Supplements tested - no validation needed
      case 9: return true; // Supplements side effects - no validation needed
      case 10: return state.data.healthGoals.length > 0; // Health goals
      case 11: return true; // Long-term results - no validation needed
      case 12: return true; // Motivational message - no validation needed
      case 13: return true; // Health improvement prediction - no validation needed
      case 14: return !!state.data.stressLevel; // Stress level
      case 15: return !!state.data.exerciseHours; // Exercise volume
      case 16: return !!state.data.sunExposure; // Sun exposure
      case 17: return !!state.data.dietType; // Diet type
      case 18: return true; // Eggs consumption - slider always has value
      case 19: return true; // Meat consumption - slider always has value
      case 20: return true; // Vegetables consumption - slider always has value
      case 21: return true; // Nuts consumption - slider always has value
      case 22: return true; // Dairy consumption - slider always has value
      case 23: return !!state.data.breadConsumption; // Bread consumption
      case 24: return !!state.data.caffeineConsumption; // Caffeine consumption
      case 25: return true; // Fruit consumption - slider always has value
      case 26: return true; // Legumes consumption - slider always has value
      case 27: return true; // Potatoes consumption - slider always has value
      case 28: return true; // Whole grains consumption - slider always has value
      case 29: return !!state.data.antibioticsUse; // Antibiotics use
      case 30: 
        console.log('Validating bowel movements:', state.data.bowelMovements, 'result:', !!state.data.bowelMovements);
        return !!state.data.bowelMovements; // Bowel movements
      case 31: return !!state.data.smokingHabit; // Smoking habit
      case 32: return !!state.data.alcoholConsumption; // Alcohol consumption
      case 33: return true; // ScanHealth comparison - no validation needed
      case 34: return !!state.data.monthlySpending; // Monthly spending
      case 35: return true; // Lifetime spending - no validation needed
      case 36: return true; // Analyzing results - no validation needed
      case 37: return true; // Blood analysis - optional
      case 38: return true; // Symptoms - optional
      case 39: return true; // Medical conditions - optional
      case 40: return state.data.sleepSchedule.bedtime && state.data.sleepSchedule.wakeTime; // Lifestyle - sleep required
      case 41: return true; // Allergies and preferences - optional
      case 42: return true; // Health history - optional
      case 43: return true; // Family history - optional
      case 44: return true; // Advanced lifestyle - optional
      case 45: return true; // Community reviews - no validation needed
      case 46: return true; // Notifications - no validation needed
      case 47: return true; // Referral code - no validation needed
      case 48: return true; // Final commitment - no validation needed
      default: return true;
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center z-50 p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md mx-auto"
        >
          <Card className="relative overflow-hidden shadow-2xl border-0 bg-white/90 backdrop-blur-sm flex flex-col max-h-[90vh]">
            {/* Progress bar with back button */}
            <div className="px-6 pt-6 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                {/* Back button */}
                {state.currentStep > 0 && (
            <Button
              variant="ghost"
              size="sm"
                    onClick={handleBack}
                    className="w-8 h-8 p-0 hover:bg-gray-100 rounded-full border border-gray-300 flex-shrink-0"
            >
                    <ArrowLeft className="w-4 h-4" />
            </Button>
                )}
                
                {/* Progress bar */}
                <div className="flex-1 bg-gray-200 rounded-full h-1 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="px-6 flex-1 overflow-y-auto">
              <div className="min-h-[400px] flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={state.currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                    className="w-full"
                >
                  {currentStep?.component}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation buttons - Fixed at bottom */}
            {state.currentStep !== 46 && ( // Skip navigation for notification step
              <div className="flex gap-3 p-6 pt-4 flex-shrink-0 border-t bg-white">
              <Button
                onClick={handleNext}
                    className="w-full py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg text-white font-semibold"
                    disabled={(() => {
                      const isValid = isStepValid();
                      console.log('Button disabled state:', !isValid, 'isValid:', isValid);
                      return !isValid;
                    })()}
                  >
                    <span className="flex items-center gap-2">
                      {state.currentStep === onboardingSteps.length - 1 ? (
                        <>
                          Comenzar mi viaje
                          <CheckCircle className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          Continuar
                        </>
                      )}
                    </span>
              </Button>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};