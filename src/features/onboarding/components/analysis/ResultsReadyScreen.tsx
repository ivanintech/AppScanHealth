import { motion } from 'framer-motion'
import { BarChart3, ListChecks, TrendingUp, Leaf, Brain, Sun, Activity, Heart, Bone, Beef } from 'lucide-react'
import ProgressRing from '@/shared/components/ui/ProgressRing'

interface ResultsReadyScreenProps {
  onViewResults: () => void
}

export const ResultsReadyScreen = ({ onViewResults }: ResultsReadyScreenProps) => {
  const categoryIcons = {
    'Nutrición': { Icon: Leaf, color: '#22C55E' }, // green-500
    'Perfil': { Icon: Brain, color: '#8B5CF6' }, // purple-500
    'Actividad': { Icon: Activity, color: '#F97316' }, // orange-500
    'Digestión': { Icon: Heart, color: '#EF4444' }, // red-500
    'Sol y Estilo de vida': { Icon: Sun, color: '#EAB308' } // yellow-500
  }

  // Simular datos de categorías con puntuaciones
  const mainCategories = [
    { name: 'Nutrición', score: 85 },
    { name: 'Perfil', score: 78 },
    { name: 'Actividad', score: 92 },
    { name: 'Digestión', score: 73 },
    { name: 'Sol y Estilo de vida', score: 88 }
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col justify-center p-4"
    >
      <main className="w-full max-w-md mx-auto text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl font-bold text-gray-900 mb-4"
        >
          ¡Sus resultados están listos!
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-gray-600 max-w-md mx-auto mb-10"
        >
          Hemos analizado sus factores de salud y creado un perfil nutricional personalizado.
        </motion.p>

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex justify-center space-x-7 mb-10"
        >
          {mainCategories.map((category, index) => {
            const { Icon, color } = categoryIcons[category.name as keyof typeof categoryIcons]
            return (
              <motion.div
                key={category.name}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  duration: 0.8, 
                  delay: 0.5 + (index * 0.1),
                  type: "spring",
                  stiffness: 200
                }}
                className="relative w-14 h-14"
              >
                <ProgressRing 
                  percentage={category.score} 
                  color={color} 
                  strokeWidth={4} 
                  showText={false} 
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Icon size={24} style={{ color: color }} />
                </div>
              </motion.div>
            )
          })}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="space-y-4 text-left mb-10"
        >
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.9 }}
            className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <BarChart3 className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Análisis nutricional personalizado</h3>
              <p className="text-gray-600 text-sm">Basado en su estilo de vida, alimentación y factores de salud</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.0 }}
            className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <ListChecks className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Plan de suplementos práctico</h3>
              <p className="text-gray-600 text-sm">Recomendaciones prioritarias para sus necesidades específicas</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="bg-white p-4 rounded-lg shadow-md flex items-center space-x-4"
          >
            <div className="bg-blue-100 p-3 rounded-full">
              <TrendingUp className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Consejos para optimizar la salud</h3>
              <p className="text-gray-600 text-sm">Estrategias específicas para mejorar su bienestar</p>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.button
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 1.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onViewResults}
          className="w-full bg-primary text-white py-4 rounded-xl font-semibold flex items-center justify-center space-x-2 hover:bg-primary/90 transition-colors shadow-lg"
        >
          <span>Descubrir mis resultados</span>
          <TrendingUp size={20} />
        </motion.button>
      </main>
    </motion.div>
  )
}
