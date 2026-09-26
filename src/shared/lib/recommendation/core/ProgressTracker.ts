/**
 * 🎯 ProgressTracker - Sistema de Seguimiento de Progreso
 * Sistema para mostrar barras de progreso durante el entrenamiento ML
 */

export interface ProgressUpdate {
  stage: string;
  progress: number;
  total: number;
  current: number;
  message: string;
  timestamp: Date;
  estimatedTimeRemaining?: number;
}

export interface TrainingProgress {
  overallProgress: number;
  currentStage: string;
  stages: {
    dataLoading: number;
    featureEngineering: number;
    modelTraining: number;
    validation: number;
  };
  startTime: Date;
  estimatedCompletion?: Date;
  messages: string[];
}

export class ProgressTracker {
  private progress: TrainingProgress;
  private callbacks: ((update: ProgressUpdate) => void)[] = [];
  private startTime: Date;

  constructor() {
    this.startTime = new Date();
    this.progress = {
      overallProgress: 0,
      currentStage: 'Initializing',
      stages: {
        dataLoading: 0,
        featureEngineering: 0,
        modelTraining: 0,
        validation: 0
      },
      startTime: this.startTime,
      messages: []
    };
  }

  /**
   * Registra un callback para actualizaciones de progreso
   */
  onProgress(callback: (update: ProgressUpdate) => void): void {
    this.callbacks.push(callback);
  }

  /**
   * Actualiza el progreso de una etapa específica
   */
  updateStageProgress(
    stage: keyof TrainingProgress['stages'],
    current: number,
    total: number,
    message: string
  ): void {
    const progress = (current / total) * 100;
    this.progress.stages[stage] = progress;
    this.progress.currentStage = stage;
    this.progress.messages.push(`${new Date().toISOString()}: ${message}`);

    // Calcular progreso general
    const totalStages = Object.keys(this.progress.stages).length;
    const stageWeight = 100 / totalStages;
    this.progress.overallProgress = Object.values(this.progress.stages)
      .reduce((sum, stageProgress) => sum + (stageProgress * stageWeight / 100), 0);

    // Estimar tiempo restante
    const elapsed = Date.now() - this.startTime.getTime();
    const estimatedTotal = (elapsed / this.progress.overallProgress) * 100;
    const remaining = estimatedTotal - elapsed;
    this.progress.estimatedCompletion = new Date(Date.now() + remaining);

    // Notificar callbacks
    const update: ProgressUpdate = {
      stage,
      progress,
      total,
      current,
      message,
      timestamp: new Date(),
      estimatedTimeRemaining: remaining
    };

    this.callbacks.forEach(callback => callback(update));
  }

  /**
   * Actualiza el progreso general
   */
  updateOverallProgress(progress: number, message: string): void {
    this.progress.overallProgress = progress;
    this.progress.messages.push(`${new Date().toISOString()}: ${message}`);

    const update: ProgressUpdate = {
      stage: 'Overall',
      progress,
      total: 100,
      current: progress,
      message,
      timestamp: new Date()
    };

    this.callbacks.forEach(callback => callback(update));
  }

  /**
   * Obtiene el progreso actual
   */
  getProgress(): TrainingProgress {
    return { ...this.progress };
  }

  /**
   * Resetea el progreso
   */
  reset(): void {
    this.startTime = new Date();
    this.progress = {
      overallProgress: 0,
      currentStage: 'Initializing',
      stages: {
        dataLoading: 0,
        featureEngineering: 0,
        modelTraining: 0,
        validation: 0
      },
      startTime: this.startTime,
      messages: []
    };
  }

  /**
   * Genera un reporte de progreso
   */
  generateReport(): string {
    const elapsed = Date.now() - this.startTime.getTime();
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const elapsedSeconds = Math.floor((elapsed % 60000) / 1000);

    return `
🎯 REPORTE DE PROGRESO DE ENTRENAMIENTO ML
==========================================

📊 Progreso General: ${this.progress.overallProgress.toFixed(2)}%
🕐 Tiempo Transcurrido: ${elapsedMinutes}m ${elapsedSeconds}s
📈 Etapa Actual: ${this.progress.currentStage}

📋 Progreso por Etapas:
  • Carga de Datos: ${this.progress.stages.dataLoading.toFixed(2)}%
  • Ingeniería de Características: ${this.progress.stages.featureEngineering.toFixed(2)}%
  • Entrenamiento de Modelos: ${this.progress.stages.modelTraining.toFixed(2)}%
  • Validación: ${this.progress.stages.validation.toFixed(2)}%

${this.progress.estimatedCompletion ? 
  `⏰ Tiempo Estimado de Finalización: ${this.progress.estimatedCompletion.toLocaleString()}` : 
  '⏰ Calculando tiempo de finalización...'}

📝 Últimos Mensajes:
${this.progress.messages.slice(-5).map(msg => `  • ${msg}`).join('\n')}
    `.trim();
  }
}
