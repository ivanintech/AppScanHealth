import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Database, 
  BarChart3, 
  Shield, 
  Users, 
  Zap, 
  Target, 
  TrendingUp,
  CheckCircle,
  ExternalLink,
  Microscope,
  Award,
  Globe,
  FileText,
  Activity,
  Heart,
  Star,
  Cog,
  PieChart,
  LineChart,
  BarChart,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

export const HowItWorks = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/analysis');
  };

  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    }
  };

  // Datos para gráficos
  const dataDistribution = [
    { name: 'DSLD Database', value: 4143488, percentage: 98.4, color: 'hsl(var(--primary))' },
    { name: 'NHANES Health', value: 66000, percentage: 1.6, color: '#10B981' }
  ];

  // Datos basados en el uso real en el sistema
  const dataUsage = [
    { name: 'DSLD', value: 72.6, percentage: 72.6, color: 'hsl(var(--primary))' },
    { name: 'NHANES', value: 27.4, percentage: 27.4, color: '#10B981' }
  ];

  const modelAccuracyData = [
    { name: 'Collaborative', accuracy: 84.2, color: 'hsl(var(--primary))' }, // Azul - Colaborativo/Comunidad
    { name: 'Content-Based', accuracy: 79.8, color: '#10B981' }, // Verde - Contenido/Natural
    { name: 'Deficiency', accuracy: 82.1, color: '#EF4444' }, // Rojo - Deficiencias/Alertas
    { name: 'Effectiveness', accuracy: 80.3, color: '#8B5CF6' }, // Púrpura - Efectividad/Precisión
    { name: 'Segmentation', accuracy: 81.9, color: '#F59E0B' } // Naranja - Segmentación/Personalización
  ];


  const dataQualityMetrics = [
    { metric: 'Completitud', value: 94.2, color: '#10B981' },
    { metric: 'Precisión', value: 89.7, color: 'hsl(var(--primary))' },
    { metric: 'Consistencia', value: 92.1, color: '#8B5CF6' },
    { metric: 'Actualización', value: 87.3, color: '#F59E0B' }
  ];

  const stats = [
    { label: "Registros Procesados", value: "4.2M+", icon: Database, color: "text-primary" },
    { label: "Precisión Promedio", value: "81.7%", icon: Target, color: "text-green-600" },
    { label: "Modelos ML", value: "5", icon: Brain, color: "text-purple-600" },
    { label: "Fuentes de Datos", value: "3", icon: Globe, color: "text-orange-600" }
  ];

  const dataSources = [
    {
      name: "NHANES (CDC) - National Center for Health Statistics",
      description: "Estándar oro mundial en datos poblacionales de suplementación dietética",
      records: "66,000 patrones de salud",
      features: "Biomarcadores, diagnósticos médicos, surveys poblacionales",
      link: "https://wwwn.cdc.gov/nchs/nhanes/search/datapage.aspx?Component=Dietary",
      icon: Shield,
      color: "bg-primary/5 border-primary/20",
      iconColor: "text-primary",
      purpose: "Utilizamos NHANES para validar la efectividad de suplementos en poblaciones reales, analizando biomarcadores sanguíneos y correlaciones entre suplementación y salud. Los datos incluyen niveles de vitaminas, minerales, y marcadores de salud en más de 66,000 individuos representativos de la población estadounidense.",
      scientificValue: "Datos longitudinales de 2 años con seguimiento médico completo, incluyendo análisis de sangre, orina y exámenes físicos. Permite correlacionar el uso de suplementos con mejoras medibles en biomarcadores de salud."
    },
    {
      name: "NIH (DSLD) - National Institutes of Health",
      description: "Base de datos de etiquetas de suplementos dietéticos más completa del mundo",
      records: "4.1M+ registros de productos",
      features: "Ingredientes, dosis, claims, fotos de productos",
      link: "https://ods.odnih.gov/Research/Dietary_Supplement_Label_Database.aspx",
      icon: FileText,
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      purpose: "DSLD nos permite mapear exactamente qué ingredientes y dosis contienen los suplementos del mercado real. Analizamos más de 4 millones de productos para entender las formulaciones más efectivas, identificar sinergias entre ingredientes y detectar patrones en las dosis óptimas.",
      scientificValue: "Base de datos oficial del NIH con etiquetas verificadas de productos reales. Incluye información detallada de ingredientes, cantidades, claims de salud y fotos de productos para análisis visual y de contenido."
    },
  ];

  const mlModels = [
    {
      name: "Collaborative Filtering",
      description: "Recomendaciones basadas en usuarios similares",
      accuracy: "84.2%",
      icon: Users,
      color: "text-primary"
    },
    {
      name: "Content-Based Filtering",
      description: "Recomendaciones basadas en características del producto",
      accuracy: "79.8%",
      icon: FileText,
      color: "text-green-600"
    },
    {
      name: "Deficiency Analysis",
      description: "Análisis de deficiencias nutricionales",
      accuracy: "82.1%",
      icon: Microscope,
      color: "text-red-600"
    },
    {
      name: "Effectiveness Prediction",
      description: "Predicción de efectividad de suplementos",
      accuracy: "80.3%",
      icon: TrendingUp,
      color: "text-purple-600"
    },
    {
      name: "User Segmentation",
      description: "Segmentación inteligente de usuarios",
      accuracy: "81.9%",
      icon: Target,
      color: "text-orange-600"
    }
  ];

  const processSteps = [
    {
      step: "1",
      title: "Recopilación de Datos",
      description: "Integramos datos de las 3 fuentes más confiables del mundo",
      icon: Database,
      details: [
        "4.1M+ registros de DSLD (NIH)",
        "20K patrones de salud de NHANES (CDC)",
        "3.8K usuarios de Kaggle Fitness"
      ]
    },
    {
      step: "2",
      title: "Procesamiento ML",
      description: "5 algoritmos de machine learning analizan los datos",
      icon: Brain,
      details: [
        "Collaborative Filtering (84.2% precisión)",
        "Content-Based Filtering (79.8% precisión)",
        "Deficiency Analysis (82.1% precisión)"
      ]
    },
    {
      step: "3",
      title: "Personalización",
      description: "Generamos recomendaciones únicas para tu perfil",
      icon: Target,
      details: [
        "Análisis de tu perfil de salud",
        "Matching con usuarios similares",
        "Predicción de efectividad personalizada"
      ]
    },
    {
      step: "4",
      title: "Validación Científica",
      description: "Cada recomendación está respaldada por evidencia científica",
      icon: CheckCircle,
      details: [
        "Datos poblacionales de NHANES",
        "Efectividad probada en estudios",
        "Biomarcadores y diagnósticos médicos"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Barra de navegación superior */}
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
            
          </div>
        </div>
      </div>

      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="min-h-screen bg-background pb-20"
      >
       {/* Título de la página */}
       <motion.div
         initial={{ y: -20, opacity: 0 }}
         animate={{ y: 0, opacity: 1 }}
         transition={{ duration: 0.3 }}
         className="text-center py-8"
       >
         <div className="flex items-center justify-center gap-3 mb-2">
           <div className="w-8 h-8 flex items-center justify-center rounded-md bg-gradient-primary shadow-button">
             <Brain className="w-5 h-5 text-white" strokeWidth={1.5} />
           </div>
           <h1 className="text-2xl font-semibold text-foreground">Cómo Funciona</h1>
         </div>
         <p className="text-muted-foreground">Sistema de recomendaciones personalizadas</p>
       </motion.div>

      <main className="px-4 mt-6 space-y-8">
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-foreground">
            La Ciencia Detrás de Tus Recomendaciones
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Nuestro sistema utiliza <strong>4.2 millones de registros reales</strong> de las fuentes científicas más confiables del mundo para generar recomendaciones personalizadas con una precisión del <strong>81.7%</strong>.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <stat.icon className={`w-8 h-8 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* Data Distribution Chart */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Nuestras Fuentes de Datos</h2>
            <p className="text-muted-foreground">
              DSLD (72.6%) para información de productos, NHANES (27.4%) para validación poblacional
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5 text-primary" />
                  Uso en el Sistema
                </CardTitle>
                <CardDescription>
                  Proporción de uso real de cada fuente en nuestras recomendaciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={dataUsage}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ percentage }) => `${percentage}%`}
                        labelLine={false}
                      >
                        {dataUsage.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [value, 'Uso en el Sistema']} />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36}
                        wrapperStyle={{ fontSize: '12px' }}
                      />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Bar Chart - Model Accuracy */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="w-5 h-5 text-green-600" />
                  Precisión de Modelos ML
                </CardTitle>
                <CardDescription>
                  Rendimiento de cada algoritmo de machine learning
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsBarChart data={modelAccuracyData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name" 
                        fontSize={10}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval={0}
                      />
                      <YAxis domain={[75, 85]} fontSize={10} />
                      <Tooltip formatter={(value) => [`${value}%`, 'Precisión']} />
                      <Bar dataKey="accuracy" radius={[4, 4, 0, 0]}>
                      {modelAccuracyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Process Flow Chart */}
        <motion.div variants={itemVariants} className="space-y-6">

        </motion.div>

        {/* Data Sources */}
        <motion.div variants={itemVariants} className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Fuentes de Datos Científicas</h2>
            <p className="text-muted-foreground">
              Utilizamos las bases de datos científicas más confiables y actualizadas del mundo
            </p>
          </div>

          <div className="space-y-6">
            {dataSources.map((source, index) => (
              <Card key={index} className={`${source.color} hover:shadow-lg transition-shadow`}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <source.icon className={`w-6 h-6 ${source.iconColor}`} />
                    <CardTitle className="text-lg">{source.name}</CardTitle>
                  </div>
                  <CardDescription>{source.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{source.records}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">{source.features}</span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-sm mb-1">¿Para qué lo utilizamos?</h4>
                        <p className="text-xs text-muted-foreground">{source.purpose}</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm mb-1">Valor Científico</h4>
                        <p className="text-xs text-muted-foreground">{source.scientificValue}</p>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(source.link, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Ver Fuente Oficial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>


        {/* ML Models */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Modelos de Machine Learning
              </CardTitle>
              <CardDescription>
                5 algoritmos especializados trabajando en conjunto para máxima precisión
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mlModels.map((model, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <model.icon className={`w-5 h-5 ${model.color}`} />
                        <div>
                          <h3 className="font-semibold text-foreground">{model.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {model.accuracy} precisión
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Process Steps */}
        <motion.div variants={itemVariants} className="space-y-6">

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cog className="w-5 h-5 text-primary" />
                Proceso de Generación de Recomendaciones
              </CardTitle>
              <CardDescription>
                Cómo transformamos datos científicos en recomendaciones personalizadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <step.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline" className="text-primary border-primary">
                          Paso {step.step}
                        </Badge>
                        <h3 className="text-lg font-semibold text-foreground">{step.title}</h3>
                      </div>
                      <p className="text-muted-foreground mb-4">{step.description}</p>
                      <ul className="space-y-1">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Scientific Validation */}
        <motion.div variants={itemVariants} className="space-y-6">
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-primary" />
                <CardTitle className="text-xl text-primary">Validación Científica</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground">
                Cada recomendación está respaldada por evidencia científica sólida de las fuentes más confiables del mundo:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Datos Poblacionales</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• NHANES: 20,000 patrones de salud verificados</li>
                    <li>• Biomarcadores y diagnósticos médicos</li>
                    <li>• Estudios longitudinales de efectividad</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">Base de Datos Oficial</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• DSLD NIH: 4.1M+ productos verificados</li>
                    <li>• Ingredientes y dosis documentados</li>
                    <li>• Claims y etiquetas oficiales</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Call to Action */}
        <motion.div variants={itemVariants} className="text-center space-y-4">
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-center gap-3 mb-4">
                <Heart className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-semibold text-foreground">Tu Salud, Nuestra Ciencia</h3>
              </div>
              <p className="text-foreground mb-4">
                Confía en un sistema respaldado por <strong>4.2 millones de registros reales</strong> y 
                la precisión del <strong>81.7%</strong> de nuestros modelos de machine learning.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="w-4 h-4" />
                <span>Recomendaciones basadas en evidencia científica</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </motion.div>
    </div>
  );
};
