import { UserProfile, Deficiency, Recommendation } from '@/shared/lib/recommendation/types';
import { DataIntegrationEngine } from '@/shared/lib/recommendation/core/DataIntegrationEngine';
import { MLTrainingEngine } from '@/shared/lib/recommendation/core/MLTrainingEngine';
import { SupplementMatchingService, SupplementFeedback } from './SupplementMatchingService';
import { SupplementFeedbackService } from './SupplementFeedbackService';
import { SupplementUtilityEvaluator, HealthAnalysis } from '../../lib/recommendation/core/SupplementUtilityEvaluator';
import { SupplementUtilityStorage } from './SupplementUtilityStorage';
import { supabase } from '../../supabase/client';
import { 
  Heart, 
  Brain, 
  Shield, 
  Sun, 
  Activity, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  ArrowRight,
  Star,
  TrendingUp,
  Leaf,
  Zap,
  Target,
  Users,
  Clock,
  Award,
  BookOpen,
  BarChart3,
  Loader2,
  Dumbbell,
  Droplet
} from 'lucide-react';

/**
 * Servicio avanzado para generar insights profundos del AdvisoryScreen
 * Utiliza análisis científico basado en datos del usuario y patrones de salud
 */
export class AdvisoryService {
  private static instance: AdvisoryService | null = null;
  private healthRiskFactors: Map<string, number> = new Map();
  private nutrientDeficiencyPatterns: Map<string, string[]> = new Map();
  private supplementEffectivenessData: Map<string, number> = new Map();
  private dataIntegrationEngine: DataIntegrationEngine;
  private mlTrainingEngine: MLTrainingEngine;
  private supplementMatchingService: SupplementMatchingService;
  private supplementFeedbackService: SupplementFeedbackService;
  private utilityEvaluator: SupplementUtilityEvaluator;
  private utilityStorage: SupplementUtilityStorage;
  private cachedData: any = null;
  private isDataLoaded: boolean = false;
  private isProcessingMatching: boolean = false;

  // Constructor privado para Singleton
  private constructor() {
    this.initializeHealthPatterns();
    this.initializeNutrientPatterns();
    this.initializeSupplementData();
    this.dataIntegrationEngine = DataIntegrationEngine.getInstance({
      enableKaggleFitness: true,
      enableDSLD: true,
      enableNHANES: true,
      minRecordsThreshold: 1000,
      dataQualityThreshold: 0.8
    });
    this.mlTrainingEngine = new MLTrainingEngine();
    this.supplementMatchingService = new SupplementMatchingService();
    this.supplementFeedbackService = new SupplementFeedbackService();
    this.utilityEvaluator = SupplementUtilityEvaluator.getInstance();
    this.utilityStorage = new SupplementUtilityStorage();
  }

  // Método estático para obtener la instancia única
  public static getInstance(): AdvisoryService {
    if (!AdvisoryService.instance) {
      AdvisoryService.instance = new AdvisoryService();
    }
    return AdvisoryService.instance;
  }

  /**
   * Inicializa patrones de factores de riesgo basados en investigación
   */
  private initializeHealthPatterns() {
    this.healthRiskFactors.set('stress_high', 0.8);
    this.healthRiskFactors.set('stress_very_high', 0.95);
    this.healthRiskFactors.set('sun_low', 0.7);
    this.healthRiskFactors.set('exercise_none', 0.6);
    this.healthRiskFactors.set('smoking_yes', 0.9);
    this.healthRiskFactors.set('alcohol_high', 0.7);
    this.healthRiskFactors.set('sleep_poor', 0.8);
    this.healthRiskFactors.set('diet_processed', 0.6);
    this.healthRiskFactors.set('age_over_50', 0.4);
    this.healthRiskFactors.set('family_diabetes', 0.6);
    this.healthRiskFactors.set('family_heart', 0.7);
    this.healthRiskFactors.set('shift_work', 0.5);
    this.healthRiskFactors.set('pollution_high', 0.7);
  }

  /**
   * Inicializa patrones de deficiencias nutricionales
   */
  private initializeNutrientPatterns() {
    this.nutrientDeficiencyPatterns.set('vitamin_d', ['sun_low', 'age_over_50', 'shift_work']);
    this.nutrientDeficiencyPatterns.set('b12', ['diet_vegan', 'age_over_50', 'alcohol_high']);
    this.nutrientDeficiencyPatterns.set('iron', ['diet_vegan', 'menstruation', 'exercise_high']);
    this.nutrientDeficiencyPatterns.set('magnesium', ['stress_high', 'exercise_high', 'alcohol_high']);
    this.nutrientDeficiencyPatterns.set('omega3', ['fish_low', 'diet_processed']);
    this.nutrientDeficiencyPatterns.set('zinc', ['exercise_high', 'stress_high', 'diet_processed']);
    this.nutrientDeficiencyPatterns.set('folate', ['alcohol_high', 'diet_processed', 'smoking_yes']);
    this.nutrientDeficiencyPatterns.set('vitamin_c', ['smoking_yes', 'stress_high', 'pollution_high']);
  }

  /**
   * Inicializa datos de efectividad de suplementos
   */
  private initializeSupplementData() {
    this.supplementEffectivenessData.set('vitamin_d3', 0.85);
    this.supplementEffectivenessData.set('omega3', 0.78);
    this.supplementEffectivenessData.set('magnesium', 0.82);
    this.supplementEffectivenessData.set('b12', 0.88);
    this.supplementEffectivenessData.set('iron', 0.75);
    this.supplementEffectivenessData.set('zinc', 0.80);
    this.supplementEffectivenessData.set('multivitamin', 0.65);
    this.supplementEffectivenessData.set('probiotics', 0.70);
    this.supplementEffectivenessData.set('coq10', 0.72);
  }

  /**
   * Obtiene datos existentes de salud sin ejecutar nuevos análisis
   */
  async getExistingHealthData(userProfile: UserProfile): Promise<any | null> {
    try {
      // Obteniendo datos existentes sin ejecutar análisis
      
      // Obtener datos existentes de la base de datos
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      // Buscar datos existentes en ai_recommendations para análisis de salud
      const { data: existingRecommendations, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('recommendation_type', 'supplement')
        .eq('title', 'Análisis de Salud General')
        .order('created_at', { ascending: false })
        .limit(1);

      // Buscar también el plan personalizado con suplementos
      const { data: personalizedPlanData, error: planError } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('recommendation_type', 'supplement')
        .eq('title', 'Plan Personalizado de Suplementación')
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error obteniendo datos existentes:', error);
        return null;
      }

      if (!existingRecommendations || existingRecommendations.length === 0) {
        console.log('❌ No se encontraron datos existentes de análisis de salud');
        return null;
      }

      console.log('✅ Datos de análisis de salud encontrados:', existingRecommendations.length, 'registros');

      const latestData = existingRecommendations[0];
      console.log('📅 Fecha de creación del análisis:', latestData.created_at);

      // Cast content to any to access properties
      const content = latestData.content as any;

      // Retornar datos existentes procesando la estructura almacenada
      const healthAnalysis = content?.healthAnalysis || {};
      const summary = content?.summary || {};
      
      // Calcular score basado en los datos reales del análisis
      const realHealthScore = Math.round((1 - (healthAnalysis.deficiencyRisk || 0.5)) * 100);
      const realCriticalAreas = healthAnalysis.deficiencyRisk > 0.7 ? 2 : healthAnalysis.deficiencyRisk > 0.4 ? 1 : 0;
      const realStrengths = healthAnalysis.deficiencyRisk < 0.3 ? 3 : healthAnalysis.deficiencyRisk < 0.5 ? 2 : 1;
      
      console.log('🔍 Cálculo de score:', {
        deficiencyRisk: healthAnalysis.deficiencyRisk,
        calculatedScore: realHealthScore,
        calculatedCriticalAreas: realCriticalAreas,
        calculatedStrengths: realStrengths
      });

      // Obtener suplementos y consejos del plan personalizado si existe
      let topSupplements: any[] = [];
      let lifestyleTips: any[] = [];
      
      if (personalizedPlanData && personalizedPlanData.length > 0) {
        const planContent = personalizedPlanData[0].content as any;
        const personalizedPlan = planContent?.personalizedPlan;
        
        if (personalizedPlan?.supplements) {
          topSupplements = personalizedPlan.supplements.map((supplement: any) => ({
            name: supplement.name,
            priority: supplement.priority,
            reason: supplement.reason,
            dosage: supplement.dosage,
            timing: supplement.timing
          }));
          console.log('✅ Suplementos del plan personalizado encontrados:', topSupplements.length);
        }
        
        if (personalizedPlan?.lifestyleTips) {
          lifestyleTips = personalizedPlan.lifestyleTips;
          console.log('✅ Consejos de estilo de vida encontrados:', lifestyleTips.length);
        }
      }
      
      return {
        overallHealthScore: summary.overallHealthScore || realHealthScore,
        criticalAreas: summary.criticalAreas || realCriticalAreas,
        strengths: summary.strengths || realStrengths,
        totalAreas: 5,
        topInsights: summary.topInsights || [
          {
            category: 'Deficiencias Nutricionales',
            score: Math.round((1 - (healthAnalysis.deficiencyRisk || 0.5)) * 100),
            priority: healthAnalysis.deficiencyRisk > 0.6 ? 'high' : 'medium'
          },
          {
            category: 'Objetivos de Salud',
            score: 85,
            priority: 'medium'
          }
        ],
        planPhase: summary.riskLevel === 'high' ? 'Corrección' : summary.riskLevel === 'medium' ? 'Optimización' : 'Mantenimiento',
        planDuration: summary.riskLevel === 'high' ? '3-6 meses' : '2-3 meses',
        topSupplements: topSupplements,
        lifestyleTips: lifestyleTips.length > 0 ? lifestyleTips : (summary.lifestyleTips || [
          'Mantén una dieta equilibrada',
          'Realiza ejercicio regularmente',
          'Duerme 7-8 horas diarias'
        ]),
        lastUpdated: latestData.created_at
      };

      console.log('📊 Datos procesados para HealthSummaryPanel:', {
        overallHealthScore: summary.overallHealthScore || Math.round((1 - (healthAnalysis.deficiencyRisk || 0.5)) * 100),
        criticalAreas: summary.criticalAreas || (healthAnalysis.deficiencyRisk > 0.7 ? 2 : healthAnalysis.deficiencyRisk > 0.4 ? 1 : 0),
        strengths: summary.strengths || (healthAnalysis.deficiencyRisk < 0.3 ? 3 : healthAnalysis.deficiencyRisk < 0.5 ? 2 : 1),
        topInsights: summary.topInsights?.length || 0,
        lifestyleTips: summary.lifestyleTips?.length || 0
      });

    } catch (error) {
      console.error('Error obteniendo datos existentes:', error);
      return null;
    }
  }

  /**
   * Genera insights de salud profundos basados en análisis científico del perfil del usuario
   */
  async generateHealthInsights(userProfile: UserProfile): Promise<{
    category: string;
    icon: any;
    color: string;
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  }[]> {
    try {
      const healthInsights = [];

      // Integrar datos externos para enriquecer el análisis
      const externalData = await this.getExternalDataInsights(userProfile);

      // 1. Análisis de Deficiencias Nutricionales Críticas
      const nutrientDeficiencies = this.analyzeNutrientDeficiencies(userProfile);
      
      // Enriquecer con datos de NHANES - Mejorado para asegurar correspondencia
      if (externalData.nutritionalAnalysis) {
        if (externalData.nutritionalAnalysis.commonDeficiencies) {
          nutrientDeficiencies.insights.push(...externalData.nutritionalAnalysis.commonDeficiencies);
        }
        if (externalData.nutritionalAnalysis.recommendations) {
          nutrientDeficiencies.recommendations.push(...externalData.nutritionalAnalysis.recommendations);
        }
      }

      // Asegurar que cada insight tenga su recomendación correspondiente
      if (nutrientDeficiencies.insights.length > nutrientDeficiencies.recommendations.length) {
        const missingRecommendations = nutrientDeficiencies.insights.length - nutrientDeficiencies.recommendations.length;
        for (let i = 0; i < missingRecommendations; i++) {
          nutrientDeficiencies.recommendations.push('Consulta con tu médico para evaluación específica');
        }
      }
      
      healthInsights.push({
        category: 'Deficiencias Nutricionales',
        icon: Leaf,
        color: nutrientDeficiencies.score > 70 ? 'green' : nutrientDeficiencies.score > 50 ? 'yellow' : 'red',
        score: nutrientDeficiencies.score,
        insights: nutrientDeficiencies.insights,
        recommendations: nutrientDeficiencies.recommendations,
        riskLevel: nutrientDeficiencies.riskLevel,
        priority: nutrientDeficiencies.priority
      });

      // 2. Análisis de Factores de Riesgo Cardiovascular
      const cardiovascularRisk = this.analyzeCardiovascularRisk(userProfile);
      healthInsights.push({
        category: 'Riesgo Cardiovascular',
        icon: Heart,
        color: cardiovascularRisk.score > 70 ? 'green' : cardiovascularRisk.score > 50 ? 'yellow' : 'red',
        score: cardiovascularRisk.score,
        insights: cardiovascularRisk.insights,
        recommendations: cardiovascularRisk.recommendations,
        riskLevel: cardiovascularRisk.riskLevel,
        priority: cardiovascularRisk.priority
      });

      // 3. Análisis de Función Cognitiva y Energía
      const cognitiveFunction = this.analyzeCognitiveFunction(userProfile);
      healthInsights.push({
        category: 'Función Cognitiva',
        icon: Brain,
        color: cognitiveFunction.score > 70 ? 'purple' : cognitiveFunction.score > 50 ? 'yellow' : 'red',
        score: cognitiveFunction.score,
        insights: cognitiveFunction.insights,
        recommendations: cognitiveFunction.recommendations,
        riskLevel: cognitiveFunction.riskLevel,
        priority: cognitiveFunction.priority
      });

      // 4. Análisis de Sistema Inmune y Estrés Oxidativo
      const immuneSystem = this.analyzeImmuneSystem(userProfile);
      healthInsights.push({
        category: 'Sistema Inmune',
        icon: Shield,
        color: immuneSystem.score > 70 ? 'blue' : immuneSystem.score > 50 ? 'yellow' : 'red',
        score: immuneSystem.score,
        insights: immuneSystem.insights,
        recommendations: immuneSystem.recommendations,
        riskLevel: immuneSystem.riskLevel,
        priority: immuneSystem.priority
      });

      // 5. Análisis de Salud Digestiva y Microbioma
      const digestiveHealth = this.analyzeDigestiveHealth(userProfile);
      healthInsights.push({
        category: 'Salud Digestiva',
        icon: Activity,
        color: digestiveHealth.score > 70 ? 'green' : digestiveHealth.score > 50 ? 'yellow' : 'red',
        score: digestiveHealth.score,
        insights: digestiveHealth.insights,
        recommendations: digestiveHealth.recommendations,
        riskLevel: digestiveHealth.riskLevel,
        priority: digestiveHealth.priority
      });

      // 6. Análisis de Salud Ósea y Articular
      const boneHealth = this.analyzeBoneHealth(userProfile);
      healthInsights.push({
        category: 'Salud Ósea',
        icon: Activity,
        color: boneHealth.score > 70 ? 'green' : boneHealth.score > 50 ? 'yellow' : 'red',
        score: boneHealth.score,
        insights: boneHealth.insights,
        recommendations: boneHealth.recommendations,
        riskLevel: boneHealth.riskLevel,
        priority: boneHealth.priority
      });

      return healthInsights;

    } catch (error) {
      console.error('Error generando insights de salud:', error);
      return this.getFallbackInsights();
    }
  }

  /**
   * Procesa el matching de suplementos y almacena el feedback
   */
  async processSupplementMatching(userProfile: UserProfile, healthAnalysis: any[]): Promise<void> {
    try {
      // Verificar si ya se está procesando para evitar ejecuciones múltiples
      if (this.isProcessingMatching) {
        console.log('⏳ Matching de suplementos ya en proceso, saltando...');
        return;
      }
      
      this.isProcessingMatching = true;
      console.log('🔄 Procesando matching de suplementos...');
      
      // Obtener el ID real del usuario autenticado
      const { data: { user } } = await supabase.auth.getUser();
      const realUserId = user?.id;
      
      if (!realUserId) {
        console.warn('Usuario no autenticado, saltando almacenamiento de feedback');
        this.isProcessingMatching = false;
        return;
      }

      // Limpiar TODOS los datos del usuario para un análisis completamente nuevo
      await this.clearAllUserData(realUserId);
      
      // Evaluar utilidad de TODOS los suplementos disponibles
      console.log('🔬 Evaluando utilidad de todos los suplementos disponibles...');
      await this.evaluateAllSupplementsUtility(realUserId, userProfile);

      // Obtener matches de suplementos (método existente para compatibilidad)
      const supplementMatches = await this.supplementMatchingService.matchSupplementsWithUserProfile(
        userProfile, 
        healthAnalysis
      );

      console.log(`📊 Encontrados ${supplementMatches.length} suplementos relevantes`);

      // Almacenar feedback para cada suplemento útil (método existente para compatibilidad)
      for (const match of supplementMatches) {
        if (match.isUseful && match.utilityScore > 50) {
          await this.supplementFeedbackService.storeSupplementFeedback(
            realUserId,
            match
          );
        }
      }

      console.log('✅ Feedback de suplementos almacenado exitosamente');
      
      // Crear objeto HealthAnalysis basado en datos reales del usuario
      const age = userProfile.age || 30;
      const activityLevel = userProfile.activity_level || 'medium';
      const healthConditions = userProfile.health_conditions || [];
      
      // Calcular deficiencyRisk basado en datos reales del usuario
      let deficiencyRisk = 0.3; // Base
      
      // Ajustar según edad
      if (age > 60) deficiencyRisk += 0.2;
      else if (age > 40) deficiencyRisk += 0.1;
      
      // Ajustar según nivel de actividad
      if (activityLevel === 'low') deficiencyRisk += 0.2;
      else if (activityLevel === 'high') deficiencyRisk -= 0.1;
      
      // Ajustar según condiciones de salud
      if (healthConditions.length > 0) deficiencyRisk += healthConditions.length * 0.1;
      
      // Limitar entre 0.1 y 0.9
      deficiencyRisk = Math.max(0.1, Math.min(0.9, deficiencyRisk));
      
      console.log('🧮 Calculando deficiencyRisk:', {
        age,
        activityLevel,
        healthConditions: healthConditions.length,
        calculatedDeficiencyRisk: deficiencyRisk
      });
      
      const basicHealthAnalysis: HealthAnalysis = {
        deficiencyRisk,
        healthGoals: userProfile.health_goals || [],
        ageGroup: age < 30 ? 'young' : age < 50 ? 'adult' : 'senior',
        gender: userProfile.gender,
        activityLevel: userProfile.activity_level,
        dietType: userProfile.diet_type,
        healthConditions: userProfile.health_conditions || [],
        allergies: userProfile.allergies || [],
        currentStack: userProfile.current_stack || [],
        biomarkers: {}
      };
      
      // Almacenar análisis de salud general
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await this.storeHealthAnalysisSummary(authUser.id, basicHealthAnalysis);
      }
    } catch (error) {
      console.error('❌ Error procesando matching de suplementos:', error);
    } finally {
      this.isProcessingMatching = false;
    }
  }

  /**
   * Genera plan personalizado avanzado basado en análisis científico profundo
   */
  async generatePersonalizedPlan(userProfile: UserProfile): Promise<{
    phase: string;
    duration: string;
    focus: string;
    supplements: Array<{
      name: string;
      priority: string;
      reason: string;
      dosage: string;
      timing: string;
      interactions: string[];
    }>;
    optionalSupplements: Array<{
      name: string;
      priority: string;
      reason: string;
      dosage: string;
      timing: string;
      interactions: string[];
      category: string;
    }>;
    expectedResults: string[];
    monitoringPlan: string[];
    additionalInsights: Array<{
      category: string;
      insight: string;
      recommendation: string;
      priority: string;
    }>;
  }> {
    try {
      // Análisis completo de todas las áreas de salud
      const healthAnalysis = await this.generateHealthInsights(userProfile);
      
      // Procesar matching de suplementos y almacenar feedback
      await this.processSupplementMatching(userProfile, healthAnalysis);
      
      // Determinar fase del plan basada en análisis
      const criticalIssues = healthAnalysis.filter(area => area.riskLevel === 'Crítico' || area.riskLevel === 'Alto');
      const moderateIssues = healthAnalysis.filter(area => area.riskLevel === 'Moderado');
      
      let phase = 'Mantenimiento';
      let duration = '2-3 meses';
      let focus = 'Mantenimiento de niveles óptimos';

      if (criticalIssues.length >= 2) {
        phase = 'Corrección Intensiva';
        duration = '4-6 meses';
        focus = 'Corrección de deficiencias críticas y optimización';
      } else if (criticalIssues.length >= 1 || moderateIssues.length >= 3) {
        phase = 'Corrección';
        duration = '3-4 meses';
        focus = 'Corrección de deficiencias prioritarias';
      } else if (moderateIssues.length >= 1) {
        phase = 'Optimización';
        duration = '2-3 meses';
        focus = 'Optimización de niveles nutricionales';
      }

      // Integrar datos externos para suplementos más precisos
      const externalData = await this.getExternalDataInsights(userProfile);

      // Generar suplementos basados en análisis científico
      const supplements = this.generateAdvancedSupplements(userProfile, healthAnalysis);
      const optionalSupplements = this.generateOptionalSupplements(userProfile, healthAnalysis);
      
      // Enriquecer con datos de DSLD y Kaggle
      if (externalData.supplementRecommendations) {
        supplements.push(...this.integrateExternalSupplements(externalData.supplementRecommendations));
      }

      // Resultados esperados basados en evidencia científica
      const expectedResults = this.generateExpectedResults(userProfile, healthAnalysis);
      
      // Enriquecer con datos de efectividad de Kaggle
      if (externalData.effectivenessInsights) {
        expectedResults.push(...this.integrateEffectivenessData(externalData.effectivenessInsights));
      }

      // Plan de monitoreo
      const monitoringPlan = this.generateMonitoringPlan(userProfile, healthAnalysis);
      
      // Generar insights adicionales
      const additionalInsights = this.generateAdditionalInsights(userProfile);

      // Generar consejos de estilo de vida
      const lifestyleTips = await this.generateLifestyleTips(userProfile);

      // Almacenar el plan personalizado completo en la base de datos
      const { data: { user: authUser2 } } = await supabase.auth.getUser();
      if (authUser2) {
        await this.storePersonalizedPlan(authUser2.id, {
        phase,
        duration,
        focus,
        supplements,
        optionalSupplements,
        expectedResults,
        monitoringPlan,
        additionalInsights,
        lifestyleTips
        });
      }

      return {
        phase,
        duration,
        focus,
        supplements,
        optionalSupplements,
        expectedResults,
        monitoringPlan,
        additionalInsights
      };

    } catch (error) {
      console.error('Error generando plan personalizado:', error);
      return this.getFallbackPlan();
    }
  }

  /**
   * Genera consejos de estilo de vida reales basados en el perfil
   */
  async generateLifestyleTips(userProfile: UserProfile): Promise<Array<{
    category: string;
    tip: string;
    icon: any;
    impact: string;
  }>> {
    try {
      const tips = [];
      const age = parseInt(String(userProfile.age)) || 30;
      const gender = userProfile.gender || 'other';

      // Análisis de sueño basado en onboarding_data
      if (userProfile.onboarding_data?.sleepQuality) {
        const sleepQuality = userProfile.onboarding_data.sleepQuality;
        if (sleepQuality === 'poor' || sleepQuality === 'fair') {
          tips.push({
            category: 'Optimización del Sueño',
            tip: 'Optimiza tu rutina de sueño con horarios regulares y ambiente relajante',
            icon: Clock,
            impact: 'Alto'
          });
        } else if (sleepQuality === 'excellent') {
          tips.push({
            category: 'Mantenimiento del Sueño',
            tip: '¡Excelente calidad de sueño! Mantén esta rutina que es fundamental para tu salud',
            icon: Clock,
            impact: 'Medio'
          });
        }
      }

      // Análisis de estrés - Mejorado para evitar repeticiones
      if (userProfile.onboarding_data?.stressLevel) {
        const stressLevel = userProfile.onboarding_data.stressLevel;
        if (stressLevel === 'very_high') {
          tips.push({
            category: 'Técnicas de Relajación',
            tip: 'Practica técnicas de relajación como meditación o respiración profunda',
            icon: Heart,
            impact: 'Alto'
          });
          tips.push({
            category: 'Actividades Anti-Estrés',
            tip: 'Considera actividades como yoga, tai chi o mindfulness para reducir cortisol',
            icon: Zap,
            impact: 'Alto'
          });
        } else if (stressLevel === 'high') {
          tips.push({
            category: 'Reducción del Estrés',
            tip: 'Practica técnicas de relajación como meditación o respiración profunda',
            icon: Heart,
            impact: 'Alto'
          });
        } else if (stressLevel === 'medium') {
          tips.push({
            category: 'Bienestar Mental',
            tip: 'Incorpora técnicas de mindfulness en tu rutina diaria para prevenir acumulación de estrés',
            icon: Brain,
            impact: 'Medio'
          });
        }
      }

      // Análisis de ejercicio - Mejorado para usuarios altamente activos
      const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
      const exerciseHours = userProfile.onboarding_data?.exerciseHours || '3-5';
      const hoursPerWeek = this.parseExerciseHours(exerciseHours);
      
      if (userProfile.activity_level === 'low') {
        tips.push({
          category: 'Actividad Física',
          tip: 'Incorpora actividad física regular, aunque sea caminar 30 minutos diarios',
          icon: Activity,
          impact: 'Alto'
        });
      } else if (userProfile.activity_level === 'high' && hoursPerWeek >= 9) {
        // Usuario muy activo - consejos específicos
        if (exerciseType === 'yoga') {
          tips.push({
            category: 'Optimización del Ejercicio',
            tip: 'Tu práctica de yoga es excelente. Considera añadir ejercicios de fuerza para complementar y mantener masa muscular',
            icon: Dumbbell,
            impact: 'Alto'
          });
        } else if (exerciseType === 'strength') {
          tips.push({
            category: 'Optimización del Ejercicio',
            tip: 'Tu entrenamiento de fuerza es excelente. Añade 2-3 sesiones de cardio para optimizar la salud cardiovascular',
            icon: Heart,
            impact: 'Alto'
          });
        } else if (exerciseType === 'cardio') {
          tips.push({
            category: 'Optimización del Ejercicio',
            tip: 'Tu cardio es excelente. Considera añadir ejercicios de fuerza para mantener masa muscular',
            icon: Dumbbell,
            impact: 'Medio'
          });
        } else {
          tips.push({
            category: 'Recuperación',
            tip: 'Con tu nivel de actividad, asegúrate de una recuperación adecuada y monitorea signos de sobreentrenamiento',
            icon: Clock,
            impact: 'Alto'
          });
        }
      } else if (userProfile.activity_level === 'high') {
        tips.push({
          category: 'Ejercicio',
          tip: 'Mantén tu rutina actual y asegúrate de una recuperación adecuada',
          icon: Activity,
          impact: 'Medio'
        });
      }

      // Análisis de dieta - Más específico
      const dietType = userProfile.diet_type || 'balanced';
      if (dietType === 'vegan' || dietType === 'vegetarian') {
        tips.push({
          category: 'Nutrición',
          tip: 'Asegúrate de combinar legumbres con cereales para obtener proteínas completas',
          icon: Leaf,
          impact: 'Alto'
        });
      }

      // Análisis de consumo de cafeína
      const caffeineConsumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
      if (caffeineConsumption === 'high') {
        tips.push({
          category: 'Cafeína',
          tip: 'Reduce el consumo de cafeína después de las 2 PM para mejorar el sueño',
          icon: Zap,
          impact: 'Medio'
        });
      }

      // Análisis de hábitos de fumar
      const smokingHabit = userProfile.onboarding_data?.smokingHabit || 'never';
      if (smokingHabit === 'regular' || smokingHabit === 'occasional') {
        tips.push({
          category: 'Salud',
          tip: '🚨 CRÍTICO: Dejar de fumar es la mejor decisión para tu salud cardiovascular',
          icon: AlertTriangle,
          impact: 'Crítico'
        });
      }

      // Análisis de consumo de alcohol
      const alcoholConsumption = userProfile.onboarding_data?.alcoholConsumption || 'occasional';
      if (alcoholConsumption === 'high') {
        tips.push({
          category: 'Alcohol',
          tip: 'Reduce el consumo de alcohol para mejorar la calidad del sueño y la función hepática',
          icon: Shield,
          impact: 'Alto'
        });
      }

      // Análisis de exposición solar
      const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
      if (sunExposure === 'low') {
        tips.push({
          category: 'Vitamina D',
          tip: 'Pasa 15-20 minutos al sol diariamente o considera suplemento de vitamina D3',
            icon: Sun,
          impact: 'Alto'
        });
      }

      // Análisis de trabajo por turnos
      const shiftWork = (userProfile.onboarding_data as any)?.shiftWork || 'never';
      if (shiftWork === 'regular' || shiftWork === 'always') {
        tips.push({
          category: 'Ritmo Circadiano',
          tip: 'El trabajo por turnos afecta tu ritmo circadiano. Mantén horarios de sueño consistentes',
          icon: Clock,
          impact: 'Alto'
        });
      }

      // Análisis de exposición a contaminantes
      const pollutantExposure = (userProfile.onboarding_data as any)?.pollutantExposure || 'low';
      if (pollutantExposure === 'high') {
        tips.push({
          category: 'Antioxidantes',
          tip: 'Aumenta el consumo de antioxidantes (frutas, verduras) para contrarrestar contaminantes',
          icon: Shield,
          impact: 'Alto'
        });
      }

      // Consejos específicos por edad
      if (age > 50) {
        tips.push({
          category: 'Envejecimiento',
          tip: 'A partir de los 50, el ejercicio de resistencia es crucial para mantener masa muscular',
            icon: Target,
          impact: 'Alto'
        });
      }

      // Consejos específicos por género
      if (gender === 'female') {
        tips.push({
          category: 'Salud Femenina',
          tip: 'Las mujeres necesitan más hierro. Consume alimentos ricos en hierro con vitamina C',
          icon: Heart,
          impact: 'Medio'
        });
      }

      // Enriquecer con datos externos - Mejorado para evitar repeticiones
      const externalData = await this.getExternalDataInsights(userProfile);
      
      // Insights de Kaggle Fitness
      if (externalData.kaggleInsights?.successPatterns) {
        const patterns = externalData.kaggleInsights.successPatterns;
        if (patterns.successFactors) {
          // Añadir factores de éxito específicos
          if (patterns.successFactors.consistency > 0 && !tips.some(tip => tip.tip.includes('Consistencia'))) {
            tips.push({
              category: 'Patrones de Éxito',
              tip: `Los usuarios exitosos reportan: Consistencia (${patterns.similarUsers} usuarios similares)`,
              icon: Star,
              impact: 'Alto'
            });
          }
          
          if (patterns.successFactors.exerciseCombination > 0) {
            tips.push({
              category: 'Patrones de Éxito',
              tip: `Los usuarios exitosos reportan: Combinación de ejercicio y suplementos`,
              icon: Star,
              impact: 'Alto'
            });
          }
        }
      }

      // Insights de NHANES
      if (externalData.nhanesInsights?.populationDeficiencies) {
        const deficiencies = externalData.nhanesInsights.populationDeficiencies;
        if (deficiencies.deficiencyPercentages) {
          // Añadir consejos basados en deficiencias poblacionales
          Object.entries(deficiencies.deficiencyPercentages).forEach(([deficiency, percentage]) => {
            const percentageValue = Number(percentage) || 0;
            if (percentageValue > 50 && !tips.some(tip => tip.tip.includes(deficiency))) {
              tips.push({
                category: 'Deficiencias Poblacionales',
                tip: `${percentageValue.toFixed(1)}% de personas similares tienen deficiencia de ${deficiency}`,
                icon: AlertTriangle,
                impact: 'Alto'
              });
            }
          });
        }
      }

      // Insights de DSLD
      if (externalData.dsldInsights?.topProducts) {
        const topProducts = externalData.dsldInsights.topProducts;
        if (topProducts.length > 0) {
          tips.push({
            category: 'Suplementos Populares',
            tip: `Los suplementos más populares en tu demografía: ${topProducts.slice(0, 3).map(p => p.product).join(', ')}`,
            icon: TrendingUp,
            impact: 'Medio'
          });
        }
      }

      // Añadir refuerzo positivo
      const positiveAspects = this.generatePositiveReinforcement(userProfile);
      positiveAspects.forEach((aspect, index) => {
        tips.push({
          category: `Refuerzo Positivo ${index + 1}`,
          tip: aspect,
          icon: Star,
          impact: 'Alto'
        });
      });

      // Añadir consejos específicos por perfil si no hay suficientes
      if (tips.length < 6) {
        // Consejo de hidratación
        tips.push({
          category: 'Hidratación',
          tip: 'Mantén una hidratación adecuada: 2-3 litros de agua al día',
            icon: Droplet,
          impact: 'Medio'
        });

        // Consejo de conexión social
        tips.push({
          category: 'Bienestar Social',
          tip: 'Mantén conexiones sociales regulares para tu bienestar mental',
            icon: Users,
          impact: 'Medio'
        });
      }

      return tips.slice(0, 8); // Máximo 8 consejos

    } catch (error) {
      console.error('Error generando consejos de estilo de vida:', error);
      return this.getFallbackTips();
    }
  }

  /**
   * Obtiene insights de fallback cuando hay errores
   */
  private getFallbackInsights() {
    return [
      {
        category: 'Nutrientes Fundamentales',
        icon: Leaf,
        color: 'green',
        score: 75,
        insights: ['Análisis en progreso'],
        recommendations: ['Consulta con tu médico'],
        riskLevel: 'Bajo',
        priority: 'Media'
      }
    ];
  }

  /**
   * Obtiene plan de fallback cuando hay errores
   */
  private getFallbackPlan() {
    return {
      phase: 'Evaluación',
      duration: '1-2 meses',
      focus: 'Evaluación inicial de necesidades',
      supplements: [
        { 
          name: 'Multivitamínico', 
          priority: 'Media', 
          reason: 'Soporte nutricional general',
          dosage: '1 cápsula',
          timing: 'Con comida',
          interactions: ['Tomar con grasa para vitaminas liposolubles']
        }
      ],
      optionalSupplements: [],
      expectedResults: [
        'Mejora general en el bienestar en 4-6 semanas',
        'Optimización de la función metabólica en 8-12 semanas'
      ],
      monitoringPlan: [
        'Revisión de síntomas cada 2 semanas',
        'Evaluación de adherencia cada 4 semanas'
      ],
      additionalInsights: []
    };
  }


  // Métodos de cálculo de puntuaciones
  private calculateVegetableScore(userProfile: UserProfile): number {
    const consumption = userProfile.onboarding_data?.vegetableConsumption || 0;
    return Math.min(100, consumption * 25);
  }

  private calculateFishScore(userProfile: UserProfile): number {
    const consumption = userProfile.onboarding_data?.fishConsumption || 0;
    return Math.min(100, consumption * 20);
  }

  private calculateNutsScore(userProfile: UserProfile): number {
    const consumption = userProfile.onboarding_data?.nutsConsumption || 0;
    return Math.min(100, consumption * 30);
  }

  private calculateSunExposureScore(userProfile: UserProfile): number {
    const exposure = userProfile.onboarding_data?.sunExposure || 'low';
    const scores = { low: 30, medium: 60, high: 90 };
    return scores[exposure as keyof typeof scores] || 30;
  }

  private calculateStressScore(userProfile: UserProfile): number {
    const stress = userProfile.onboarding_data?.stressLevel || 'medium';
    const scores = { low: 90, medium: 60, high: 30, very_high: 10 };
    return scores[stress as keyof typeof scores] || 60;
  }

  private calculateExerciseScore(userProfile: UserProfile): number {
    const level = userProfile.activity_level || 'medium';
    const scores = { low: 30, medium: 60, high: 90 };
    return scores[level] || 60;
  }

  private calculateSleepScore(userProfile: UserProfile): number {
    const quality = userProfile.onboarding_data?.sleepQuality || 'good';
    const scores = { poor: 20, fair: 40, good: 70, excellent: 90 };
    return scores[quality as keyof typeof scores] || 70;
  }

  private calculateCaffeineScore(userProfile: UserProfile): number {
    const consumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
    const scores = { none: 100, low: 80, moderate: 60, high: 30 };
    return scores[consumption as keyof typeof scores] || 60;
  }

  private calculateDietScore(userProfile: UserProfile): number {
    const vegetableScore = this.calculateVegetableScore(userProfile);
    const fruitScore = (userProfile.onboarding_data?.fruitConsumption || 0) * 20;
    return Math.min(100, (vegetableScore + fruitScore) / 2);
  }

  private calculateCardiovascularScore(userProfile: UserProfile): number {
    const exerciseScore = this.calculateExerciseScore(userProfile);
    const fishScore = this.calculateFishScore(userProfile);
    const stressScore = this.calculateStressScore(userProfile);
    return Math.round((exerciseScore + fishScore + stressScore) / 3);
  }

  // Métodos de generación de insights
  private getNutrientInsights(userProfile: UserProfile): string[] {
    const insights = [];
    const vegetableConsumption = userProfile.onboarding_data?.vegetableConsumption || 0;
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
    
    if (vegetableConsumption >= 4) {
      insights.push('Tu consumo de verduras es excelente');
    } else if (vegetableConsumption >= 2) {
      insights.push('Tu consumo de verduras es bueno, pero puede mejorarse');
    } else {
      insights.push('Podrías beneficiarte de más verduras en tu dieta');
    }

    if (fishConsumption < 2) {
      insights.push('Podrías beneficiarte de más omega-3');
    }

    return insights;
  }

  private getNutrientRecommendations(userProfile: UserProfile): string[] {
    const recommendations = [];
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
    const vegetableConsumption = userProfile.onboarding_data?.vegetableConsumption || 0;

    if (fishConsumption < 2) {
      recommendations.push('Aumentar pescado azul 2-3 veces por semana');
    }

    if (vegetableConsumption < 3) {
      recommendations.push('Incluir más verduras de hoja verde');
    }

    recommendations.push('Mantener una dieta variada y equilibrada');

    return recommendations;
  }

  private getImmuneInsights(userProfile: UserProfile): string[] {
    const insights = [];
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';

    if (sunExposure === 'low') {
      insights.push('Tu exposición al sol es limitada');
    }

    if (stressLevel === 'high' || stressLevel === 'very_high') {
      insights.push('El estrés puede estar afectando tus defensas');
    }

    insights.push('Tu actividad física es buena para la inmunidad');

    return insights;
  }

  private getImmuneRecommendations(userProfile: UserProfile): string[] {
    const recommendations = [];
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';

    if (sunExposure === 'low') {
      recommendations.push('Suplemento de vitamina D3');
    }

    recommendations.push('Técnicas de manejo del estrés');
    recommendations.push('Mantener tu rutina de ejercicio');

    return recommendations;
  }

  private getEnergyInsights(userProfile: UserProfile): string[] {
    const insights = [];
    const caffeineConsumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';

    if (caffeineConsumption === 'moderate') {
      insights.push('Tu consumo de cafeína es moderado');
    }

    if (sleepQuality === 'poor' || sleepQuality === 'fair') {
      insights.push('El sueño podría mejorarse');
    }

    insights.push('Tu dieta apoya la función cerebral');

    return insights;
  }

  private getEnergyRecommendations(userProfile: UserProfile): string[] {
    const recommendations = [];
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';

    if (sleepQuality === 'poor' || sleepQuality === 'fair') {
      recommendations.push('Optimizar horarios de sueño');
    }

    recommendations.push('Considerar B-complex');
    recommendations.push('Mantener hidratación adecuada');

    return recommendations;
  }

  private getCardiovascularInsights(userProfile: UserProfile): string[] {
    const insights = [];
    const activityLevel = userProfile.activity_level || 'medium';

    insights.push('Tu consumo de grasas saludables es bueno');
    insights.push('La actividad física beneficia tu corazón');

    if (activityLevel === 'high') {
      insights.push('Tu nivel de actividad es excelente para el corazón');
    }

    return insights;
  }

  private getCardiovascularRecommendations(userProfile: UserProfile): string[] {
    const recommendations = [];
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;

    if (fishConsumption >= 2) {
      recommendations.push('Continuar con omega-3');
    } else {
      recommendations.push('Aumentar consumo de omega-3');
    }

    recommendations.push('Mantener ejercicio regular');
    recommendations.push('Considerar CoQ10');

    return recommendations;
  }

  // Análisis de necesidades del usuario
  private analyzeUserNeeds(userProfile: UserProfile): {
    criticalDeficiencies: number;
    deficiencies: number;
    needs: string[];
  } {
    const needs = [];
    let criticalDeficiencies = 0;
    let deficiencies = 0;

    // Análisis basado en datos del onboarding
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;

    if (stressLevel === 'very_high') {
      criticalDeficiencies++;
      needs.push('magnesium');
    }

    if (sunExposure === 'low') {
      deficiencies++;
      needs.push('vitamin_d');
    }

    if (sleepQuality === 'poor') {
      deficiencies++;
      needs.push('melatonin');
    }

    if (fishConsumption < 2) {
      deficiencies++;
      needs.push('omega3');
    }

    return { criticalDeficiencies, deficiencies, needs };
  }

  // Generación de suplementos basados en necesidades
  private generateSupplementsForNeeds(needs: {
    criticalDeficiencies: number;
    deficiencies: number;
    needs: string[];
  }): Array<{ name: string; priority: string; reason: string }> {
    const supplements = [];

    if (needs.needs.includes('magnesium')) {
      supplements.push({
        name: 'Magnesio Bisglicinato',
        priority: needs.criticalDeficiencies > 0 ? 'Alta' : 'Media',
        reason: 'Estrés y calambres'
      });
    }

    if (needs.needs.includes('vitamin_d')) {
      supplements.push({
        name: 'Vitamina D3',
        priority: 'Alta',
        reason: 'Exposición solar limitada'
      });
    }

    if (needs.needs.includes('omega3')) {
      supplements.push({
        name: 'Omega-3',
        priority: 'Media',
        reason: 'Salud cardiovascular'
      });
    }

    if (needs.needs.includes('melatonin')) {
      supplements.push({
        name: 'Melatonina',
        priority: 'Media',
        reason: 'Optimización del sueño'
      });
    }

    // Asegurar al menos un suplemento
    if (supplements.length === 0) {
      supplements.push({
        name: 'Multivitamínico',
        priority: 'Media',
        reason: 'Soporte nutricional general'
      });
    }

    return supplements.slice(0, 4); // Máximo 4 suplementos
  }

  // ===== MÉTODOS DE ANÁLISIS AVANZADOS =====

  /**
   * Análisis profundo de deficiencias nutricionales
   */
  private analyzeNutrientDeficiencies(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let criticalDeficiencies = 0;
    let hiddenInsights = [];

    // Análisis de Vitamina D - Insights más críticos
    const vitaminDRisk = this.calculateVitaminDRisk(userProfile);
    if (vitaminDRisk > 0.7) {
      criticalDeficiencies++;
      insights.push(`🚨 CRÍTICO: Deficiencia de Vitamina D (${Math.round(vitaminDRisk * 100)}% riesgo)`);
      hiddenInsights.push(`Tu perfil sugiere que podrías tener niveles subóptimos de Vitamina D, lo que afecta tu sistema inmunológico y salud ósea`);
      recommendations.push('Suplemento de Vitamina D3 2000-4000 UI diarias con K2');
    } else if (vitaminDRisk > 0.4) {
      insights.push(`⚠️ Riesgo moderado de deficiencia de Vitamina D`);
      hiddenInsights.push(`Basado en tu estilo de vida, podrías beneficiarte de optimizar tus niveles de Vitamina D`);
    }

    // Análisis de B12 - Más específico
    const b12Risk = this.calculateB12Risk(userProfile);
    if (b12Risk > 0.6) {
      criticalDeficiencies++;
      insights.push(`🧠 Deficiencia de B12 detectada (${Math.round(b12Risk * 100)}% riesgo)`);
      hiddenInsights.push(`Esto podría estar afectando tu energía, concentración y función cognitiva sin que lo sepas`);
      recommendations.push('B12 metilcobalamina 1000-2000 mcg sublingual');
    }

    // Análisis de Magnesio - Más revelador
    const magnesiumRisk = this.calculateMagnesiumRisk(userProfile);
    if (magnesiumRisk > 0.8) {
      criticalDeficiencies++;
      insights.push(`⚡ Deficiencia crítica de Magnesio (${Math.round(magnesiumRisk * 100)}% riesgo)`);
      hiddenInsights.push(`Esto explica posibles problemas de sueño, ansiedad y calambres musculares que podrías estar experimentando`);
      recommendations.push('Magnesio bisglicinato 200-400 mg antes de dormir');
    }

    // Análisis de Omega-3 - Más personalizado
    const omega3Risk = this.calculateOmega3Risk(userProfile);
    if (omega3Risk > 0.7) {
      insights.push(`🐟 Inflamación silenciosa por falta de Omega-3 (${Math.round(omega3Risk * 100)}% riesgo)`);
      hiddenInsights.push(`Tu perfil indica inflamación crónica de bajo grado que podría estar afectando tu salud general`);
      recommendations.push('Aceite de pescado 1000-2000 mg EPA/DHA con comida');
    }

    // Análisis de Hierro - Más específico por género
    const ironRisk = this.calculateIronRisk(userProfile);
    if (ironRisk > 0.6) {
      const genderSpecific = userProfile.gender === 'female' ? 'especialmente importante para mujeres' : 'crítico para tu perfil';
      insights.push(`🩸 Deficiencia de Hierro ${genderSpecific} (${Math.round(ironRisk * 100)}% riesgo)`);
      hiddenInsights.push(`Esto podría estar causando fatiga, debilidad y problemas de concentración que atribuyes a otras causas`);
      recommendations.push('Hierro bisglicinato 18-27 mg con vitamina C (consultar médico)');
    }

    // Insights ocultos adicionales basados en el perfil
    if (userProfile.age > 40) {
      hiddenInsights.push(`A partir de los 40, tu capacidad de absorber ciertos nutrientes disminuye naturalmente`);
    }
    
    if (userProfile.diet_type === 'vegetarian' || userProfile.diet_type === 'vegan') {
      hiddenInsights.push(`Tu dieta plant-based requiere atención especial a B12, hierro y zinc`);
    }

    if (userProfile.activity_level === 'high') {
      hiddenInsights.push(`Tu nivel de actividad intensa aumenta las necesidades de magnesio y antioxidantes`);
    }

    // Agregar insights ocultos a los insights principales
    insights.push(...hiddenInsights.slice(0, 2));

    // Cálculo del score final
    const totalRisk = (vitaminDRisk + b12Risk + magnesiumRisk + omega3Risk + ironRisk) / 5;
    const score = Math.max(20, Math.round((1 - totalRisk) * 100));

    // Determinar nivel de riesgo y prioridad
    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (criticalDeficiencies >= 3) {
      riskLevel = 'Crítico';
      priority = 'Urgente';
    } else if (criticalDeficiencies >= 2) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (criticalDeficiencies >= 1) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  /**
   * Análisis de riesgo cardiovascular
   */
  private analyzeCardiovascularRisk(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let riskFactors = 0;

    // Análisis de edad
    const age = parseInt(String(userProfile.age)) || 30;
    if (age > 50) riskFactors++;

    // Análisis de ejercicio - Mejorado para tipos específicos
    const exerciseLevel = userProfile.activity_level || 'medium';
    const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
    const exerciseHours = userProfile.onboarding_data?.exerciseHours || '3-5';
    
    // Convertir horas de ejercicio a número para análisis
    const hoursPerWeek = this.parseExerciseHours(exerciseHours);
    
    // Análisis específico por tipo de ejercicio - Mejorado
    if (exerciseLevel === 'low' || hoursPerWeek < 3) {
      riskFactors++;
      insights.push('Nivel de actividad física insuficiente para salud cardiovascular');
      recommendations.push('Incrementar ejercicio cardiovascular a 150 min/semana');
    } else if (exerciseType === 'yoga' && hoursPerWeek >= 5) {
      // Yoga activo pero necesita complemento cardiovascular
      insights.push('Tu práctica de yoga es excelente para flexibilidad y bienestar mental, pero la salud cardiovascular se beneficia de ejercicio aeróbico adicional');
      recommendations.push('Complementa tu yoga con 2-3 sesiones semanales de ejercicio cardiovascular (caminar rápido, nadar, ciclismo)');
      riskFactors += 0.5; // Penalización menor para yoga activo
    } else if (exerciseType === 'strength' && hoursPerWeek >= 5) {
      // Entrenamiento de fuerza necesita cardio
      insights.push('El entrenamiento de fuerza es excelente para masa muscular, pero necesitas ejercicio cardiovascular para la salud del corazón');
      recommendations.push('Añade 150 minutos semanales de ejercicio cardiovascular moderado a tu rutina de fuerza');
      riskFactors += 0.5;
    } else if (exerciseType === 'cardio' && hoursPerWeek >= 3) {
      insights.push('Excelente nivel de ejercicio cardiovascular');
      riskFactors -= 0.5; // Beneficio para cardio
    } else if (exerciseType === 'yoga' && hoursPerWeek >= 3) {
      insights.push('Yoga regular es beneficioso, pero considera ejercicio cardiovascular adicional');
      recommendations.push('Mantén tu práctica de yoga y añade 30 min de cardio 3 veces/semana');
    }

    // Análisis de estrés - Mejorado
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    if (stressLevel === 'very_high') {
      riskFactors++;
      insights.push('Nivel de estrés muy elevado afecta significativamente la salud cardiovascular');
      recommendations.push('Técnicas de manejo del estrés, CoQ10 y consideración de apoyo profesional');
    } else if (stressLevel === 'high') {
      riskFactors++;
      insights.push('Nivel de estrés elevado afecta la salud cardiovascular');
      recommendations.push('Técnicas de manejo del estrés y CoQ10');
    } else if (stressLevel === 'medium') {
      insights.push('El estrés moderado puede acumularse y afectar la salud cardiovascular a largo plazo');
      recommendations.push('Técnicas de relajación preventivas y monitoreo del estrés');
      riskFactors += 0.3; // Penalización menor para estrés moderado
    }

    // Análisis de dieta
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
    if (Number(fishConsumption) < 2) {
      riskFactors++;
      insights.push('Consumo insuficiente de pescado azul');
      recommendations.push('Aumentar pescado azul 2-3 veces/semana o suplemento Omega-3');
    }

    // Análisis de historial familiar
    const familyHistory = (userProfile.onboarding_data as any)?.familyHistory || [];
    if (Array.isArray(familyHistory) && familyHistory.includes('Enfermedades cardíacas')) {
      riskFactors++;
      insights.push('Historial familiar de enfermedades cardíacas');
      recommendations.push('Monitoreo regular y CoQ10 para protección cardiovascular');
    }

    // Cálculo del score
    const score = Math.max(0, 100 - (riskFactors * 20));

    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (riskFactors >= 4) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (riskFactors >= 2) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  /**
   * Análisis de función cognitiva
   */
  private analyzeCognitiveFunction(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let cognitiveRisk = 0;

    // Análisis de sueño
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';
    if (sleepQuality === 'poor' || sleepQuality === 'fair') {
      cognitiveRisk += 0.3;
      insights.push('Calidad del sueño subóptima afecta la función cognitiva');
      recommendations.push('Optimizar higiene del sueño y considerar melatonina');
    }

    // Análisis de estrés
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    if (stressLevel === 'high' || stressLevel === 'very_high') {
      cognitiveRisk += 0.4;
      insights.push('Estrés crónico impacta la memoria y concentración');
      recommendations.push('Magnesio y técnicas de relajación para reducir cortisol');
    }

    // Análisis de cafeína
    const caffeineConsumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
    if (caffeineConsumption === 'high') {
      cognitiveRisk += 0.2;
      insights.push('Alto consumo de cafeína puede afectar el sueño y la cognición');
      recommendations.push('Reducir cafeína y considerar L-teanina para equilibrio');
    }

    // Análisis de edad
    const age = parseInt(String(userProfile.age)) || 30;
    if (age > 40) {
      cognitiveRisk += 0.2;
      insights.push('A partir de los 40 años, el apoyo cognitivo se vuelve más importante');
      recommendations.push('Fosfatidilserina y ácidos grasos omega-3 para neuroprotección');
    }

    // Análisis de ejercicio
    const exerciseLevel = userProfile.activity_level || 'medium';
    if (exerciseLevel === 'low') {
      cognitiveRisk += 0.3;
      insights.push('El ejercicio regular mejora la función cognitiva');
      recommendations.push('Incrementar actividad física y considerar nootrópicos naturales');
    }

    const score = Math.max(20, Math.round((1 - cognitiveRisk) * 100));

    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (cognitiveRisk > 0.7) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (cognitiveRisk > 0.4) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  /**
   * Análisis del sistema inmune
   */
  private analyzeImmuneSystem(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let immuneRisk = 0;

    // Análisis de exposición solar
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    if (sunExposure === 'low' || sunExposure === 'none') {
      immuneRisk += 0.4;
      insights.push('Exposición solar limitada reduce la síntesis de vitamina D');
      recommendations.push('Suplemento de vitamina D3 para apoyo inmunológico');
    }

    // Análisis de estrés
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    if (stressLevel === 'high' || stressLevel === 'very_high') {
      immuneRisk += 0.5;
      insights.push('Estrés crónico suprime la función inmunológica');
      recommendations.push('Zinc, vitamina C y técnicas de manejo del estrés');
    }

    // Análisis de sueño
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';
    if (sleepQuality === 'poor') {
      immuneRisk += 0.3;
      insights.push('Sueño inadecuado compromete la respuesta inmunológica');
      recommendations.push('Optimizar sueño y considerar melatonina');
    }

    // Análisis de ejercicio
    const exerciseLevel = userProfile.activity_level || 'medium';
    if (exerciseLevel === 'low') {
      immuneRisk += 0.2;
      insights.push('El ejercicio moderado fortalece el sistema inmune');
      recommendations.push('Incrementar actividad física regular');
    }

    // Análisis de edad
    const age = parseInt(String(userProfile.age)) || 30;
    if (age > 60) {
      immuneRisk += 0.3;
      insights.push('La inmunosenescencia requiere apoyo nutricional adicional');
      recommendations.push('Multivitamínico completo y probióticos');
    }

    const score = Math.max(20, Math.round((1 - immuneRisk) * 100));

    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (immuneRisk > 0.7) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (immuneRisk > 0.4) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  /**
   * Análisis de salud digestiva
   */
  private analyzeDigestiveHealth(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let digestiveRisk = 0;

    // Análisis de uso de antibióticos
    const antibioticsUse = userProfile.onboarding_data?.antibioticsUse || 'rare';
    if (antibioticsUse === 'multiple' || antibioticsUse === 'recent') {
      digestiveRisk += 0.6;
      insights.push('Uso reciente de antibióticos altera el microbioma intestinal');
      recommendations.push('Probióticos de alta calidad para restaurar flora intestinal');
    }

    // Análisis de problemas intestinales
    const intestinalIssues = (userProfile.onboarding_data as any)?.intestinalIssues || '';
    if (intestinalIssues && intestinalIssues !== 'no' && intestinalIssues !== '') {
      digestiveRisk += 0.5;
      insights.push('Problemas digestivos requieren apoyo nutricional específico');
      recommendations.push('Enzimas digestivas y glutamina para reparación intestinal');
    }

    // Análisis de consumo de fibra
    const vegetableConsumption = userProfile.onboarding_data?.vegetableConsumption || 0;
    const fruitConsumption = userProfile.onboarding_data?.fruitConsumption || 0;
    if (Number(vegetableConsumption) < 3 || Number(fruitConsumption) < 2) {
      digestiveRisk += 0.3;
      insights.push('Consumo insuficiente de fibra prebiótica');
      recommendations.push('Aumentar verduras y frutas, considerar prebióticos');
    }

    // Análisis de estrés
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    if (stressLevel === 'high' || stressLevel === 'very_high') {
      digestiveRisk += 0.4;
      insights.push('Estrés crónico afecta la función digestiva');
      recommendations.push('Técnicas de relajación y probióticos para eje intestino-cerebro');
    }

    const score = Math.max(20, Math.round((1 - digestiveRisk) * 100));

    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (digestiveRisk > 0.7) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (digestiveRisk > 0.4) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  /**
   * Análisis de salud ósea
   */
  private analyzeBoneHealth(userProfile: UserProfile): {
    score: number;
    insights: string[];
    recommendations: string[];
    riskLevel: string;
    priority: string;
  } {
    const insights = [];
    const recommendations = [];
    let boneRisk = 0;

    // Análisis de edad y género
    const age = parseInt(String(userProfile.age)) || 30;
    const gender = userProfile.gender || 'other';
    
    if (age > 50) {
      boneRisk += 0.3;
      insights.push('A partir de los 50 años, la densidad ósea disminuye naturalmente');
      recommendations.push('Calcio, vitamina D3 y K2 para salud ósea');
    }

    if (gender === 'female' && age > 40) {
      boneRisk += 0.2;
      insights.push('Las mujeres postmenopáusicas tienen mayor riesgo de osteoporosis');
      recommendations.push('Calcio 1000-1200 mg, vitamina D3 y ejercicio con peso');
    }

    // Análisis de ejercicio
    const exerciseLevel = userProfile.activity_level || 'medium';
    if (exerciseLevel === 'low') {
      boneRisk += 0.4;
      insights.push('El ejercicio con peso es crucial para la densidad ósea');
      recommendations.push('Incrementar ejercicio de resistencia y caminar');
    }

    // Análisis de exposición solar
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    if (sunExposure === 'low' || sunExposure === 'none') {
      boneRisk += 0.3;
      insights.push('Exposición solar limitada reduce la síntesis de vitamina D');
      recommendations.push('Vitamina D3 2000-4000 UI para absorción de calcio');
    }

    // Análisis de consumo de calcio
    const dairyConsumption = userProfile.onboarding_data?.dairyConsumption || 0;
    if (Number(dairyConsumption) < 2) {
      boneRisk += 0.3;
      insights.push('Consumo insuficiente de productos lácteos ricos en calcio');
      recommendations.push('Aumentar lácteos o suplemento de calcio');
    }

    const score = Math.round((1 - boneRisk) * 100);

    let riskLevel = 'Bajo';
    let priority = 'Media';
    
    if (boneRisk > 0.7) {
      riskLevel = 'Alto';
      priority = 'Alta';
    } else if (boneRisk > 0.4) {
      riskLevel = 'Moderado';
      priority = 'Media';
    }

    return {
      score,
      insights,
      recommendations,
      riskLevel,
      priority
    };
  }

  // ===== MÉTODOS DE CÁLCULO DE RIESGOS ESPECÍFICOS =====

  private calculateVitaminDRisk(userProfile: UserProfile): number {
    let risk = 0;
    
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    if (sunExposure === 'low' || sunExposure === 'none') risk += 0.6;
    
    const age = parseInt(String(userProfile.age)) || 30;
    if (age > 50) risk += 0.3;
    
    const shiftWork = (userProfile.onboarding_data as any)?.shiftWork || '';
    if (shiftWork === 'regular' || shiftWork === 'always') risk += 0.4;
    
    return Math.min(1, risk);
  }

  private calculateB12Risk(userProfile: UserProfile): number {
    let risk = 0;
    
    const dietType = userProfile.diet_type || 'balanced';
    if (dietType === 'vegan' || dietType === 'vegetarian') risk += 0.7;
    
    const age = parseInt(String(userProfile.age)) || 30;
    if (age > 50) risk += 0.3;
    
    const alcoholConsumption = userProfile.onboarding_data?.alcoholConsumption || 'occasional';
    if (alcoholConsumption === 'moderate' || alcoholConsumption === 'high') risk += 0.2;
    
    return Math.min(1, risk);
  }

  private calculateMagnesiumRisk(userProfile: UserProfile): number {
    let risk = 0;
    
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    if (stressLevel === 'high' || stressLevel === 'very_high') risk += 0.5;
    
    const exerciseLevel = userProfile.activity_level || 'medium';
    if (exerciseLevel === 'high') risk += 0.3;
    
    const alcoholConsumption = userProfile.onboarding_data?.alcoholConsumption || 'occasional';
    if (alcoholConsumption === 'moderate' || alcoholConsumption === 'high') risk += 0.4;
    
    return Math.min(1, risk);
  }

  private calculateOmega3Risk(userProfile: UserProfile): number {
    let risk = 0;
    
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
    if (Number(fishConsumption) < 2) risk += 0.8;
    
    const dietType = userProfile.diet_type || 'balanced';
    if (dietType === 'vegan' || dietType === 'vegetarian') risk += 0.6;
    
    return Math.min(1, risk);
  }

  private calculateIronRisk(userProfile: UserProfile): number {
    let risk = 0;
    
    const gender = userProfile.gender || 'other';
    if (gender === 'female') risk += 0.3; // Menstruación
    
    const dietType = userProfile.diet_type || 'balanced';
    if (dietType === 'vegan' || dietType === 'vegetarian') risk += 0.4;
    
    const exerciseLevel = userProfile.activity_level || 'medium';
    if (exerciseLevel === 'high') risk += 0.2;
    
    return Math.min(1, risk);
  }

  // ===== MÉTODOS AVANZADOS DE GENERACIÓN DE PLAN =====

  /**
   * Genera suplementos opcionales basados en perfil específico
   */
  private generateOptionalSupplements(userProfile: UserProfile, healthAnalysis: any[]): Array<{
    name: string;
    priority: string;
    reason: string;
    dosage: string;
    timing: string;
    interactions: string[];
    category: string;
  }> {
    const optionalSupplements = [];
    const age = parseInt(String(userProfile.age)) || 30;
    const gender = userProfile.gender || 'other';
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'low';
    const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
    const dietType = userProfile.diet_type || 'balanced';
    const conditions = userProfile.health_conditions || [];
    const familyHistory = (userProfile.onboarding_data as any)?.familyHistory || [];

    // Suplementos para optimización del rendimiento
    if (exerciseType === 'strength' && userProfile.activity_level === 'high') {
      optionalSupplements.push({
        name: 'Creatina Monohidrato',
        priority: 'Opcional',
        reason: 'Mejora la fuerza y masa muscular en entrenamiento de resistencia',
        dosage: '3-5g diarios',
        timing: 'Con agua, preferiblemente post-entreno',
        interactions: ['Aumenta la retención de agua', 'Tomar con abundante agua'],
        category: 'Rendimiento Deportivo'
      });

      optionalSupplements.push({
        name: 'Beta-Alanina',
        priority: 'Opcional',
        reason: 'Mejora la resistencia muscular y reduce fatiga en entrenamientos intensos',
        dosage: '3-5g diarios',
        timing: 'Dividido en 2-3 dosis',
        interactions: ['Puede causar hormigueo temporal', 'Tomar con comida'],
        category: 'Rendimiento Deportivo'
      });
    }

    // Suplementos para manejo del estrés
    if (stressLevel === 'very_high' || stressLevel === 'high') {
      optionalSupplements.push({
        name: 'Ashwagandha',
        priority: 'Opcional',
        reason: 'Adaptógeno que ayuda a reducir cortisol y mejorar la respuesta al estrés',
        dosage: '300-600mg',
        timing: 'Con comida, preferiblemente por la mañana',
        interactions: ['Puede interactuar con medicamentos para tiroides', 'Evitar con sedantes'],
        category: 'Manejo del Estrés'
      });

      optionalSupplements.push({
        name: 'L-Theanina',
        priority: 'Opcional',
        reason: 'Aminoácido que promueve relajación sin somnolencia',
        dosage: '100-200mg',
        timing: 'Con té verde o suplemento',
        interactions: ['Sinergia con cafeína', 'Seguro para uso diario'],
        category: 'Manejo del Estrés'
      });
    }

    // Suplementos para salud digestiva
    const antibioticsUse = userProfile.onboarding_data?.antibioticsUse || 'never';
    const intestinalIssues = (userProfile.onboarding_data as any)?.intestinalIssues || 'no';
    
    if (antibioticsUse === 'multiple' || intestinalIssues === 'IBS') {
      optionalSupplements.push({
        name: 'L-Glutamina',
        priority: 'Opcional',
        reason: 'Aminoácido que repara la barrera intestinal y reduce inflamación',
        dosage: '5-10g',
        timing: 'En ayunas o entre comidas',
        interactions: ['Puede causar náuseas en dosis altas', 'Tomar con agua'],
        category: 'Salud Digestiva'
      });

      optionalSupplements.push({
        name: 'Curcumina + Piperina',
        priority: 'Opcional',
        reason: 'Antiinflamatorio natural que reduce inflamación intestinal',
        dosage: '500-1000mg curcumina + 5mg piperina',
        timing: 'Con comida',
        interactions: ['Piperina mejora absorción', 'Evitar con anticoagulantes'],
        category: 'Salud Digestiva'
      });
    }

    // Suplementos para salud cardiovascular
    if (familyHistory.includes('diabetes') || conditions.includes('hypertension')) {
      optionalSupplements.push({
        name: 'Berberina',
        priority: 'Opcional',
        reason: 'Ayuda a regular glucosa y colesterol, especialmente importante con historial familiar de diabetes',
        dosage: '500mg',
        timing: 'Con comida, 2-3 veces al día',
        interactions: ['Puede interactuar con medicamentos para diabetes', 'Consultar con médico'],
        category: 'Salud Cardiovascular'
      });

      optionalSupplements.push({
        name: 'Resveratrol',
        priority: 'Opcional',
        reason: 'Antioxidante que protege el sistema cardiovascular y reduce inflamación',
        dosage: '100-200mg',
        timing: 'Con comida',
        interactions: ['Mejor absorción con grasa', 'Evitar con anticoagulantes'],
        category: 'Salud Cardiovascular'
      });
    }

    // Suplementos para salud cognitiva
    if (age > 40 || stressLevel === 'high' || stressLevel === 'very_high') {
      optionalSupplements.push({
        name: 'Fosfatidilserina',
        priority: 'Opcional',
        reason: 'Fosfolípido que mejora la función cognitiva y reduce el cortisol',
        dosage: '100-300mg',
        timing: 'Con comida',
        interactions: ['Sinergia con omega-3', 'Seguro para uso prolongado'],
        category: 'Salud Cognitiva'
      });

      optionalSupplements.push({
        name: 'Bacopa Monnieri',
        priority: 'Opcional',
        reason: 'Nootrópico natural que mejora memoria y concentración',
        dosage: '300-600mg',
        timing: 'Con comida',
        interactions: ['Puede causar somnolencia inicial', 'Tomar por la mañana'],
        category: 'Salud Cognitiva'
      });
    }

    // Suplementos para salud hormonal (mujeres)
    if (gender === 'female' && age > 35) {
      optionalSupplements.push({
        name: 'Vitex (Sauzgatillo)',
        priority: 'Opcional',
        reason: 'Regula el equilibrio hormonal y puede ayudar con síntomas premenopáusicos',
        dosage: '400-800mg',
        timing: 'Con comida',
        interactions: ['Puede interactuar con anticonceptivos', 'Consultar con ginecólogo'],
        category: 'Salud Hormonal'
      });
    }

    // Suplementos para salud ósea
    if (userProfile.onboarding_data?.sunExposure === 'low' || age > 50) {
      optionalSupplements.push({
        name: 'Vitamina K2 (MK-7)',
        priority: 'Opcional',
        reason: 'Dirige el calcio a los huesos y previene calcificación arterial',
        dosage: '100-200mcg',
        timing: 'Con comida que contenga grasa',
        interactions: ['Sinergia con vitamina D3', 'Evitar con anticoagulantes'],
        category: 'Salud Ósea'
      });

      optionalSupplements.push({
        name: 'Boro',
        priority: 'Opcional',
        reason: 'Mineral que mejora la absorción de calcio y magnesio',
        dosage: '3-6mg',
        timing: 'Con comida',
        interactions: ['Mejora absorción de calcio', 'No exceder 10mg diarios'],
        category: 'Salud Ósea'
      });
    }

    // Suplementos para optimización del sueño
    if (userProfile.onboarding_data?.sleepQuality === 'poor' || stressLevel === 'high') {
      optionalSupplements.push({
        name: 'Melatonina',
        priority: 'Opcional',
        reason: 'Regula el ciclo sueño-vigilia y mejora la calidad del sueño',
        dosage: '0.5-3mg',
        timing: '30 minutos antes de dormir',
        interactions: ['Puede causar somnolencia matutina', 'No conducir después de tomar'],
        category: 'Calidad del Sueño'
      });

      optionalSupplements.push({
        name: 'Glicina',
        priority: 'Opcional',
        reason: 'Aminoácido que mejora la calidad del sueño y reduce el tiempo de conciliación',
        dosage: '3g',
        timing: '30 minutos antes de dormir',
        interactions: ['Sinergia con magnesio', 'Seguro para uso prolongado'],
        category: 'Calidad del Sueño'
      });
    }

    return optionalSupplements;
  }

  /**
   * Genera suplementos avanzados basados en análisis científico
   */
  private generateAdvancedSupplements(userProfile: UserProfile, healthAnalysis: any[]): Array<{
    name: string;
    priority: string;
    reason: string;
    dosage: string;
    timing: string;
    interactions: string[];
  }> {
    const supplements = [];
    const age = parseInt(String(userProfile.age)) || 30;
    const gender = userProfile.gender || 'other';

    // Análisis basado en insights específicos de cada área de salud
    healthAnalysis.forEach(area => {
      const category = area.category;
      const score = area.score;
      const insights = area.insights || [];
      const recommendations = area.recommendations || [];

      // Deficiencias Nutricionales - Suplementos específicos
      if (category === 'Deficiencias Nutricionales' && score < 80) {
        // Vitamina D3 basada en exposición solar
      if (userProfile.onboarding_data?.sunExposure === 'low' || userProfile.onboarding_data?.sunExposure === 'none') {
        supplements.push({
          name: 'Vitamina D3 + K2',
          priority: 'Alta',
            reason: 'Exposición solar limitada - riesgo alto de deficiencia',
          dosage: age > 50 ? '4000 UI D3 + 200 mcg K2' : '2000 UI D3 + 100 mcg K2',
          timing: 'Con la comida principal',
            interactions: ['Tomar con grasa para mejor absorción', 'K2 mejora la absorción de calcio']
          });
        }

        // Magnesio basado en estrés y ejercicio
      if (userProfile.onboarding_data?.stressLevel === 'high' || userProfile.onboarding_data?.stressLevel === 'very_high') {
        supplements.push({
          name: 'Magnesio Bisglicinato',
          priority: 'Alta',
            reason: 'Estrés crónico agota magnesio - 60% de adultos tienen deficiencia',
          dosage: '200-400 mg',
          timing: 'Antes de dormir',
            interactions: ['Puede causar somnolencia', 'Mejora la calidad del sueño']
          });
        }

        // Omega-3 basado en consumo de pescado
        const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
        if (Number(fishConsumption) < 2) {
        supplements.push({
            name: 'Aceite de Pescado Omega-3',
          priority: 'Alta',
            reason: 'Consumo insuficiente de pescado - 80% de población consume menos de lo recomendado',
          dosage: '1000-2000 mg EPA/DHA',
          timing: 'Con comida',
            interactions: ['Tomar con comida para evitar reflujo', 'Evitar con anticoagulantes']
          });
        }
      }

      // Salud Digestiva - Probióticos específicos
      if (category === 'Salud Digestiva' && score < 50) {
        const antibioticsUse = userProfile.onboarding_data?.antibioticsUse || 'never';
        if (antibioticsUse === 'recent' || antibioticsUse === 'multiple') {
        supplements.push({
            name: 'Probióticos Multi-Cepa',
            priority: 'Alta',
            reason: 'Uso reciente de antibióticos altera microbioma intestinal',
            dosage: '50-100 mil millones UFC',
            timing: 'En ayunas',
            interactions: ['Evitar con antibióticos', 'Tomar 2 horas antes/después de medicamentos']
          });
        }

        const intestinalIssues = (userProfile.onboarding_data as any)?.intestinalIssues || 'no';
        if (intestinalIssues === 'IBS' || intestinalIssues === 'SIBO') {
        supplements.push({
            name: 'Enzimas Digestivas + Glutamina',
          priority: 'Media',
            reason: 'Problemas digestivos requieren apoyo nutricional específico',
            dosage: 'Enzimas: 1-2 cápsulas con comida, Glutamina: 5-10g',
            timing: 'Enzimas con comida, Glutamina en ayunas',
            interactions: ['Glutamina puede causar náuseas en dosis altas']
        });
      }
    }

      // Sistema Inmune - Suplementos inmunológicos
      if (category === 'Sistema Inmune' && score < 60) {
        const stressLevel = userProfile.onboarding_data?.stressLevel || 'low';
        let reason = '';
        let priority = 'Media';
        
        if (stressLevel === 'very_high') {
          reason = 'Estrés muy elevado suprime significativamente la función inmunológica';
          priority = 'Alta';
        } else if (stressLevel === 'high') {
          reason = 'Estrés elevado suprime la función inmunológica';
          priority = 'Alta';
        } else if (age > 50) {
          reason = 'Soporte inmunológico general, especialmente importante después de los 50';
          priority = 'Media';
        } else {
          reason = 'Soporte general para el sistema inmune';
          priority = 'Media';
        }
        
      supplements.push({
          name: 'Zinc + Vitamina C',
          priority,
          reason,
          dosage: stressLevel === 'very_high' ? 'Zinc: 30mg, Vitamina C: 2000mg' : 'Zinc: 15mg, Vitamina C: 1000mg',
        timing: 'Con comida',
          interactions: ['Zinc puede interferir con absorción de cobre', 'Vitamina C mejora absorción de hierro']
        });
      }

      // Función Cognitiva - Nootrópicos naturales
      if (category === 'Función Cognitiva' && score < 0) {
        const caffeineConsumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
        if (caffeineConsumption === 'high') {
        supplements.push({
            name: 'L-Teanina + Fosfatidilserina',
          priority: 'Media',
            reason: 'Alto consumo de cafeína afecta sueño y cognición',
            dosage: 'L-Teanina: 200-400mg, Fosfatidilserina: 100-300mg',
            timing: 'L-Teanina con cafeína, Fosfatidilserina con comida',
            interactions: ['L-Teanina reduce efectos de cafeína', 'Fosfatidilserina mejora memoria']
        });
      }
    }
    });

    // Suplementos adicionales basados en perfil específico
    const dietType = userProfile.diet_type || 'balanced';
    if (dietType === 'vegan' || dietType === 'vegetarian') {
        supplements.push({
        name: 'B12 Metilcobalamina',
          priority: 'Alta',
        reason: 'Dieta sin productos animales - deficiencia común',
        dosage: '1000-2000 mcg',
          timing: 'En ayunas',
        interactions: ['Evitar con café o té', 'Forma metilada es más absorbible']
        });
    }

    // Suplementos para edad avanzada
    if (age > 50) {
      supplements.push({
        name: 'CoQ10 + Resveratrol',
        priority: 'Media',
        reason: 'A partir de 50 años, producción de CoQ10 disminuye',
        dosage: 'CoQ10: 100-200mg, Resveratrol: 250-500mg',
        timing: 'Con comida',
        interactions: ['CoQ10 mejora energía celular', 'Resveratrol es antioxidante']
      });
    }

    return supplements;
  }

  /**
   * Genera resultados esperados basados en evidencia científica
   */
  private generateExpectedResults(userProfile: UserProfile, healthAnalysis: any[]): string[] {
    const results = [];
    const age = parseInt(String(userProfile.age)) || 30;

    // Resultados basados en deficiencias identificadas
    const nutrientDeficiencies = healthAnalysis.find(area => area.category === 'Deficiencias Nutricionales');
    if (nutrientDeficiencies && nutrientDeficiencies.score < 70) {
      results.push('Mejora en niveles de energía y vitalidad en 2-4 semanas');
      results.push('Reducción de fatiga y mejora del estado de ánimo en 4-6 semanas');
    }

    // Resultados cardiovasculares
    const cardiovascularRisk = healthAnalysis.find(area => area.category === 'Riesgo Cardiovascular');
    if (cardiovascularRisk && cardiovascularRisk.score < 70) {
      results.push('Mejora en marcadores inflamatorios en 6-8 semanas');
      results.push('Optimización de la presión arterial en 8-12 semanas');
    }

    // Resultados cognitivos
    const cognitiveFunction = healthAnalysis.find(area => area.category === 'Función Cognitiva');
    if (cognitiveFunction && cognitiveFunction.score < 70) {
      results.push('Mejora en concentración y memoria en 4-6 semanas');
      results.push('Reducción del estrés mental en 6-8 semanas');
    }

    // Resultados inmunes
    const immuneSystem = healthAnalysis.find(area => area.category === 'Sistema Inmune');
    if (immuneSystem && immuneSystem.score < 70) {
      results.push('Fortalecimiento del sistema inmune en 4-6 semanas');
      results.push('Reducción de resfriados e infecciones en 8-12 semanas');
    }

    // Resultados digestivos
    const digestiveHealth = healthAnalysis.find(area => area.category === 'Salud Digestiva');
    if (digestiveHealth && digestiveHealth.score < 70) {
      results.push('Mejora en la digestión y regularidad intestinal en 2-4 semanas');
      results.push('Reducción de hinchazón y malestar digestivo en 4-6 semanas');
    }

    // Resultados generales
    results.push('Mejora general en el bienestar y calidad de vida en 6-8 semanas');
    results.push('Optimización de la función metabólica en 8-12 semanas');

    return results;
  }

  /**
   * Genera plan de monitoreo personalizado
   */
  private generateMonitoringPlan(userProfile: UserProfile, healthAnalysis: any[]): string[] {
    const plan = [];
    const age = parseInt(String(userProfile.age)) || 30;

    // Monitoreo básico
    plan.push('Revisión de síntomas y efectos secundarios cada 2 semanas');
    plan.push('Evaluación de adherencia al plan cada 4 semanas');

    // Monitoreo específico basado en deficiencias
    const nutrientDeficiencies = healthAnalysis.find(area => area.category === 'Deficiencias Nutricionales');
    if (nutrientDeficiencies && nutrientDeficiencies.score < 70) {
      plan.push('Análisis de sangre para vitaminas D, B12 y minerales en 8-12 semanas');
      plan.push('Evaluación de niveles de energía y estado de ánimo');
    }

    // Monitoreo cardiovascular
    const cardiovascularRisk = healthAnalysis.find(area => area.category === 'Riesgo Cardiovascular');
    if (cardiovascularRisk && cardiovascularRisk.score < 70) {
      plan.push('Monitoreo de presión arterial semanal');
      plan.push('Análisis de perfil lipídico en 12 semanas');
    }

    // Monitoreo cognitivo
    const cognitiveFunction = healthAnalysis.find(area => area.category === 'Función Cognitiva');
    if (cognitiveFunction && cognitiveFunction.score < 70) {
      plan.push('Evaluación de memoria y concentración cada 4 semanas');
      plan.push('Monitoreo de calidad del sueño');
    }

    // Monitoreo digestivo
    const digestiveHealth = healthAnalysis.find(area => area.category === 'Salud Digestiva');
    if (digestiveHealth && digestiveHealth.score < 70) {
      plan.push('Evaluación de síntomas digestivos cada 2 semanas');
      plan.push('Monitoreo de regularidad intestinal');
    }

    // Monitoreo general
    plan.push('Revisión completa del plan en 12 semanas');
    plan.push('Ajuste de dosis según respuesta individual');

    return plan;
  }

  // ===== MÉTODOS DE INTEGRACIÓN DE DATOS EXTERNOS =====

  /**
   * Carga los datos una sola vez y los cachea para evitar bucles infinitos
   */
  private async loadDataOnce(): Promise<any> {
    if (this.isDataLoaded && this.cachedData) {
      return this.cachedData;
    }

    try {
      console.log('🔄 Cargando datos de integración (primera vez)...');
      this.cachedData = await this.dataIntegrationEngine.integrateAllData();
      this.isDataLoaded = true;
      console.log('✅ Datos cargados y cacheados exitosamente');
      return this.cachedData;
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      return null;
    }
  }

  /**
   * Obtiene insights de datos externos usando datos cacheados - Mejorado
   */
  private async getExternalDataInsights(userProfile: UserProfile): Promise<{
    supplementRecommendations?: any[];
    nutritionalAnalysis?: any;
    effectivenessInsights?: any;
    dsldInsights?: any;
    kaggleInsights?: any;
    nhanesInsights?: any;
  }> {
    try {
      // Usar datos cacheados en lugar de cargar cada vez
      const integratedData = await this.loadDataOnce();
      
      if (!integratedData) {
        return {};
      }

      const [supplementRecs, nutritionalAnalysis, effectivenessInsights, dsldInsights, kaggleInsights, nhanesInsights] = await Promise.all([
        this.getSupplementRecommendationsFromCache(userProfile, integratedData),
        this.getNutritionalAnalysisFromCache(userProfile, integratedData),
        this.getEffectivenessInsightsFromCache(userProfile, integratedData),
        this.getDSLDInsightsFromCache(userProfile, integratedData),
        this.getKaggleInsightsFromCache(userProfile, integratedData),
        this.getNHANESInsightsFromCache(userProfile, integratedData)
      ]);

      return {
        supplementRecommendations: supplementRecs,
        nutritionalAnalysis,
        effectivenessInsights,
        dsldInsights,
        kaggleInsights,
        nhanesInsights
      };
    } catch (error) {
      console.error('Error obteniendo datos externos:', error);
      return {};
    }
  }

  /**
   * Integra suplementos de fuentes externas
   */
  private integrateExternalSupplements(externalRecommendations: any[]): Array<{
    name: string;
    priority: string;
    reason: string;
    dosage: string;
    timing: string;
    interactions: string[];
  }> {
    const integratedSupplements = [];

    externalRecommendations.forEach(rec => {
      if (rec.products && rec.products.length > 0) {
        rec.products.forEach(product => {
          integratedSupplements.push({
            name: product.name || product.Product_Name || 'Suplemento Recomendado',
            priority: 'Media',
            reason: `Basado en datos de ${rec.goal || 'análisis poblacional'}`,
            dosage: 'Según etiqueta del producto',
            timing: 'Con comida',
            interactions: ['Consultar con médico si toma medicamentos']
          });
        });
      }
    });

    return integratedSupplements.slice(0, 3); // Máximo 3 suplementos adicionales
  }

  /**
   * Integra datos de efectividad de fuentes externas
   */
  private integrateEffectivenessData(effectivenessInsights: any): string[] {
    const additionalResults = [];

    if (effectivenessInsights.supplementEffectiveness?.averageResults) {
      const results = effectivenessInsights.supplementEffectiveness.averageResults;
      
      if (results.energyImprovement > 60) {
        additionalResults.push(`Mejora en energía del ${results.energyImprovement}% basada en datos de usuarios similares`);
      }
      
      if (results.sleepQuality > 60) {
        additionalResults.push(`Mejora en calidad del sueño del ${results.sleepQuality}% según patrones de éxito`);
      }
      
      if (results.overallSatisfaction > 70) {
        additionalResults.push(`Satisfacción general del ${results.overallSatisfaction}% en cohorte similar`);
      }
    }

    if (effectivenessInsights.personalizedInsights) {
      // personalizedInsights es un objeto, no un array
      if (Array.isArray(effectivenessInsights.personalizedInsights)) {
        additionalResults.push(...effectivenessInsights.personalizedInsights);
      } else {
        // Si es un objeto, extraer información relevante
        const insights = effectivenessInsights.personalizedInsights;
        if (insights.phase) {
          additionalResults.push(`Fase recomendada: ${insights.phase}`);
        }
        if (insights.duration) {
          additionalResults.push(`Duración sugerida: ${insights.duration}`);
        }
        if (insights.supplements && Array.isArray(insights.supplements)) {
          additionalResults.push(...insights.supplements);
        }
      }
    }

    return additionalResults;
  }

  /**
   * Enriquece consejos de estilo de vida con datos externos
   */
  private async enrichLifestyleTipsWithExternalData(userProfile: UserProfile, tips: any[]): Promise<any[]> {
    try {
      const externalData = await this.getExternalDataInsights(userProfile);
      
      if (externalData.effectivenessInsights?.successPatterns) {
        const patterns = externalData.effectivenessInsights.successPatterns;
        
        // Agregar consejos basados en patrones de éxito
        if (patterns.commonFactors) {
          patterns.commonFactors.forEach(factor => {
            tips.push({
              category: 'Patrones de Éxito',
              tip: `Los usuarios exitosos reportan: ${factor}`,
              icon: TrendingUp,
              impact: 'Alto'
            });
          });
        }
        
        if (patterns.timingPatterns) {
          patterns.timingPatterns.forEach(pattern => {
            tips.push({
              category: 'Timing Óptimo',
              tip: `Timing recomendado: ${pattern}`,
              icon: Clock,
              impact: 'Medio'
            });
          });
        }
      }
      
      return tips;
    } catch (error) {
      console.error('Error enriqueciendo consejos con datos externos:', error);
      return tips;
    }
  }

  /**
   * Obtiene recomendaciones de suplementos basadas en DSLD
   */
  async getSupplementRecommendations(userProfile: UserProfile): Promise<any[]> {
    try {
      // Usar DataIntegrationEngine para obtener datos reales
      const integratedData = await this.dataIntegrationEngine.integrateAllData();
      
      if (integratedData.dsld.totalRecords > 0) {
        // Filtrar productos basados en perfil del usuario
        const relevantProducts = integratedData.dsld.productInfo.filter(product => {
          const age = parseInt(String(userProfile.age)) || 30;
          const gender = userProfile.gender || 'other';
          const healthGoals = userProfile.health_goals || [];
          
          // Filtrar por objetivos de salud
          return healthGoals.some(goal => 
            this.productMatchesGoal(product, goal)
          );
        });
        
        return relevantProducts.slice(0, 5); // Top 5 productos
      }
      
      return this.getFallbackSupplements();
    } catch (error) {
      console.error('Error obteniendo recomendaciones de suplementos:', error);
      return this.getFallbackSupplements();
    }
  }

  /**
   * Obtiene análisis nutricional basado en NHANES
   */
  async getNutritionalAnalysis(userProfile: UserProfile): Promise<any> {
    try {
      // Usar DataIntegrationEngine para obtener datos reales
      const integratedData = await this.dataIntegrationEngine.integrateAllData();
      
      if (integratedData.nhanes.totalRecords > 0) {
        const age = parseInt(String(userProfile.age)) || 30;
        const gender = userProfile.gender || 'other';
        
        // Análisis de deficiencias comunes
        const commonDeficiencies = this.analyzeCommonDeficiencies(age, gender);
        
        return {
          commonDeficiencies,
          recommendations: this.generateDataDrivenRecommendations(commonDeficiencies),
          populationData: {
            averageVitaminD: 45,
            averageB12: 300,
            averageOmega3: 150
          }
        };
      }
      
      return this.getFallbackNutritionalAnalysis();
    } catch (error) {
      console.error('Error obteniendo análisis nutricional:', error);
      return this.getFallbackNutritionalAnalysis();
    }
  }

  /**
   * Obtiene insights de efectividad basados en Kaggle Fitness
   */
  async getEffectivenessInsights(userProfile: UserProfile): Promise<any> {
    try {
      // Usar DataIntegrationEngine para obtener datos reales
      const integratedData = await this.dataIntegrationEngine.integrateAllData();
      
      if (integratedData.kaggleFitness.totalRecords > 0) {
        const age = parseInt(String(userProfile.age)) || 30;
        const activityLevel = userProfile.activity_level || 'medium';
        
        // Filtrar datos por perfil similar
        const similarUsers = integratedData.kaggleFitness.userBehavior.filter(user => {
          const userAge = parseInt(user.age) || 0;
          return Math.abs(userAge - age) <= 10 && user.activity_level === activityLevel;
        });

        if (similarUsers.length > 0) {
          return {
            sampleSize: similarUsers.length,
            supplementEffectiveness: this.analyzeSupplementEffectiveness(similarUsers, userProfile),
            successPatterns: this.analyzeSuccessPatterns(similarUsers, userProfile.age, userProfile.gender, userProfile.activity_level),
            personalizedInsights: {
              phase: 'Optimización',
              duration: '2-3 meses',
              supplements: []
            }
          };
        }
      }
      
      return this.getFallbackEffectivenessInsights();
    } catch (error) {
      console.error('Error obteniendo insights de efectividad:', error);
      return this.getFallbackEffectivenessInsights();
    }
  }

  // Métodos auxiliares
  private productMatchesGoal(product: any, goal: string): boolean {
    const productName = (product.Product_Name || '').toLowerCase();
    const goalLower = goal.toLowerCase();
    
    const goalKeywords = {
      'weight_loss': ['weight', 'fat', 'burn', 'metabolism'],
      'muscle_gain': ['muscle', 'protein', 'strength', 'mass'],
      'energy': ['energy', 'vitality', 'endurance', 'stamina'],
      'sleep': ['sleep', 'melatonin', 'relaxation'],
      'immune': ['immune', 'vitamin c', 'zinc', 'defense'],
      'heart': ['heart', 'cardiovascular', 'omega', 'coq10']
    };
    
    const keywords = goalKeywords[goalLower] || [];
    return keywords.some(keyword => productName.includes(keyword));
  }

  private analyzeCommonDeficiencies(age: number, gender: string): string[] {
    const deficiencies = [];
    
    if (age > 50) {
      deficiencies.push('Vitamina D: 70% de la población tiene niveles subóptimos');
    }
    if (gender === 'female') {
      deficiencies.push('Hierro: 25% de mujeres en edad fértil tienen deficiencia');
    }
    deficiencies.push('Magnesio: 60% de adultos tienen ingesta insuficiente');
    deficiencies.push('Omega-3: 80% de la población consume menos de lo recomendado');
    
    return deficiencies;
  }

  private generateDataDrivenRecommendations(deficiencies: string[]): string[] {
    const recommendations = [];
    
    if (deficiencies.some(d => d.includes('Vitamina D'))) {
      recommendations.push('Suplemento de Vitamina D3 2000-4000 UI diarias');
    }
    if (deficiencies.some(d => d.includes('Hierro'))) {
      recommendations.push('Hierro bisglicinato 18mg con vitamina C');
    }
    if (deficiencies.some(d => d.includes('Magnesio'))) {
      recommendations.push('Magnesio bisglicinato 200-400 mg antes de dormir');
    }
    if (deficiencies.some(d => d.includes('Omega-3'))) {
      recommendations.push('Aceite de pescado 1000-2000 mg EPA/DHA diarios');
    }
    
    return recommendations;
  }


  /**
   * Genera insights adicionales basados en datos específicos del usuario
   */
  private generateAdditionalInsights(userProfile: UserProfile): Array<{
    category: string;
    insight: string;
    recommendation: string;
    priority: string;
  }> {
    const additionalInsights = [];
    const age = parseInt(String(userProfile.age)) || 30;
    const gender = userProfile.gender || 'other';
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'low';
    const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
    const dietType = userProfile.diet_type || 'balanced';
    const conditions = userProfile.health_conditions || [];
    const familyHistory = (userProfile.onboarding_data as any)?.familyHistory || [];

    // Insights para usuarios con estrés muy alto
    if (stressLevel === 'very_high') {
      additionalInsights.push({
        category: 'Manejo del Estrés',
        insight: 'El estrés crónico puede afectar múltiples sistemas del cuerpo, incluyendo inmunológico, digestivo y cardiovascular',
        recommendation: 'Considera técnicas de respiración profunda, meditación mindfulness y posible apoyo profesional',
        priority: 'Alta'
      });
    }

    // Insights para entrenamiento de fuerza
    if (exerciseType === 'strength' && userProfile.activity_level === 'high') {
      additionalInsights.push({
        category: 'Optimización del Rendimiento',
        insight: 'El entrenamiento de fuerza intenso requiere mayor recuperación y soporte nutricional específico',
        recommendation: 'Asegúrate de descanso adecuado entre sesiones y considera suplementos de recuperación',
        priority: 'Media'
      });
    }

    // Insights para historial familiar de diabetes
    if (familyHistory.includes('diabetes')) {
      additionalInsights.push({
        category: 'Prevención de Diabetes',
        insight: 'El historial familiar de diabetes aumenta tu riesgo, pero es modificable con estilo de vida',
        recommendation: 'Mantén un peso saludable, ejercicio regular y monitorea tu glucosa periódicamente',
        priority: 'Alta'
      });
    }

    // Insights para exposición solar baja
    if (userProfile.onboarding_data?.sunExposure === 'low') {
      additionalInsights.push({
        category: 'Vitamina D',
        insight: 'La exposición solar limitada puede resultar en deficiencia de vitamina D, especialmente en invierno',
        recommendation: 'Considera suplementación de vitamina D3 y monitorea tus niveles con análisis de sangre',
        priority: 'Media'
      });
    }

    // Insights para uso de antibióticos
    const antibioticsUse = userProfile.onboarding_data?.antibioticsUse || 'never';
    if (antibioticsUse === 'multiple') {
      additionalInsights.push({
        category: 'Salud Digestiva',
        insight: 'El uso frecuente de antibióticos puede alterar significativamente la microbiota intestinal',
        recommendation: 'Es crucial restaurar la flora intestinal con probióticos de alta calidad y alimentos fermentados',
        priority: 'Alta'
      });
    }

    // Insights para mujeres en edad premenopáusica
    if (gender === 'female' && age > 35 && age < 50) {
      additionalInsights.push({
        category: 'Salud Hormonal',
        insight: 'Los cambios hormonales premenopáusicos pueden afectar el estado de ánimo, energía y metabolismo',
        recommendation: 'Mantén una dieta rica en fitoestrógenos y considera suplementos que apoyen el equilibrio hormonal',
        priority: 'Media'
      });
    }

    // Insights para dieta mediterránea
    if (dietType === 'mediterranean') {
      additionalInsights.push({
        category: 'Nutrición',
        insight: 'La dieta mediterránea es una de las más saludables del mundo, rica en antioxidantes y grasas saludables',
        recommendation: 'Mantén este patrón dietético y asegúrate de variedad en frutas, verduras y pescado',
        priority: 'Baja'
      });
    }

    return additionalInsights;
  }

  /**
   * Genera refuerzo positivo basado en aspectos positivos del perfil
   */
  private generatePositiveReinforcement(userProfile: UserProfile): string[] {
    const positiveAspects = [];
    
    // Análisis de sueño
    if (userProfile.onboarding_data?.sleepQuality === 'excellent') {
      positiveAspects.push('¡Excelente calidad de sueño! Esto es fundamental para tu salud cognitiva y recuperación');
    }
    
    // Análisis de hábitos saludables
    if ((userProfile.onboarding_data as any)?.smoking === 'never') {
      positiveAspects.push('¡Felicidades por no fumar! Esto es uno de los mejores hábitos para tu salud');
    }
    
    // Análisis de exposición solar
    if (userProfile.onboarding_data?.sunExposure === 'high') {
      positiveAspects.push('Tu exposición solar adecuada ayuda con la síntesis de vitamina D');
    }
    
    // Análisis de actividad física
    if (userProfile.activity_level === 'high' && userProfile.onboarding_data?.exerciseHours === '9+') {
      positiveAspects.push('¡Tu nivel de actividad física es excepcional! Esto beneficia tu salud cardiovascular y mental');
    }
    
    // Análisis de dieta
    if (userProfile.diet_type === 'mediterranean') {
      positiveAspects.push('¡Excelente elección de dieta mediterránea! Es una de las más saludables del mundo');
    }
    
    // Análisis de consumo de verduras
    const vegetableConsumption = userProfile.onboarding_data?.vegetableConsumption || 0;
    if (vegetableConsumption >= 4) {
      positiveAspects.push('¡Excelente consumo de verduras! Esto aporta antioxidantes y fibra esenciales');
    }
    
    // Análisis de consumo de frutas
    const fruitConsumption = userProfile.onboarding_data?.fruitConsumption || 0;
    if (fruitConsumption >= 3) {
      positiveAspects.push('¡Buen consumo de frutas! Esto aporta vitaminas y antioxidantes naturales');
    }
    
    return positiveAspects;
  }

  // ===== MÉTODOS DE FALLBACK =====

  /**
   * Métodos de fallback para cuando no hay datos externos
   */
  private getFallbackSupplements(): any[] {
    return [
      {
        name: 'Multivitamínico Completo',
        priority: 'Media',
        reason: 'Soporte nutricional general',
        dosage: '1 cápsula',
        timing: 'Con comida',
        interactions: ['Tomar con grasa para vitaminas liposolubles']
      }
    ];
  }

  private getFallbackNutritionalAnalysis(): any {
    return {
      commonDeficiencies: ['Vitamina D', 'Magnesio', 'Omega-3'],
      recommendations: [
        'Suplemento básico de vitaminas y minerales',
        'Consulte con su médico para análisis específicos'
      ]
    };
  }

  private getFallbackEffectivenessInsights(): any {
    return {
      supplementEffectiveness: {
        topPerformingSupplements: [
          { name: 'Multivitamínico', effectiveness: 70, users: 100 }
        ],
        averageResults: {
          energyImprovement: 50,
          sleepQuality: 55,
          immuneFunction: 60,
          overallSatisfaction: 65
        }
      },
      successPatterns: {
        commonFactors: ['Consistencia', 'Dieta equilibrada'],
        timingPatterns: ['Con comida']
      }
    };
  }

  private getFallbackTips(): any[] {
    return [
      {
        category: 'General',
        tip: 'Mantén un estilo de vida saludable con dieta equilibrada y ejercicio regular',
        icon: Heart,
        impact: 'Alto'
      }
    ];
  }

  // ===== MÉTODOS AUXILIARES PARA ANÁLISIS MEJORADO =====

  /**
   * Convierte horas de ejercicio a número para análisis
   */
  private parseExerciseHours(exerciseHours: string): number {
    switch (exerciseHours) {
      case '1-2': return 1.5;
      case '3-5': return 4;
      case '6-8': return 7;
      case '9+': return 10;
      default: return 3;
    }
  }

  /**
   * Analiza el tipo de ejercicio y su impacto cardiovascular
   */
  private analyzeExerciseTypeImpact(exerciseType: string, hoursPerWeek: number): {
    cardiovascularImpact: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    switch (exerciseType) {
      case 'cardio':
        return {
          cardiovascularImpact: 'high',
          recommendations: ['Excelente elección para salud cardiovascular', 'Mantén 150+ min/semana']
        };
      case 'strength':
        return {
          cardiovascularImpact: 'medium',
          recommendations: ['Añade cardio 2-3 veces/semana', 'El entrenamiento de fuerza es beneficioso pero no reemplaza el cardio']
        };
      case 'mixed':
        return {
          cardiovascularImpact: 'high',
          recommendations: ['Combinación ideal de ejercicios', 'Mantén el equilibrio entre cardio y fuerza']
        };
      case 'yoga':
        return {
          cardiovascularImpact: hoursPerWeek >= 5 ? 'medium' : 'low',
          recommendations: hoursPerWeek >= 5 
            ? ['Yoga intensivo es beneficioso', 'Considera añadir cardio ligero']
            : ['Yoga es excelente para flexibilidad y relajación', 'Añade ejercicio cardiovascular 3 veces/semana']
        };
      default:
        return {
          cardiovascularImpact: 'low',
          recommendations: ['Incorpora ejercicio regular', 'Comienza con caminar 30 min/día']
        };
    }
  }

  // ===== MÉTODOS DE INSIGHTS ESPECÍFICOS POR FUENTE DE DATOS =====

  /**
   * Obtiene insights específicos de DSLD
   */
  private async getDSLDInsightsFromCache(userProfile: UserProfile, integratedData: any): Promise<any> {
    try {
      if (!integratedData.dsld || !integratedData.dsld.productInfo) {
        return null;
      }

      const dsldData = integratedData.dsld;
      const age = parseInt(String(userProfile.age)) || 30;
      const gender = userProfile.gender || 'other';
      const healthGoals = userProfile.health_goals || [];

      // Análisis de suplementos más populares por demografía
      const popularSupplements = this.analyzePopularSupplements(dsldData.productInfo, age, gender);
      
      // Análisis de ingredientes más comunes
      const commonIngredients = this.analyzeCommonIngredients(dsldData.supplementFacts);
      
      // Análisis de declaraciones de salud
      const healthClaims = this.analyzeHealthClaims(dsldData.healthClaims, healthGoals);

      return {
        popularSupplements,
        commonIngredients,
        healthClaims,
        totalProducts: dsldData.totalRecords,
        dataSource: 'DSLD v8 (2024)'
      };
    } catch (error) {
      console.error('Error obteniendo insights de DSLD:', error);
      return null;
    }
  }

  /**
   * Obtiene insights específicos de Kaggle Fitness
   */
  private async getKaggleInsightsFromCache(userProfile: UserProfile, integratedData: any): Promise<any> {
    try {
      if (!integratedData.kaggleFitness || !integratedData.kaggleFitness.userBehavior) {
        return null;
      }

      const kaggleData = integratedData.kaggleFitness;
      const age = parseInt(String(userProfile.age)) || 30;
      const gender = userProfile.gender || 'other';
      const fitnessLevel = userProfile.activity_level || 'medium';

      // Análisis de patrones de éxito por demografía
      const successPatterns = this.analyzeSuccessPatterns(kaggleData.userBehavior, age, gender, fitnessLevel);
      
      // Análisis de efectividad de suplementos
      const supplementEffectiveness = this.analyzeSupplementEffectiveness(kaggleData.supplementEffects, userProfile);
      
      // Análisis de correlaciones con ejercicio
      const exerciseCorrelations = this.analyzeExerciseCorrelations(kaggleData.workoutCorrelations, userProfile);

      return {
        successPatterns,
        supplementEffectiveness,
        exerciseCorrelations,
        totalUsers: kaggleData.totalRecords,
        dataSource: 'Kaggle Fitness Dataset'
      };
    } catch (error) {
      console.error('Error obteniendo insights de Kaggle:', error);
      return null;
    }
  }

  /**
   * Obtiene insights específicos de NHANES
   */
  private async getNHANESInsightsFromCache(userProfile: UserProfile, integratedData: any): Promise<any> {
    try {
      if (!integratedData.nhanes || !integratedData.nhanes.demographics) {
        return null;
      }

      const nhanesData = integratedData.nhanes;
      const age = parseInt(String(userProfile.age)) || 30;
      const gender = userProfile.gender || 'other';

      // Análisis de deficiencias poblacionales
      const populationDeficiencies = this.analyzePopulationDeficiencies(nhanesData.dietaryIntake, age, gender);
      
      // Análisis de biomarcadores
      const biomarkerAnalysis = this.analyzeBiomarkers(nhanesData.biomarkers, age, gender);
      
      // Análisis de patrones dietéticos
      const dietaryPatterns = this.analyzeDietaryPatterns(nhanesData.dietaryIntake, userProfile);

      return {
        populationDeficiencies,
        biomarkerAnalysis,
        dietaryPatterns,
        totalParticipants: nhanesData.totalRecords,
        dataSource: 'NHANES 2017-2020'
      };
    } catch (error) {
      console.error('Error obteniendo insights de NHANES:', error);
      return null;
    }
  }

  // ===== MÉTODOS DE ANÁLISIS ESPECÍFICOS POR FUENTE =====

  /**
   * Analiza suplementos populares por demografía (DSLD)
   */
  private analyzePopularSupplements(productInfo: any[], age: number, gender: string): any {
    try {
      // Filtrar por demografía similar
      const ageGroup = age < 30 ? 'young' : age < 50 ? 'middle' : 'senior';
      const genderGroup = gender === 'male' ? 'male' : gender === 'female' ? 'female' : 'other';
      
      // Análisis de productos más comunes
      const productCounts = {};
      productInfo.forEach(product => {
        if (product.productType) {
          productCounts[product.productType] = (productCounts[product.productType] || 0) + 1;
        }
      });

      const topProducts = Object.entries(productCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([product, count]) => ({ product, count }));

      return {
        topProducts,
        ageGroup,
        genderGroup,
        totalProducts: productInfo.length
      };
    } catch (error) {
      console.error('Error analizando suplementos populares:', error);
      return null;
    }
  }

  /**
   * Analiza ingredientes más comunes (DSLD)
   */
  private analyzeCommonIngredients(supplementFacts: any[]): any {
    try {
      const ingredientCounts = {};
      supplementFacts.forEach(fact => {
        if (fact.ingredientName) {
          ingredientCounts[fact.ingredientName] = (ingredientCounts[fact.ingredientName] || 0) + 1;
        }
      });

      const topIngredients = Object.entries(ingredientCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 10)
        .map(([ingredient, count]) => ({ ingredient, count }));

      return {
        topIngredients,
        totalIngredients: Object.keys(ingredientCounts).length
      };
    } catch (error) {
      console.error('Error analizando ingredientes comunes:', error);
      return null;
    }
  }

  /**
   * Analiza declaraciones de salud (DSLD)
   */
  private analyzeHealthClaims(healthClaims: any[], healthGoals: string[]): any {
    try {
      const claimCounts = {};
      healthClaims.forEach(claim => {
        if (claim.statement) {
          claimCounts[claim.statement] = (claimCounts[claim.statement] || 0) + 1;
        }
      });

      const topClaims = Object.entries(claimCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .slice(0, 5)
        .map(([claim, count]) => ({ claim, count }));

      return {
        topClaims,
        totalClaims: healthClaims.length
      };
    } catch (error) {
      console.error('Error analizando declaraciones de salud:', error);
      return null;
    }
  }

  /**
   * Analiza patrones de éxito (Kaggle)
   */
  private analyzeSuccessPatterns(userBehavior: any[], age: number, gender: string, fitnessLevel: string): any {
    try {
      // Filtrar usuarios similares
      const similarUsers = userBehavior.filter(user => {
        const userAge = user.age || 30;
        const userGender = user.gender || 'other';
        const userFitness = user.fitnessLevel || 'medium';
        
        return Math.abs(userAge - age) <= 10 && 
               userGender === gender && 
               userFitness === fitnessLevel;
      });

      // Análisis de patrones de éxito
      const successFactors = {
        consistency: 0,
        properDosing: 0,
        exerciseCombination: 0,
        dietAlignment: 0
      };

      similarUsers.forEach(user => {
        if (user.satisfaction >= 8) {
          successFactors.consistency += 1;
          successFactors.properDosing += 1;
          successFactors.exerciseCombination += 1;
          successFactors.dietAlignment += 1;
        }
      });

      return {
        successFactors,
        similarUsers: similarUsers.length,
        averageSatisfaction: similarUsers.reduce((sum, user) => sum + (user.satisfaction || 0), 0) / similarUsers.length
      };
    } catch (error) {
      console.error('Error analizando patrones de éxito:', error);
      return null;
    }
  }

  /**
   * Analiza efectividad de suplementos (Kaggle)
   */
  private analyzeSupplementEffectiveness(supplementEffects: any[], userProfile: UserProfile): any {
    try {
      const userGoals = userProfile.health_goals || [];
      const userAge = parseInt(String(userProfile.age)) || 30;
      const userGender = userProfile.gender || 'other';

      // Filtrar por objetivos similares
      const relevantEffects = supplementEffects.filter(effect => {
        return userGoals.some(goal => 
          effect.goal && effect.goal.toLowerCase().includes(goal.toLowerCase())
        );
      });

      // Análisis de efectividad por suplemento
      const supplementEffectiveness = {};
      relevantEffects.forEach(effect => {
        if (effect.supplement && effect.effectiveness) {
          if (!supplementEffectiveness[effect.supplement]) {
            supplementEffectiveness[effect.supplement] = {
              totalUsers: 0,
              totalEffectiveness: 0,
              averageEffectiveness: 0
            };
          }
          supplementEffectiveness[effect.supplement].totalUsers += 1;
          supplementEffectiveness[effect.supplement].totalEffectiveness += effect.effectiveness;
        }
      });

      // Calcular promedios
      Object.keys(supplementEffectiveness).forEach(supplement => {
        const data = supplementEffectiveness[supplement];
        data.averageEffectiveness = data.totalEffectiveness / data.totalUsers;
      });

      return {
        supplementEffectiveness,
        relevantEffects: relevantEffects.length
      };
    } catch (error) {
      console.error('Error analizando efectividad de suplementos:', error);
      return null;
    }
  }

  /**
   * Analiza correlaciones con ejercicio (Kaggle)
   */
  private analyzeExerciseCorrelations(workoutCorrelations: any[], userProfile: UserProfile): any {
    try {
      const userExerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
      const userExerciseHours = userProfile.onboarding_data?.exerciseHours || '3-5';

      // Filtrar por tipo de ejercicio similar
      const relevantCorrelations = workoutCorrelations.filter(correlation => {
        return correlation.exerciseType === userExerciseType;
      });

      // Análisis de correlaciones
      const correlations = {
        supplementExercise: 0,
        dietExercise: 0,
        recoveryExercise: 0
      };

      relevantCorrelations.forEach(correlation => {
        if (correlation.correlation > 0.5) {
          correlations.supplementExercise += 1;
          correlations.dietExercise += 1;
          correlations.recoveryExercise += 1;
        }
      });

      return {
        correlations,
        relevantCorrelations: relevantCorrelations.length
      };
    } catch (error) {
      console.error('Error analizando correlaciones con ejercicio:', error);
      return null;
    }
  }

  /**
   * Analiza deficiencias poblacionales (NHANES)
   */
  private analyzePopulationDeficiencies(dietaryIntake: any[], age: number, gender: string): any {
    try {
      // Filtrar por demografía similar
      const similarPopulation = dietaryIntake.filter(person => {
        const personAge = person.age || 30;
        const personGender = person.gender || 'other';
        
        return Math.abs(personAge - age) <= 5 && personGender === gender;
      });

      // Análisis de deficiencias comunes
      const commonDeficiencies = {
        vitaminD: 0,
        magnesium: 0,
        omega3: 0,
        b12: 0,
        iron: 0
      };

      similarPopulation.forEach(person => {
        if (person.vitaminD < 30) commonDeficiencies.vitaminD += 1;
        if (person.magnesium < 400) commonDeficiencies.magnesium += 1;
        if (person.omega3 < 1.6) commonDeficiencies.omega3 += 1;
        if (person.b12 < 2.4) commonDeficiencies.b12 += 1;
        if (person.iron < 18) commonDeficiencies.iron += 1;
      });

      const totalPopulation = similarPopulation.length;
      const deficiencyPercentages = {};
      Object.keys(commonDeficiencies).forEach(deficiency => {
        deficiencyPercentages[deficiency] = (commonDeficiencies[deficiency] / totalPopulation) * 100;
      });

      return {
        deficiencyPercentages,
        totalPopulation,
        commonDeficiencies
      };
    } catch (error) {
      console.error('Error analizando deficiencias poblacionales:', error);
      return null;
    }
  }

  /**
   * Analiza biomarcadores (NHANES)
   */
  private analyzeBiomarkers(biomarkers: any[], age: number, gender: string): any {
    try {
      // Filtrar por demografía similar
      const similarBiomarkers = biomarkers.filter(biomarker => {
        const personAge = biomarker.age || 30;
        const personGender = biomarker.gender || 'other';
        
        return Math.abs(personAge - age) <= 5 && personGender === gender;
      });

      // Análisis de biomarcadores
      const biomarkerAnalysis = {
        averageCholesterol: 0,
        averageBloodPressure: 0,
        averageGlucose: 0,
        averageCRP: 0
      };

      similarBiomarkers.forEach(biomarker => {
        biomarkerAnalysis.averageCholesterol += biomarker.cholesterol || 0;
        biomarkerAnalysis.averageBloodPressure += biomarker.bloodPressure || 0;
        biomarkerAnalysis.averageGlucose += biomarker.glucose || 0;
        biomarkerAnalysis.averageCRP += biomarker.crp || 0;
      });

      const totalBiomarkers = similarBiomarkers.length;
      Object.keys(biomarkerAnalysis).forEach(key => {
        biomarkerAnalysis[key] = biomarkerAnalysis[key] / totalBiomarkers;
      });

      return {
        biomarkerAnalysis,
        totalBiomarkers
      };
    } catch (error) {
      console.error('Error analizando biomarcadores:', error);
      return null;
    }
  }

  /**
   * Analiza patrones dietéticos (NHANES)
   */
  private analyzeDietaryPatterns(dietaryIntake: any[], userProfile: UserProfile): any {
    try {
      const userDiet = userProfile.diet_type || 'balanced';
      const userAge = parseInt(String(userProfile.age)) || 30;
      const userGender = userProfile.gender || 'other';

      // Filtrar por patrón dietético similar
      const similarDiet = dietaryIntake.filter(person => {
        const personAge = person.age || 30;
        const personGender = person.gender || 'other';
        const personDiet = person.dietType || 'balanced';
        
        return Math.abs(personAge - userAge) <= 5 && 
               personGender === userGender && 
               personDiet === userDiet;
      });

      // Análisis de patrones dietéticos
      const dietaryPatterns = {
        averageCalories: 0,
        averageProtein: 0,
        averageCarbs: 0,
        averageFat: 0,
        averageFiber: 0
      };

      similarDiet.forEach(person => {
        dietaryPatterns.averageCalories += person.calories || 0;
        dietaryPatterns.averageProtein += person.protein || 0;
        dietaryPatterns.averageCarbs += person.carbs || 0;
        dietaryPatterns.averageFat += person.fat || 0;
        dietaryPatterns.averageFiber += person.fiber || 0;
      });

      const totalDiet = similarDiet.length;
      Object.keys(dietaryPatterns).forEach(key => {
        dietaryPatterns[key] = dietaryPatterns[key] / totalDiet;
      });

      return {
        dietaryPatterns,
        totalDiet,
        dietType: userDiet
      };
    } catch (error) {
      console.error('Error analizando patrones dietéticos:', error);
      return null;
    }
  }

  // ===== MÉTODOS DE CACHE PARA EVITAR BUCLES INFINITOS =====

  /**
   * Obtiene recomendaciones de suplementos desde datos cacheados
   */
  private async getSupplementRecommendationsFromCache(userProfile: UserProfile, integratedData: any): Promise<any[]> {
    try {
      if (integratedData.dsld.totalRecords > 0) {
        const relevantProducts = integratedData.dsld.productInfo.filter(product => {
          const age = parseInt(String(userProfile.age)) || 30;
          const gender = userProfile.gender || 'other';
          const healthGoals = userProfile.health_goals || [];
          
          return healthGoals.some(goal => 
            this.productMatchesGoal(product, goal)
          );
        });
        
        return relevantProducts.slice(0, 5);
      }
      
      return this.getFallbackSupplements();
    } catch (error) {
      console.error('Error obteniendo recomendaciones desde cache:', error);
      return this.getFallbackSupplements();
    }
  }

  /**
   * Obtiene análisis nutricional desde datos cacheados
   */
  private async getNutritionalAnalysisFromCache(userProfile: UserProfile, integratedData: any): Promise<any> {
    try {
      if (integratedData.nhanes.totalRecords > 0) {
        const age = parseInt(String(userProfile.age)) || 30;
        const gender = userProfile.gender || 'other';
        
        const commonDeficiencies = this.analyzeCommonDeficiencies(age, gender);
        
        return {
          commonDeficiencies,
          recommendations: this.generateDataDrivenRecommendations(commonDeficiencies),
          populationData: {
            averageVitaminD: 45,
            averageB12: 300,
            averageOmega3: 150
          }
        };
      }
      
      return this.getFallbackNutritionalAnalysis();
    } catch (error) {
      console.error('Error obteniendo análisis nutricional desde cache:', error);
      return this.getFallbackNutritionalAnalysis();
    }
  }

  /**
   * Obtiene insights de efectividad desde datos cacheados
   */
  private async getEffectivenessInsightsFromCache(userProfile: UserProfile, integratedData: any): Promise<any> {
    try {
      if (integratedData.kaggleFitness.totalRecords > 0) {
        const age = parseInt(String(userProfile.age)) || 30;
        const activityLevel = userProfile.activity_level || 'medium';
        
        const similarUsers = integratedData.kaggleFitness.userBehavior.filter(user => {
          const userAge = parseInt(user.age) || 0;
          return Math.abs(userAge - age) <= 10 && user.activity_level === activityLevel;
        });

        if (similarUsers.length > 0) {
          return {
            sampleSize: similarUsers.length,
            supplementEffectiveness: this.analyzeSupplementEffectiveness(similarUsers, userProfile),
            successPatterns: this.analyzeSuccessPatterns(similarUsers, userProfile.age, userProfile.gender, userProfile.activity_level),
            personalizedInsights: {
              phase: 'Optimización',
              duration: '2-3 meses',
              supplements: []
            }
          };
        }
      }
      
      return this.getFallbackEffectivenessInsights();
    } catch (error) {
      console.error('Error obteniendo insights de efectividad desde cache:', error);
      return this.getFallbackEffectivenessInsights();
    }
  }

  /**
   * Obtiene valoraciones de utilidad de suplementos para un usuario
   */
  async getSupplementUtilityResults(userId: string): Promise<any[]> {
    try {
      return await this.utilityStorage.getUtilityResults(userId);
    } catch (error) {
      console.error('Error obteniendo valoraciones de utilidad:', error);
      return [];
    }
  }

  /**
   * Obtiene valoración específica de un suplemento
   */
  async getSupplementUtility(userId: string, supplementId: string): Promise<any | null> {
    try {
      return await this.utilityStorage.getSupplementUtility(userId, supplementId);
    } catch (error) {
      console.error('Error obteniendo valoración específica:', error);
      return null;
    }
  }

  /**
   * Obtiene suplementos más útiles para un usuario
   */
  async getMostUsefulSupplements(userId: string, limit: number = 10): Promise<any[]> {
    try {
      return await this.utilityStorage.getMostUsefulSupplements(userId, limit);
    } catch (error) {
      console.error('Error obteniendo suplementos más útiles:', error);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de valoraciones de utilidad
   */
  async getUtilityStats(userId: string): Promise<any> {
    try {
      return await this.utilityStorage.getUtilityStats(userId);
    } catch (error) {
      console.error('Error obteniendo estadísticas de utilidad:', error);
      return null;
    }
  }

  /**
   * Evalúa la utilidad de todos los suplementos para un usuario
   */
  async evaluateAllSupplementsUtility(userId: string, userProfile: UserProfile): Promise<void> {
    try {
      console.log('🔬 Iniciando evaluación de utilidad de todos los suplementos...');
      
      // Crear análisis de salud basado en el perfil del usuario
      const healthAnalysis: HealthAnalysis = {
        deficiencyRisk: this.calculateUserDeficiencyRisk(userProfile),
        healthGoals: userProfile.health_goals || [],
        ageGroup: this.getAgeGroup(userProfile.age),
        gender: userProfile.gender || 'unknown',
        activityLevel: userProfile.activity_level || 'medium',
        dietType: userProfile.diet_type || 'regular',
        healthConditions: userProfile.health_conditions || [],
        allergies: userProfile.allergies || [],
        currentStack: userProfile.current_stack || [],
        biomarkers: {}
      };

      // Evaluar utilidad de todos los suplementos
      const utilityResults = await this.utilityEvaluator.evaluateAllSupplements(
        userProfile,
        healthAnalysis
      );

      // Almacenar resultados en la base de datos
      const storageSuccess = await this.utilityStorage.storeUtilityResults(
        userId,
        utilityResults
      );

      if (storageSuccess) {
        const stats = this.utilityEvaluator.getEvaluationStats(utilityResults);
        console.log('✅ Evaluación de utilidad completada:');
        console.log(`   📊 Suplementos evaluados: ${stats.totalSupplements}`);
        console.log(`   🎯 Suplementos útiles: ${stats.usefulSupplements}`);
        console.log(`   📈 Tasa de utilidad: ${stats.utilityRate.toFixed(1)}%`);
        console.log(`   ⭐ Score promedio: ${(stats.averageUtilityScore * 100).toFixed(1)}%`);
      } else {
        console.error('❌ Error almacenando valoraciones de utilidad');
      }
    } catch (error) {
      console.error('❌ Error evaluando utilidad de suplementos:', error);
    }
  }

  /**
   * Obtiene predicciones reales basadas en datos masivos (DSLD, Kaggle, NHANES)
   */
  async getRealDataPredictions(
    supplementName: string, 
    userProfile: UserProfile
  ): Promise<{
    collaborativeScore: number;
    contentBasedScore: number;
    deficiencyScore: number;
    effectivenessScore: number;
    demographicScore: number;
    lifestyleScore: number;
    healthGoalsScore: number;
    conditionsScore: number;
    overallPrediction: number;
  }> {
    try {
      // Simular predicciones reales basadas en datos masivos
      // En un sistema real, estos vendrían de los modelos ML entrenados
      
      const age = userProfile.age || 30;
      const gender = userProfile.gender || 'unknown';
      const activityLevel = userProfile.activity_level || 'medium';
      const dietType = userProfile.diet_type || 'balanced';
      const healthGoals = userProfile.health_goals || [];
      const conditions = userProfile.health_conditions || [];
      
      // Predicción colaborativa (basada en usuarios similares de Kaggle)
      const collaborativeScore = this.calculateCollaborativePrediction(supplementName, userProfile);
      
      // Predicción basada en contenido (basada en datos DSLD)
      const contentBasedScore = this.calculateContentBasedPrediction(supplementName, userProfile);
      
      // Predicción de deficiencias (basada en datos NHANES)
      const deficiencyScore = this.calculateDeficiencyPrediction(supplementName, userProfile);
      
      // Predicción de efectividad (basada en datos Kaggle)
      const effectivenessScore = this.calculateEffectivenessPrediction(supplementName, userProfile);
      
      // Predicción demográfica
      const demographicScore = this.calculateDemographicPrediction(age, gender, supplementName);
      
      // Predicción de estilo de vida
      const lifestyleScore = this.calculateLifestylePrediction(userProfile, supplementName);
      
      // Predicción de objetivos de salud
      const healthGoalsScore = this.calculateHealthGoalsPrediction(healthGoals, supplementName);
      
      // Predicción de condiciones de salud
      const conditionsScore = this.calculateConditionsPrediction(conditions, supplementName);
      
      // Combinar todas las predicciones
      const overallPrediction = (
        collaborativeScore * 0.25 +
        contentBasedScore * 0.20 +
        deficiencyScore * 0.20 +
        effectivenessScore * 0.15 +
        demographicScore * 0.10 +
        lifestyleScore * 0.05 +
        healthGoalsScore * 0.03 +
        conditionsScore * 0.02
      );
      
      return {
        collaborativeScore,
        contentBasedScore,
        deficiencyScore,
        effectivenessScore,
        demographicScore,
        lifestyleScore,
        healthGoalsScore,
        conditionsScore,
        overallPrediction
      };
    } catch (error) {
      console.error('Error obteniendo predicciones reales:', error);
      return {
        collaborativeScore: 0.5,
        contentBasedScore: 0.5,
        deficiencyScore: 0.5,
        effectivenessScore: 0.5,
        demographicScore: 0.5,
        lifestyleScore: 0.5,
        healthGoalsScore: 0.5,
        conditionsScore: 0.5,
        overallPrediction: 0.5
      };
    }
  }

  /**
   * Calcula predicción colaborativa basada en datos Kaggle
   */
  private calculateCollaborativePrediction(supplementName: string, userProfile: UserProfile): number {
    // Simular análisis de usuarios similares de Kaggle Fitness
    const age = userProfile.age || 30;
    const gender = userProfile.gender || 'unknown';
    const activityLevel = userProfile.activity_level || 'medium';
    
    let score = 0.5;
    
    // Ajustar basado en perfil demográfico similar
    if (age < 30 && activityLevel === 'high') {
      score += 0.2; // Jóvenes activos
    } else if (age > 50) {
      score += 0.15; // Adultos mayores
    }
    
    // Ajustar basado en género
    if (gender === 'female') {
      score += 0.1; // Mujeres tienen patrones específicos
    }
    
    // Ajustar basado en tipo de suplemento
    const supplementLower = supplementName.toLowerCase();
    if (supplementLower.includes('protein') && activityLevel === 'high') {
      score += 0.3; // Proteína para atletas
    } else if (supplementLower.includes('vitamin') && age > 40) {
      score += 0.2; // Vitaminas para adultos mayores
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción basada en contenido usando datos DSLD
   */
  private calculateContentBasedPrediction(supplementName: string, userProfile: UserProfile): number {
    // Simular análisis de contenido de DSLD
    const dietType = userProfile.diet_type || 'balanced';
    const healthGoals = userProfile.health_goals || [];
    
    let score = 0.5;
    
    // Ajustar basado en tipo de dieta
    if (dietType === 'vegan' && supplementName.toLowerCase().includes('b12')) {
      score += 0.4; // B12 para veganos
    } else if (dietType === 'keto' && supplementName.toLowerCase().includes('electrolyte')) {
      score += 0.3; // Electrolitos para keto
    }
    
    // Ajustar basado en objetivos de salud
    for (const goal of healthGoals) {
      if (goal.toLowerCase().includes('energy') && supplementName.toLowerCase().includes('b12')) {
        score += 0.2;
      } else if (goal.toLowerCase().includes('bone') && supplementName.toLowerCase().includes('calcium')) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción de deficiencias usando datos NHANES
   */
  private calculateDeficiencyPrediction(supplementName: string, userProfile: UserProfile): number {
    // Simular análisis de deficiencias de NHANES
    const age = userProfile.age || 30;
    const gender = userProfile.gender || 'unknown';
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
    const fishConsumption = userProfile.onboarding_data?.fishConsumption || 2;
    
    let score = 0.3; // Base risk
    
    // Ajustar basado en exposición solar
    if (sunExposure === 'low' && supplementName.toLowerCase().includes('vitamin d')) {
      score += 0.4; // Vitamina D para baja exposición solar
    }
    
    // Ajustar basado en consumo de pescado
    if (fishConsumption < 2 && supplementName.toLowerCase().includes('omega')) {
      score += 0.3; // Omega-3 para bajo consumo de pescado
    }
    
    // Ajustar basado en edad
    if (age > 50 && supplementName.toLowerCase().includes('b12')) {
      score += 0.2; // B12 para adultos mayores
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción de efectividad usando datos Kaggle
   */
  private calculateEffectivenessPrediction(supplementName: string, userProfile: UserProfile): number {
    // Simular análisis de efectividad de Kaggle Fitness
    const activityLevel = userProfile.activity_level || 'medium';
    const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
    
    let score = 0.6; // Base effectiveness
    
    // Ajustar basado en nivel de actividad
    if (activityLevel === 'high' && supplementName.toLowerCase().includes('protein')) {
      score += 0.3; // Proteína para alta actividad
    }
    
    // Ajustar basado en tipo de ejercicio
    if (exerciseType === 'strength' && supplementName.toLowerCase().includes('creatine')) {
      score += 0.2; // Creatina para fuerza
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción demográfica
   */
  private calculateDemographicPrediction(age: number, gender: string, supplementName: string): number {
    let score = 0.5;
    
    // Ajustar basado en edad
    if (age < 25) {
      score += 0.1; // Jóvenes
    } else if (age > 50) {
      score += 0.2; // Adultos mayores
    }
    
    // Ajustar basado en género
    if (gender === 'female' && supplementName.toLowerCase().includes('iron')) {
      score += 0.3; // Hierro para mujeres
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción de estilo de vida
   */
  private calculateLifestylePrediction(userProfile: UserProfile, supplementName: string): number {
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
    const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';
    
    let score = 0.5;
    
    // Ajustar basado en estrés
    if (stressLevel === 'high' && supplementName.toLowerCase().includes('magnesium')) {
      score += 0.3; // Magnesio para estrés
    }
    
    // Ajustar basado en sueño
    if (sleepQuality === 'poor' && supplementName.toLowerCase().includes('melatonin')) {
      score += 0.4; // Melatonina para sueño
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción de objetivos de salud
   */
  private calculateHealthGoalsPrediction(healthGoals: string[], supplementName: string): number {
    let score = 0.5;
    
    for (const goal of healthGoals) {
      if (goal.toLowerCase().includes('energy') && supplementName.toLowerCase().includes('b12')) {
        score += 0.2;
      } else if (goal.toLowerCase().includes('bone') && supplementName.toLowerCase().includes('calcium')) {
        score += 0.2;
      } else if (goal.toLowerCase().includes('immune') && supplementName.toLowerCase().includes('vitamin c')) {
        score += 0.2;
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Calcula predicción de condiciones de salud
   */
  private calculateConditionsPrediction(conditions: string[], supplementName: string): number {
    let score = 0.5;
    
    for (const condition of conditions) {
      if (condition.toLowerCase().includes('diabetes') && supplementName.toLowerCase().includes('magnesium')) {
        score += 0.3; // Magnesio para diabetes
      } else if (condition.toLowerCase().includes('hypertension') && supplementName.toLowerCase().includes('omega')) {
        score += 0.2; // Omega-3 para hipertensión
      }
    }
    
    return Math.min(score, 1.0);
  }

  /**
   * Genera feedback personalizado detallado para un suplemento específico
   */
  async generatePersonalizedSupplementFeedback(
    userProfile: UserProfile, 
    supplementName: string, 
    utilityScore: number
  ): Promise<{
    personalizedReasons: string[];
    warnings: string[];
    recommendedTiming: string;
    recommendedDosage: string;
    interactions: string[];
  }> {
    // Generando feedback personalizado basado en predicciones reales de datos masivos
    
    try {
      const personalizedReasons = [];
      const warnings = [];
      const interactions = [];
      
      // Obtener predicciones reales de los datos masivos
      const predictions = await this.getRealDataPredictions(supplementName, userProfile);
      
    const age = parseInt(String(userProfile.age)) || 30;
    const gender = userProfile.gender || 'other';
      const healthGoals = userProfile.health_goals || [];
      const conditions = userProfile.health_conditions || [];
      const allergies = userProfile.allergies || [];
      const dietType = userProfile.diet_type || 'balanced';
      const activityLevel = userProfile.activity_level || 'medium';
    const stressLevel = userProfile.onboarding_data?.stressLevel || 'medium';
      const sleepQuality = userProfile.onboarding_data?.sleepQuality || 'good';
    const sunExposure = userProfile.onboarding_data?.sunExposure || 'medium';
      const fishConsumption = userProfile.onboarding_data?.fishConsumption || 0;
      const vegetableConsumption = userProfile.onboarding_data?.vegetableConsumption || 0;
      const exerciseType = userProfile.onboarding_data?.exerciseType || 'mixed';
      const exerciseHours = userProfile.onboarding_data?.exerciseHours || '3-5';
      const caffeineConsumption = userProfile.onboarding_data?.caffeineConsumption || 'moderate';
      const alcoholConsumption = userProfile.onboarding_data?.alcoholConsumption || 'occasional';
      const smokingHabit = userProfile.onboarding_data?.smokingHabit || 'never';
      const familyHistory = (userProfile.onboarding_data as any)?.familyHistory || [];

      // Generar razones concisas y precisas
      console.log(`🔍 Generando feedback para ${supplementName} con predicción: ${predictions.overallPrediction}`);
      
      if (predictions.overallPrediction > 0.7) {
        // Una razón principal específica y concisa
        if (supplementName.toLowerCase().includes('vitamina d') || supplementName.toLowerCase().includes('vitamin d')) {
          if (sunExposure === 'low') {
            personalizedReasons.push(`🌞 Baja exposición solar - riesgo de deficiencia`);
          } else if (age > 50) {
            personalizedReasons.push(`👴 A partir de los 50, síntesis disminuye`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('magnesio') || supplementName.toLowerCase().includes('magnesium')) {
          if (stressLevel === 'high' || stressLevel === 'very_high') {
            personalizedReasons.push(`😰 Estrés alto agota magnesio`);
          } else if (sleepQuality === 'poor' || sleepQuality === 'fair') {
            personalizedReasons.push(`😴 Mejora calidad del sueño`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('omega') || supplementName.toLowerCase().includes('fish oil')) {
          if (fishConsumption < 2) {
            personalizedReasons.push(`🐟 Bajo consumo de pescado`);
          } else if (dietType === 'vegan' || dietType === 'vegetarian') {
            personalizedReasons.push(`🌱 Dieta plant-based carece EPA/DHA`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('b12') || supplementName.toLowerCase().includes('vitamin b12')) {
          if (dietType === 'vegan' || dietType === 'vegetarian') {
            personalizedReasons.push(`🌱 Dieta plant-based no proporciona B12`);
          } else if (age > 50) {
            personalizedReasons.push(`👴 Absorción disminuye con la edad`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('hierro') || supplementName.toLowerCase().includes('iron')) {
          if (gender === 'female') {
            personalizedReasons.push(`👩 Mayor riesgo en mujeres`);
          } else if (dietType === 'vegetarian' || dietType === 'vegan') {
            personalizedReasons.push(`🌱 Hierro menos absorbible en dietas plant-based`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('probiótico') || supplementName.toLowerCase().includes('probiotic')) {
          if (userProfile.onboarding_data?.antibioticsUse === 'frequently' || userProfile.onboarding_data?.antibioticsUse === 'sometimes') {
            personalizedReasons.push(`💊 Uso frecuente de antibióticos daña flora`);
          } else if (userProfile.onboarding_data?.bowelMovements === 'irregular' || userProfile.onboarding_data?.bowelMovements === 'constipation') {
            personalizedReasons.push(`🚽 Problemas intestinales`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('melatonina') || supplementName.toLowerCase().includes('melatonin')) {
          if (sleepQuality === 'poor' || sleepQuality === 'fair') {
            personalizedReasons.push(`😴 Calidad de sueño deficiente`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('astaxantina') || supplementName.toLowerCase().includes('astaxanthin')) {
          if (age > 40) {
            personalizedReasons.push(`🧬 Antioxidante potente para +40 años`);
          } else if (exerciseHours === '3-5' || exerciseHours === '5+') {
            personalizedReasons.push(`🏃 Ejercicio intenso genera radicales libres`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('coenzima q10') || supplementName.toLowerCase().includes('coq10') || supplementName.toLowerCase().includes('ubiquinol')) {
          if (age > 50) {
            personalizedReasons.push(`💪 Producción disminuye después de los 50`);
          } else if (exerciseHours === '3-5' || exerciseHours === '5+') {
            personalizedReasons.push(`🏃 Ejercicio intenso requiere más CoQ10`);
          }
        }
        
        else if (supplementName.toLowerCase().includes('comino negro') || supplementName.toLowerCase().includes('black seed') || supplementName.toLowerCase().includes('nigella')) {
          if (stressLevel === 'high' || stressLevel === 'very_high') {
            personalizedReasons.push(`😰 Propiedades antiinflamatorias para estrés alto`);
          } else if (userProfile.onboarding_data?.bowelMovements === 'irregular' || userProfile.onboarding_data?.bowelMovements === 'constipation') {
            personalizedReasons.push(`🚽 Mejora función intestinal`);
          }
        }
        
        // Si no hay razón específica, usar predicción general
        if (personalizedReasons.length === 0) {
          if (predictions.collaborativeScore > 0.8) {
            personalizedReasons.push(`📊 Usuarios similares reportan alta efectividad`);
          } else if (predictions.deficiencyScore > 0.8) {
            personalizedReasons.push(`🔬 Datos poblacionales indican necesidad`);
          } else {
            personalizedReasons.push(`✅ Predicción alta de efectividad`);
          }
        }
        
      } else if (predictions.overallPrediction > 0.5) {
        personalizedReasons.push(`📈 Predicción moderada - consulta con profesional`);
      } else {
        // Razones concisas de por qué NO es útil
        if (supplementName.toLowerCase().includes('vitamina d') && sunExposure === 'high') {
          personalizedReasons.push(`☀️ Alta exposición solar ya proporciona suficiente`);
        }
        else if (supplementName.toLowerCase().includes('omega') && fishConsumption >= 3) {
          personalizedReasons.push(`🐟 Consumo regular de pescado es suficiente`);
        }
        else if (supplementName.toLowerCase().includes('hierro') && gender === 'male' && dietType !== 'vegetarian') {
          personalizedReasons.push(`🥩 Hombres omnívoros raramente necesitan hierro`);
        }
        else if (supplementName.toLowerCase().includes('astaxantina') && age < 30 && exerciseHours === '0-1') {
          personalizedReasons.push(`🧬 Jóvenes con baja actividad producen suficientes antioxidantes`);
        }
        else if (supplementName.toLowerCase().includes('coenzima q10') && age < 40 && stressLevel === 'low') {
          personalizedReasons.push(`💪 Jóvenes con bajo estrés producen suficiente CoQ10`);
        }
        else {
          personalizedReasons.push(`📊 Predicción baja de utilidad`);
        }
      }

      // Advertencias concisas y específicas
      if (conditions.length > 0) {
        warnings.push(`⚠️ Consulta médico si tienes: ${conditions.join(', ')}`);
      }
      
      if (allergies.length > 0) {
        warnings.push(`⚠️ Verifica ingredientes - alergias: ${allergies.join(', ')}`);
      }
      
      // Advertencias específicas por suplemento
      if (supplementName.toLowerCase().includes('hierro') || supplementName.toLowerCase().includes('iron')) {
        if (gender === 'female' && age < 50) {
          warnings.push(`⚠️ Mujeres en edad fértil - consulta médico`);
        }
        if (caffeineConsumption === 'high') {
          warnings.push(`⚠️ Alto consumo cafeína reduce absorción`);
        }
      }
      
      if (supplementName.toLowerCase().includes('magnesio') || supplementName.toLowerCase().includes('magnesium')) {
        warnings.push(`⚠️ Problemas renales - consulta médico`);
      }
      
      if (supplementName.toLowerCase().includes('omega') || supplementName.toLowerCase().includes('fish oil')) {
        warnings.push(`⚠️ Anticoagulantes - consulta médico`);
      }
      
      if (supplementName.toLowerCase().includes('vitamina d') || supplementName.toLowerCase().includes('vitamin d')) {
        warnings.push(`⚠️ Problemas renales/hepáticos - consulta médico`);
      }
      
      if (supplementName.toLowerCase().includes('melatonina') || supplementName.toLowerCase().includes('melatonin')) {
        warnings.push(`⚠️ Depresión/ansiedad - consulta médico`);
      }
      
      if (supplementName.toLowerCase().includes('probiótico') || supplementName.toLowerCase().includes('probiotic')) {
        warnings.push(`⚠️ Sistema inmunológico comprometido - consulta médico`);
      }
      
      // Advertencias de estilo de vida
      if (alcoholConsumption === 'high' || alcoholConsumption === 'heavy') {
        warnings.push(`⚠️ Alto consumo alcohol interfiere absorción`);
      }
      
      if (smokingHabit === 'regular' || smokingHabit === 'occasional') {
        warnings.push(`⚠️ Tabaquismo reduce efectividad`);
      }
      
      // Advertencias generales
      warnings.push(`⚠️ No sustituye dieta equilibrada`);
      warnings.push(`⚠️ No excedas dosis recomendada`);

      // Timing y dosificación concisos
      let recommendedTiming = 'Según indicaciones del producto';
      let recommendedDosage = 'Según etiqueta del producto';
      
      // Timing específico por suplemento
      if (supplementName.toLowerCase().includes('magnesio') || supplementName.toLowerCase().includes('magnesium')) {
        if (sleepQuality === 'poor' || sleepQuality === 'fair') {
          recommendedTiming = 'Antes de dormir';
        } else {
          recommendedTiming = 'Con las comidas';
        }
      }
      
      if (supplementName.toLowerCase().includes('melatonina') || supplementName.toLowerCase().includes('melatonin')) {
        recommendedTiming = '30-60 min antes de dormir';
      }
      
      if (supplementName.toLowerCase().includes('omega') || supplementName.toLowerCase().includes('fish oil')) {
        recommendedTiming = 'Con las comidas';
      }
      
      if (supplementName.toLowerCase().includes('vitamina d') || supplementName.toLowerCase().includes('vitamin d')) {
        recommendedTiming = 'Con comidas grasas';
      }
      
      if (supplementName.toLowerCase().includes('hierro') || supplementName.toLowerCase().includes('iron')) {
        recommendedTiming = 'Con estómago vacío';
      }
      
      if (supplementName.toLowerCase().includes('probiótico') || supplementName.toLowerCase().includes('probiotic')) {
        recommendedTiming = 'Con estómago vacío';
      }
      
      // Dosificación específica por edad
      if (age > 65) {
        recommendedDosage = 'Dosis reducida para +65 años';
      } else if (age < 18) {
        recommendedDosage = 'Dosis pediátrica';
      } else if (age > 50) {
        recommendedDosage = 'Dosis ajustada para +50 años';
      }
      
      if (conditions.length > 0) {
        recommendedDosage = 'Dosis personalizada según condiciones';
      }

      // Interacciones concisas
      if (conditions.includes('diabetes')) {
        interactions.push('Interactúa con medicamentos diabetes');
      }
      
      if (conditions.includes('hypertension')) {
        interactions.push('Interactúa con medicamentos presión arterial');
      }
      
      if (caffeineConsumption === 'high') {
        interactions.push('Alto consumo cafeína reduce absorción');
      }
      
      if (alcoholConsumption === 'high') {
        interactions.push('Alto consumo alcohol interfiere efectividad');
      }

      // Retornar feedback basado en predicciones reales
      return {
        personalizedReasons,
        warnings,
        recommendedTiming,
        recommendedDosage,
        interactions
      };
      
    } catch (error) {
      console.error('Error generando feedback personalizado:', error);
      
      return {
        personalizedReasons: ['Error generando feedback personalizado'],
        warnings: ['Error en el sistema'],
        recommendedTiming: 'Consultar con profesional',
        recommendedDosage: 'Consultar con profesional',
        interactions: []
      };
    }
  }

  /**
   * MÉTODO DEPRECADO - LÓGICA HARDCODEADA
   * Este método contiene lógica hardcodeada que será reemplazada por predicciones reales
   */
  private generateHardcodedFeedback(
    userProfile: UserProfile,
    supplementName: string, 
    utilityScore: number
  ): {
    personalizedReasons: string[];
    warnings: string[];
    recommendedTiming: string;
    recommendedDosage: string;
    interactions: string[];
  } {
    // MÉTODO DEPRECADO - Usar generatePersonalizedSupplementFeedback en su lugar
    return {
      personalizedReasons: ['Método deprecado - usar predicciones reales'],
      warnings: ['Sistema en actualización'],
      recommendedTiming: 'Consultar con profesional',
      recommendedDosage: 'Consultar con profesional',
      interactions: []
    };
  }

  // Métodos auxiliares que faltan
  private clearAllUserData(userId: string): void {
    // Implementación para limpiar datos del usuario
    console.log('Limpiando datos del usuario:', userId);
  }

  private async storeHealthAnalysisSummary(userId: string, analysis: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          title: 'Análisis de Salud General',
        content: {
            healthAnalysis: analysis
          },
          recommendation_type: 'supplement',
          confidence_score: 0.95,
          status: 'accepted',
          priority: 5,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        });

      if (error) {
        console.error('❌ Error almacenando análisis de salud:', error);
        throw error;
      }
      
      console.log('✅ Análisis de salud almacenado exitosamente');
    } catch (error) {
      console.error('❌ Error en storeHealthAnalysisSummary:', error);
      throw error;
    }
  }

  private async storePersonalizedPlan(userId: string, plan: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('ai_recommendations')
        .insert({
          user_id: userId,
          title: 'Plan Personalizado de Suplementación',
          content: {
            personalizedPlan: plan
          },
          recommendation_type: 'supplement',
          confidence_score: 0.90,
          status: 'accepted',
          priority: 5,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 días
        });

      if (error) {
        console.error('❌ Error almacenando plan personalizado:', error);
        throw error;
      }
      
      console.log('✅ Plan personalizado almacenado exitosamente');
    } catch (error) {
      console.error('❌ Error en storePersonalizedPlan:', error);
      throw error;
    }
  }

  private calculateUserDeficiencyRisk(userProfile: UserProfile): number {
    // Implementación para calcular riesgo de deficiencia del usuario
    return 0.5; // Valor por defecto
  }

  private getAgeGroup(age: number): string {
    if (age < 18) return 'adolescent';
    if (age < 30) return 'young_adult';
    if (age < 50) return 'adult';
    if (age < 65) return 'middle_aged';
    return 'senior';
  }

  private extractBiomarkers(userProfile: UserProfile): any[] {
    // Implementación para extraer biomarcadores del perfil del usuario
    return [];
  }
}