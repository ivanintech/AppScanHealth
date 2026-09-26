import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

/**
 * Sistema de persistencia para modelos ML entrenados
 * Permite guardar y cargar modelos para reutilización
 */
export class ModelPersistence {
  private modelsDir: string;
  private metadataFile: string;

  constructor(modelsDir: string = 'models') {
    this.modelsDir = modelsDir;
    this.metadataFile = join(modelsDir, 'models_metadata.json');
    this.ensureModelsDirectory();
  }

  /**
   * Asegura que el directorio de modelos existe
   */
  private ensureModelsDirectory(): void {
    if (!existsSync(this.modelsDir)) {
      mkdirSync(this.modelsDir, { recursive: true });
      console.log(`📁 Directorio de modelos creado: ${this.modelsDir}`);
    }
  }

  /**
   * Guarda un modelo entrenado en archivo JSON
   */
  saveModel(modelName: string, modelData: any, metadata: any): boolean {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.json`);
      const modelInfo = {
        name: modelName,
        data: modelData,
        metadata: {
          ...metadata,
          savedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      writeFileSync(modelFile, JSON.stringify(modelInfo, null, 2));
      console.log(`💾 Modelo ${modelName} guardado en: ${modelFile}`);
      
      // Actualizar metadata general
      this.updateMetadata(modelName, modelInfo.metadata);
      
      return true;
    } catch (error) {
      console.error(`❌ Error guardando modelo ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Carga un modelo desde archivo JSON
   */
  loadModel(modelName: string): any | null {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.json`);
      
      if (!existsSync(modelFile)) {
        console.warn(`⚠️ Modelo ${modelName} no encontrado en: ${modelFile}`);
        return null;
      }

      const modelContent = readFileSync(modelFile, 'utf-8');
      const modelInfo = JSON.parse(modelContent);
      
      console.log(`📂 Modelo ${modelName} cargado desde: ${modelFile}`);
      console.log(`📅 Guardado el: ${modelInfo.metadata.savedAt}`);
      
      return modelInfo;
    } catch (error) {
      console.error(`❌ Error cargando modelo ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Carga todos los modelos disponibles
   */
  loadAllModels(): Map<string, any> {
    const models = new Map<string, any>();
    
    try {
      const metadata = this.loadMetadata();
      
      for (const [modelName, modelMetadata] of Object.entries(metadata.models)) {
        const model = this.loadModel(modelName);
        if (model) {
          models.set(modelName, model);
        }
      }
      
      console.log(`📦 Cargados ${models.size} modelos desde persistencia`);
      return models;
    } catch (error) {
      console.error('❌ Error cargando todos los modelos:', error);
      return models;
    }
  }

  /**
   * Actualiza el archivo de metadata
   */
  private updateMetadata(modelName: string, metadata: any): void {
    try {
      let metadataContent = this.loadMetadata();
      
      if (!metadataContent.models) {
        metadataContent.models = {};
      }
      
      metadataContent.models[modelName] = metadata;
      metadataContent.lastUpdated = new Date().toISOString();
      
      writeFileSync(this.metadataFile, JSON.stringify(metadataContent, null, 2));
    } catch (error) {
      console.error('❌ Error actualizando metadata:', error);
    }
  }

  /**
   * Carga el archivo de metadata
   */
  private loadMetadata(): any {
    try {
      if (!existsSync(this.metadataFile)) {
        return {
          models: {},
          lastUpdated: new Date().toISOString(),
          version: '1.0.0'
        };
      }
      
      const content = readFileSync(this.metadataFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      console.error('❌ Error cargando metadata:', error);
      return { models: {} };
    }
  }

  /**
   * Obtiene información de todos los modelos guardados
   */
  getModelsInfo(): any {
    try {
      const metadata = this.loadMetadata();
      return {
        totalModels: Object.keys(metadata.models || {}).length,
        models: metadata.models || {},
        lastUpdated: metadata.lastUpdated,
        version: metadata.version
      };
    } catch (error) {
      console.error('❌ Error obteniendo información de modelos:', error);
      return { totalModels: 0, models: {} };
    }
  }

  /**
   * Verifica si un modelo existe
   */
  modelExists(modelName: string): boolean {
    const modelFile = join(this.modelsDir, `${modelName}.json`);
    return existsSync(modelFile);
  }

  /**
   * Elimina un modelo guardado
   */
  deleteModel(modelName: string): boolean {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.json`);
      
      if (existsSync(modelFile)) {
        const fs = require('fs');
        fs.unlinkSync(modelFile);
        console.log(`🗑️ Modelo ${modelName} eliminado`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`❌ Error eliminando modelo ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Limpia todos los modelos guardados
   */
  clearAllModels(): boolean {
    try {
      const fs = require('fs');
      const path = require('path');
      
      if (existsSync(this.modelsDir)) {
        const files = fs.readdirSync(this.modelsDir);
        
        for (const file of files) {
          if (file.endsWith('.json')) {
            fs.unlinkSync(join(this.modelsDir, file));
          }
        }
        
        console.log('🧹 Todos los modelos eliminados');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error limpiando modelos:', error);
      return false;
    }
  }
}
