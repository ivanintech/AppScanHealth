import { ModelPersistence } from './ModelPersistence';

/**
 * Cargador de modelos ML persistidos
 * Permite cargar modelos guardados para uso inmediato
 */
export class ModelLoader {
  private persistence: ModelPersistence;

  constructor() {
    this.persistence = new ModelPersistence('models');
  }

  /**
   * Carga todos los modelos disponibles
   */
  loadAllModels(): Map<string, any> {
    try {
      console.log('📂 Cargando modelos ML persistidos...');
      
      const models = this.persistence.loadAllModels();
      const modelsInfo = this.persistence.getModelsInfo();
      
      console.log(`✅ Cargados ${models.size} modelos desde persistencia`);
      console.log(`📊 Total de modelos disponibles: ${modelsInfo.totalModels}`);
      
      if (modelsInfo.lastUpdated) {
        console.log(`📅 Última actualización: ${new Date(modelsInfo.lastUpdated).toLocaleString()}`);
      }
      
      return models;
    } catch (error) {
      console.error('❌ Error cargando modelos:', error);
      return new Map();
    }
  }

  /**
   * Carga un modelo específico
   */
  loadModel(modelName: string): any | null {
    try {
      const model = this.persistence.loadModel(modelName);
      
      if (model) {
        console.log(`✅ Modelo ${modelName} cargado exitosamente`);
        console.log(`📊 Precisión: ${(model.metadata.accuracy * 100).toFixed(1)}%`);
        console.log(`🔬 Algoritmo: ${model.metadata.algorithm}`);
        console.log(`📅 Entrenado: ${new Date(model.metadata.lastTrained).toLocaleString()}`);
      }
      
      return model;
    } catch (error) {
      console.error(`❌ Error cargando modelo ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Verifica si los modelos están disponibles
   */
  areModelsAvailable(): boolean {
    const modelsInfo = this.persistence.getModelsInfo();
    return modelsInfo.totalModels > 0;
  }

  /**
   * Obtiene información de modelos disponibles
   */
  getAvailableModels(): any {
    return this.persistence.getModelsInfo();
  }

  /**
   * Carga modelos y los prepara para uso en RecommendationEngine
   */
  loadModelsForEngine(): Map<string, any> {
    try {
      const models = this.loadAllModels();
      const preparedModels = new Map<string, any>();
      
      for (const [modelName, modelData] of models) {
        const preparedModel = this.prepareModelForEngine(modelName, modelData);
        preparedModels.set(modelName, preparedModel);
      }
      
      console.log(`🚀 ${preparedModels.size} modelos preparados para uso`);
      return preparedModels;
    } catch (error) {
      console.error('❌ Error preparando modelos para engine:', error);
      return new Map();
    }
  }

  /**
   * Prepara un modelo para uso en el RecommendationEngine
   */
  private prepareModelForEngine(modelName: string, modelData: any): any {
    return {
      name: modelData.metadata.name,
      type: modelData.metadata.type,
      algorithm: modelData.metadata.algorithm,
      isTrained: true,
      accuracy: modelData.metadata.accuracy,
      lastTrained: new Date(modelData.metadata.lastTrained),
      data: modelData.data,
      metadata: modelData.metadata,
      loadedFromPersistence: true,
      loadedAt: new Date().toISOString()
    };
  }

  /**
   * Valida la integridad de los modelos cargados
   */
  validateModels(models: Map<string, any>): boolean {
    try {
      let validCount = 0;
      
      for (const [modelName, model] of models) {
        if (this.validateModel(modelName, model)) {
          validCount++;
        }
      }
      
      const isValid = validCount === models.size;
      console.log(`🔍 Validación: ${validCount}/${models.size} modelos válidos`);
      
      return isValid;
    } catch (error) {
      console.error('❌ Error validando modelos:', error);
      return false;
    }
  }

  /**
   * Valida un modelo específico
   */
  private validateModel(modelName: string, model: any): boolean {
    try {
      // Verificar estructura básica
      if (!model.metadata || !model.data) {
        console.warn(`⚠️ Modelo ${modelName}: estructura inválida`);
        return false;
      }
      
      // Verificar campos requeridos
      const requiredFields = ['name', 'type', 'algorithm', 'accuracy'];
      for (const field of requiredFields) {
        if (!model.metadata[field]) {
          console.warn(`⚠️ Modelo ${modelName}: campo ${field} faltante`);
          return false;
        }
      }
      
      // Verificar que el modelo esté entrenado
      if (!model.metadata.isTrained) {
        console.warn(`⚠️ Modelo ${modelName}: no está entrenado`);
        return false;
      }
      
      console.log(`✅ Modelo ${modelName}: válido`);
      return true;
    } catch (error) {
      console.error(`❌ Error validando modelo ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas de los modelos cargados
   */
  getModelStatistics(models: Map<string, any>): any {
    try {
      const stats = {
        totalModels: models.size,
        trainedModels: 0,
        averageAccuracy: 0,
        modelTypes: {} as { [key: string]: number },
        algorithms: {} as { [key: string]: number },
        accuracyRange: { min: 1, max: 0 },
        lastTraining: null as Date | null
      };
      
      let totalAccuracy = 0;
      
      for (const [modelName, model] of models) {
        if (model.metadata.isTrained) {
          stats.trainedModels++;
          totalAccuracy += model.metadata.accuracy;
          
          // Actualizar rango de precisión
          stats.accuracyRange.min = Math.min(stats.accuracyRange.min, model.metadata.accuracy);
          stats.accuracyRange.max = Math.max(stats.accuracyRange.max, model.metadata.accuracy);
          
          // Contar tipos de modelo
          const type = model.metadata.type;
          stats.modelTypes[type] = (stats.modelTypes[type] || 0) + 1;
          
          // Contar algoritmos
          const algorithm = model.metadata.algorithm;
          stats.algorithms[algorithm] = (stats.algorithms[algorithm] || 0) + 1;
          
          // Último entrenamiento
          const lastTrained = new Date(model.metadata.lastTrained);
          if (!stats.lastTraining || lastTrained > stats.lastTraining) {
            stats.lastTraining = lastTrained;
          }
        }
      }
      
      stats.averageAccuracy = stats.trainedModels > 0 ? totalAccuracy / stats.trainedModels : 0;
      
      return stats;
    } catch (error) {
      console.error('❌ Error calculando estadísticas:', error);
      return null;
    }
  }
}
