import React, { useState } from 'react';
import { Card } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/shared/components/ui/radio-group';
import { Label } from '@/shared/components/ui/label';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { motion } from 'framer-motion';
import {
  Stethoscope,
  Heart,
  Brain,
  Shield,
  Sun,
  Moon,
  Activity,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowRight,
  ArrowLeft,
  FlaskConical,
  Pill,
  Clock,
  MapPin,
  Briefcase,
  Utensils,
  Zap
} from 'lucide-react';

interface NutritionalQuestionsProps {
  onComplete: (answers: NutritionalAnswers) => void;
  onBack: () => void;
}

interface NutritionalAnswers {
  // Análisis de sangre
  hasBloodTest: boolean;
  bloodTestDate: string;
  bloodTestResults: string[];
  
  // Síntomas específicos
  symptoms: string[];
  otherSymptoms: string;
  
  // Condiciones médicas
  medicalConditions: string[];
  medications: string[];
  
  // Estilo de vida
  sleepSchedule: {
    bedtime: string;
    wakeTime: string;
  };
  activityLevel: string;
  workType: string;
  environment: string;
  
  // Alergias y preferencias
  allergies: string[];
  supplementPreferences: string[];
  currentSupplements: string[];
}

export const NutritionalQuestions: React.FC<NutritionalQuestionsProps> = ({
  onComplete,
  onBack
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<NutritionalAnswers>({
    hasBloodTest: false,
    bloodTestDate: '',
    bloodTestResults: [],
    symptoms: [],
    otherSymptoms: '',
    medicalConditions: [],
    medications: [],
    sleepSchedule: { bedtime: '', wakeTime: '' },
    activityLevel: '',
    workType: '',
    environment: '',
    allergies: [],
    supplementPreferences: [],
    currentSupplements: []
  });

  const updateAnswer = (field: keyof NutritionalAnswers, value: any) => {
    setAnswers(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateArrayAnswer = (field: keyof NutritionalAnswers, value: string, checked: boolean) => {
    setAnswers(prev => {
      const currentArray = prev[field] as string[];
      if (checked) {
        return { ...prev, [field]: [...currentArray, value] };
      } else {
        return { ...prev, [field]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const steps = [
    // Step 1: Análisis de sangre
    {
      title: "Análisis de sangre y biomarcadores",
      subtitle: "Los resultados nos ayudan a identificar deficiencias específicas y crear un plan más preciso",
      component: (
        <div className="space-y-6">
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
            value={answers.hasBloodTest ? 'yes' : 'no'}
            onValueChange={(value) => updateAnswer('hasBloodTest', value === 'yes')}
            className="space-y-4"
          >
            <div>
              <Label
                htmlFor="yes"
                className={`flex items-center space-x-4 p-5 rounded-xl cursor-pointer transition-all duration-200 ${
                  answers.hasBloodTest
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
                  !answers.hasBloodTest
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

          {answers.hasBloodTest && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Fecha del análisis</Label>
                <Input
                  type="date"
                  value={answers.bloodTestDate}
                  onChange={(e) => updateAnswer('bloodTestDate', e.target.value)}
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
                      <Checkbox
                        id={test}
                        checked={answers.bloodTestResults.includes(test)}
                        onCheckedChange={(checked) => 
                          updateArrayAnswer('bloodTestResults', test, checked as boolean)
                        }
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

    // Step 2: Síntomas
    {
      title: "Síntomas y señales de deficiencias",
      subtitle: "Los síntomas pueden indicar deficiencias nutricionales específicas",
      component: (
        <div className="space-y-6">
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
              { id: 'fatigue', label: 'Fatiga constante', icon: Zap },
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
                <Checkbox
                  id={symptom.id}
                  checked={answers.symptoms.includes(symptom.id)}
                  onCheckedChange={(checked) => 
                    updateArrayAnswer('symptoms', symptom.id, checked as boolean)
                  }
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
              value={answers.otherSymptoms}
              onChange={(e) => updateAnswer('otherSymptoms', e.target.value)}
              placeholder="Describe otros síntomas que experimentas"
              className="text-center py-4"
            />
          </div>
        </div>
      )
    },

    // Step 3: Condiciones médicas
    {
      title: "Condiciones médicas y medicamentos",
      subtitle: "Importante para evitar interacciones",
      component: (
        <div className="space-y-6">
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
                    <Checkbox
                      id={condition}
                      checked={answers.medicalConditions.includes(condition)}
                      onCheckedChange={(checked) => 
                        updateArrayAnswer('medicalConditions', condition, checked as boolean)
                      }
                    />
                    <Label htmlFor={condition} className="text-sm">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Medicamentos actuales (opcional)</Label>
              <Input
                value={answers.medications.join(', ')}
                onChange={(e) => updateAnswer('medications', e.target.value.split(', ').filter(m => m.trim()))}
                placeholder="Ej: Metformina, Omeprazol, etc."
                className="text-center py-4"
              />
            </div>
          </div>
        </div>
      )
    },

    // Step 4: Estilo de vida
    {
      title: "Estilo de vida y trabajo",
      subtitle: "Factores que afectan tus necesidades nutricionales",
      component: (
        <div className="space-y-6">
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
                    value={answers.sleepSchedule.bedtime}
                    onChange={(e) => updateAnswer('sleepSchedule', {
                      ...answers.sleepSchedule,
                      bedtime: e.target.value
                    })}
                    className="text-center py-4"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Hora de despertar</Label>
                  <Input
                    type="time"
                    value={answers.sleepSchedule.wakeTime}
                    onChange={(e) => updateAnswer('sleepSchedule', {
                      ...answers.sleepSchedule,
                      wakeTime: e.target.value
                    })}
                    className="text-center py-4"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Tipo de trabajo</Label>
              <RadioGroup
                value={answers.workType}
                onValueChange={(value) => updateAnswer('workType', value)}
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
                        answers.workType === option.value
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
                value={answers.environment}
                onValueChange={(value) => updateAnswer('environment', value)}
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
                        answers.environment === option.value
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

    // Step 5: Hábitos específicos
    {
      title: "Hábitos específicos y factores de riesgo",
      subtitle: "Información detallada para un análisis más preciso",
      component: (
        <div className="space-y-6">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-full flex items-center justify-center">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-foreground">
              Hábitos Específicos
            </h2>
            <p className="text-muted-foreground">
              Información detallada sobre tu estilo de vida
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">¿Trabajas en turnos nocturnos o rotativos?</Label>
              <RadioGroup
                value={answers.workType}
                onValueChange={(value) => updateAnswer('workType', value)}
                className="space-y-3"
              >
                {[
                  { value: 'day', label: 'Solo turno diurno', icon: Sun },
                  { value: 'night', label: 'Turnos nocturnos', icon: Moon },
                  { value: 'rotating', label: 'Turnos rotativos', icon: Clock },
                  { value: 'irregular', label: 'Horarios irregulares', icon: AlertTriangle }
                ].map((option) => (
                  <div key={option.value}>
                    <Label
                      htmlFor={option.value}
                      className={`flex items-center space-x-4 p-4 rounded-xl cursor-pointer transition-all duration-200 ${
                        answers.workType === option.value
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
              <Label className="text-sm font-medium mb-2 block">¿Tienes exposición a contaminantes?</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Contaminación del aire',
                  'Productos químicos',
                  'Radiación',
                  'Ruido excesivo',
                  'Ninguna'
                ].map((exposure) => (
                  <div key={exposure} className="flex items-center space-x-2">
                    <Checkbox
                      id={exposure}
                      checked={answers.medicalConditions.includes(exposure)}
                      onCheckedChange={(checked) => 
                        updateArrayAnswer('medicalConditions', exposure, checked as boolean)
                      }
                    />
                    <Label htmlFor={exposure} className="text-sm">{exposure}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">¿Tienes antecedentes familiares de?</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  'Diabetes',
                  'Enfermedades cardíacas',
                  'Cáncer',
                  'Osteoporosis',
                  'Alzheimer',
                  'Depresión',
                  'Ninguna'
                ].map((condition) => (
                  <div key={condition} className="flex items-center space-x-2">
                    <Checkbox
                      id={condition}
                      checked={answers.medicalConditions.includes(condition)}
                      onCheckedChange={(checked) => 
                        updateArrayAnswer('medicalConditions', condition, checked as boolean)
                      }
                    />
                    <Label htmlFor={condition} className="text-sm">{condition}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },

    // Step 6: Alergias y preferencias
    {
      title: "Alergias y preferencias de suplementos",
      subtitle: "Para recomendaciones personalizadas",
      component: (
        <div className="space-y-6">
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
                    <Checkbox
                      id={allergy}
                      checked={answers.allergies.includes(allergy)}
                      onCheckedChange={(checked) => 
                        updateArrayAnswer('allergies', allergy, checked as boolean)
                      }
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
                    <Checkbox
                      id={format}
                      checked={answers.supplementPreferences.includes(format)}
                      onCheckedChange={(checked) => 
                        updateArrayAnswer('supplementPreferences', format, checked as boolean)
                      }
                    />
                    <Label htmlFor={format} className="text-sm">{format}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Suplementos que tomas actualmente</Label>
              <Input
                value={answers.currentSupplements.join(', ')}
                onChange={(e) => updateAnswer('currentSupplements', e.target.value.split(', ').filter(s => s.trim()))}
                placeholder="Ej: Multivitamínico, Omega-3, etc."
                className="text-center py-4"
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(answers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0: return true; // Análisis de sangre es opcional
      case 1: return true; // Síntomas son opcionales
      case 2: return true; // Condiciones médicas son opcionales
      case 3: return answers.sleepSchedule.bedtime && answers.sleepSchedule.wakeTime;
      case 4: return true; // Hábitos específicos son opcionales
      case 5: return true; // Preferencias son opcionales
      default: return true;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        {/* Progress bar */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="w-8 h-8 p-0 hover:bg-gray-100 rounded-full border border-gray-300 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>
          
          <div className="text-center">
            <span className="text-sm text-gray-500">
              Paso {currentStep + 1} de {steps.length}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {steps[currentStep].component}
          </motion.div>

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="flex-1 py-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 border-0 shadow-lg text-white font-semibold"
            >
              <span className="flex items-center gap-2">
                {currentStep === steps.length - 1 ? (
                  <>
                    Completar análisis
                    <CheckCircle className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
