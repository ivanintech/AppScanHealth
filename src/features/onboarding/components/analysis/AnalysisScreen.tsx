import { useState, useEffect } from 'react'
import { Brain, Sun, Activity, Utensils, Heart, CheckCircle, BarChart3, ListChecks, TrendingUp, Leaf, Bone, Beef } from 'lucide-react'
import { motion } from 'framer-motion'
import ProgressRing from '@/shared/components/ui/ProgressRing'

const ANALYSIS_STEPS = [
  { 
    text: 'Analizando su perfil y objetivos...', 
    category: 'Perfil', 
    Icon: Brain, 
    color: 'purple', 
    duration: 2000 
  },
  { 
    text: 'Evaluando su estilo de vida...', 
    category: 'Sol y Estilo de vida', 
    Icon: Sun, 
    color: 'orange', 
    duration: 2000 
  },
  { 
    text: 'Calculando sus métricas de actividad...', 
    category: 'Actividad', 
    Icon: Activity, 
    color: 'red', 
    duration: 2000 
  },
  { 
    text: 'Revisando sus hábitos nutricionales...', 
    category: 'Nutrición', 
    Icon: Utensils, 
    color: 'green', 
    duration: 2500 
  },
  { 
    text: 'Verificando su salud digestiva...', 
    category: 'Digestión', 
    Icon: Heart, 
    color: 'blue', 
    duration: 2000 
  },
  { 
    text: 'Generando sus recomendaciones finales...', 
    category: 'Bio-específico', 
    Icon: CheckCircle, 
    color: 'sky', 
    duration: 2500 
  }
]

interface AnalysisScreenProps {
  onComplete: () => void
}

export const AnalysisScreen = ({ onComplete }: AnalysisScreenProps) => {
  const [analysisStep, setAnalysisStep] = useState(0)
  const [ringProgress, setRingProgress] = useState(0)

  useEffect(() => {
    let stepTimeout: NodeJS.Timeout
    let progressTimeout: NodeJS.Timeout
    let currentProgress = 0
    let targetProgress = 0

    // Función para simular progreso no lineal más realista
    const simulateRealisticProgress = (stepIndex: number) => {
      if (stepIndex < ANALYSIS_STEPS.length) {
        setAnalysisStep(stepIndex)
        
        // Calcular progreso objetivo para este paso (no lineal)
        const stepProgress = [
          { min: 0, max: 15 },    // Paso 1: 0-15%
          { min: 15, max: 35 },   // Paso 2: 15-35%
          { min: 35, max: 55 },   // Paso 3: 35-55%
          { min: 55, max: 75 },   // Paso 4: 55-75%
          { min: 75, max: 90 },   // Paso 5: 75-90%
          { min: 90, max: 100 }   // Paso 6: 90-100%
        ]
        
        const step = stepProgress[stepIndex]
        targetProgress = step.min + Math.random() * (step.max - step.min)
        
        // Simular avance gradual con pausas realistas
        const animateProgress = () => {
          if (currentProgress < targetProgress) {
            // Avance variable: a veces más rápido, a veces más lento
            const increment = Math.random() * 3 + 0.5 // Entre 0.5 y 3.5%
            currentProgress = Math.min(currentProgress + increment, targetProgress)
            setRingProgress(Math.round(currentProgress))
            
            // Pausa variable entre actualizaciones (50-200ms)
            const nextDelay = Math.random() * 150 + 50
            progressTimeout = setTimeout(animateProgress, nextDelay)
          } else {
            // Avanzar al siguiente paso después de una pausa
            const stepDelay = ANALYSIS_STEPS[stepIndex].duration + Math.random() * 500
            stepTimeout = setTimeout(() => {
              simulateRealisticProgress(stepIndex + 1)
            }, stepDelay)
          }
        }
        
        animateProgress()
      } else {
        // Finalizar análisis
        setRingProgress(100)
        setTimeout(() => {
          onComplete()
        }, 800)
      }
    }

    // Iniciar el proceso
    simulateRealisticProgress(0)

    return () => {
      clearTimeout(stepTimeout)
      clearTimeout(progressTimeout)
    }
  }, [onComplete])

  const currentStep = ANALYSIS_STEPS[analysisStep] || ANALYSIS_STEPS[ANALYSIS_STEPS.length - 1]
  
  const colorVariants = {
    purple: { bg: 'from-purple-50', text: 'text-purple-600', ring: '#8B5CF6', dot: 'bg-purple-500' },
    orange: { bg: 'from-orange-50', text: 'text-orange-600', ring: '#F97316', dot: 'bg-orange-500' },
    red: { bg: 'from-red-50', text: 'text-red-600', ring: '#EF4444', dot: 'bg-red-500' },
    green: { bg: 'from-green-50', text: 'text-green-600', ring: '#22C55E', dot: 'bg-green-500' },
    blue: { bg: 'from-blue-50', text: 'text-blue-600', ring: '#3B82F6', dot: 'bg-blue-500' },
    sky: { bg: 'from-sky-50', text: 'text-sky-600', ring: '#0EA5E9', dot: 'bg-sky-500' },
  }
  const colors = colorVariants[currentStep.color as keyof typeof colorVariants]

  return (
    <div className={`min-h-screen bg-gradient-to-b ${colors.bg} to-white flex flex-col items-center justify-center p-4 transition-all duration-500`}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ProgressRing 
            percentage={ringProgress} 
            className="w-48 h-48" 
            strokeWidth={12}
            color={colors.ring}
          />
        </motion.div>

        <div className="flex space-x-2 my-8">
          {ANALYSIS_STEPS.map((_, index) => (
            <motion.div
              key={index}
              initial={{ scale: 0.8 }}
              animate={{ scale: index === analysisStep ? 1.2 : 1 }}
              transition={{ duration: 0.3 }}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === analysisStep ? colors.dot : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-white rounded-lg p-6 shadow-lg w-full max-w-sm flex items-center space-x-4 mb-4"
        >
          <currentStep.Icon size={24} className={colors.text} />
          <p className="text-gray-800 font-medium">{currentStep.text}</p>
        </motion.div>
        
        <motion.h2
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`text-xl font-bold ${colors.text} mb-2`}
        >
          {currentStep.category}
        </motion.h2>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-gray-600"
        >
          Creando su perfil nutricional personalizado
        </motion.p>
      </div>
    </div>
  )
}
