import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { gzip, gunzip } from 'zlib';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

/**
 * Sistema de persistencia binaria para modelos ML
 * Usa formatos binarios optimizados para modelos de machine learning
 */
export class ModelBinaryPersistence {
  private modelsDir: string;
  private metadataFile: string;

  constructor(modelsDir: string = 'models_binary') {
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
      console.log(`📁 Directorio de modelos binarios creado: ${this.modelsDir}`);
    }
  }

  /**
   * Guarda un modelo en formato binario comprimido
   */
  async saveModel(modelName: string, modelData: any, metadata: any): Promise<boolean> {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.pkl.gz`);
      
      // Serializar modelo a JSON
      const serializedModel = JSON.stringify({
        name: modelName,
        data: modelData,
        metadata: {
          ...metadata,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
          format: 'binary_compressed'
        }
      });

      // Comprimir con gzip
      const compressed = await gzipAsync(Buffer.from(serializedModel, 'utf8'));
      
      // Guardar archivo binario
      writeFileSync(modelFile, compressed);
      
      console.log(`💾 Modelo ${modelName} guardado en formato binario: ${modelFile}`);
      
      // Actualizar metadata
      this.updateMetadata(modelName, {
        ...metadata,
        savedAt: new Date().toISOString(),
        format: 'binary_compressed',
        size: compressed.length
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Error guardando modelo binario ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Carga un modelo desde formato binario comprimido
   */
  async loadModel(modelName: string): Promise<any | null> {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.pkl.gz`);
      
      if (!existsSync(modelFile)) {
        console.warn(`⚠️ Modelo binario ${modelName} no encontrado en: ${modelFile}`);
        return null;
      }

      // Leer archivo binario
      const compressed = readFileSync(modelFile);
      
      // Descomprimir
      const decompressed = await gunzipAsync(compressed);
      const modelContent = decompressed.toString('utf-8');
      
      // Parsear JSON
      const modelInfo = JSON.parse(modelContent);
      
      console.log(`📂 Modelo binario ${modelName} cargado desde: ${modelFile}`);
      console.log(`📅 Guardado el: ${modelInfo.metadata.savedAt}`);
      console.log(`📊 Tamaño: ${(compressed.length / 1024).toFixed(2)} KB`);
      
      return modelInfo;
    } catch (error) {
      console.error(`❌ Error cargando modelo binario ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Carga todos los modelos binarios disponibles
   */
  async loadAllModels(): Promise<Map<string, any>> {
    const models = new Map<string, any>();
    
    try {
      const metadata = this.loadMetadata();
      
      for (const [modelName, modelMetadata] of Object.entries(metadata.models)) {
        const model = await this.loadModel(modelName);
        if (model) {
          models.set(modelName, model);
        }
      }
      
      console.log(`📦 Cargados ${models.size} modelos binarios desde persistencia`);
      return models;
    } catch (error) {
      console.error('❌ Error cargando modelos binarios:', error);
      return models;
    }
  }

  /**
   * Guarda un modelo en formato pickle simulado (JSON optimizado)
   */
  async saveModelAsPickle(modelName: string, modelData: any, metadata: any): Promise<boolean> {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.pkl`);
      
      // Crear estructura de modelo pickle
      const pickleData = {
        model_type: metadata.algorithm || 'unknown',
        model_data: modelData,
        model_metadata: {
          ...metadata,
          savedAt: new Date().toISOString(),
          version: '1.0.0',
          format: 'pickle_simulated'
        },
        model_weights: this.extractModelWeights(modelData),
        model_config: this.extractModelConfig(modelData)
      };

      // Serializar como JSON (simulando pickle)
      const serialized = JSON.stringify(pickleData, null, 2);
      writeFileSync(modelFile, serialized);
      
      console.log(`💾 Modelo ${modelName} guardado como pickle simulado: ${modelFile}`);
      
      // Actualizar metadata
      this.updateMetadata(modelName, {
        ...metadata,
        savedAt: new Date().toISOString(),
        format: 'pickle_simulated',
        size: Buffer.byteLength(serialized, 'utf8')
      });
      
      return true;
    } catch (error) {
      console.error(`❌ Error guardando modelo pickle ${modelName}:`, error);
      return false;
    }
  }

  /**
   * Carga un modelo desde formato pickle simulado
   */
  async loadModelAsPickle(modelName: string): Promise<any | null> {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.pkl`);
      
      if (!existsSync(modelFile)) {
        console.warn(`⚠️ Modelo pickle ${modelName} no encontrado en: ${modelFile}`);
        return null;
      }

      const modelContent = readFileSync(modelFile, 'utf-8');
      const pickleData = JSON.parse(modelContent);
      
      console.log(`📂 Modelo pickle ${modelName} cargado desde: ${modelFile}`);
      console.log(`📅 Guardado el: ${pickleData.model_metadata.savedAt}`);
      console.log(`🔬 Tipo: ${pickleData.model_type}`);
      
      return {
        name: modelName,
        data: pickleData.model_data,
        metadata: pickleData.model_metadata,
        weights: pickleData.model_weights,
        config: pickleData.model_config
      };
    } catch (error) {
      console.error(`❌ Error cargando modelo pickle ${modelName}:`, error);
      return null;
    }
  }

  /**
   * Extrae pesos del modelo (simulado)
   */
  private extractModelWeights(modelData: any): any {
    // Simular extracción de pesos para diferentes tipos de modelos
    if (modelData.userItemMatrix) {
      return {
        user_factors: modelData.userItemMatrix.user_factors || [],
        item_factors: modelData.userItemMatrix.item_factors || [],
        bias: modelData.userItemMatrix.bias || 0
      };
    }
    
    if (modelData.productFeatures) {
      return {
        feature_weights: modelData.productFeatures.feature_weights || [],
        category_weights: modelData.productFeatures.category_weights || {},
        brand_weights: modelData.productFeatures.brand_weights || {}
      };
    }
    
    if (modelData.biomarkerPatterns) {
      return {
        biomarker_weights: modelData.biomarkerPatterns.biomarker_weights || [],
        risk_factors: modelData.biomarkerPatterns.risk_factors || {},
        health_indicators: modelData.biomarkerPatterns.health_indicators || {}
      };
    }
    
    return {};
  }

  /**
   * Extrae configuración del modelo
   */
  private extractModelConfig(modelData: any): any {
    return {
      algorithm: modelData.algorithm || 'unknown',
      parameters: modelData.parameters || {},
      features: modelData.features || [],
      preprocessing: modelData.preprocessing || {},
      postprocessing: modelData.postprocessing || {}
    };
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
    const modelFile = join(this.modelsDir, `${modelName}.pkl.gz`);
    const pickleFile = join(this.modelsDir, `${modelName}.pkl`);
    return existsSync(modelFile) || existsSync(pickleFile);
  }

  /**
   * Elimina un modelo guardado
   */
  deleteModel(modelName: string): boolean {
    try {
      const modelFile = join(this.modelsDir, `${modelName}.pkl.gz`);
      const pickleFile = join(this.modelsDir, `${modelName}.pkl`);
      
      let deleted = false;
      
      if (existsSync(modelFile)) {
        const fs = require('fs');
        fs.unlinkSync(modelFile);
        console.log(`🗑️ Modelo binario ${modelName} eliminado`);
        deleted = true;
      }
      
      if (existsSync(pickleFile)) {
        const fs = require('fs');
        fs.unlinkSync(pickleFile);
        console.log(`🗑️ Modelo pickle ${modelName} eliminado`);
        deleted = true;
      }
      
      return deleted;
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
          if (file.endsWith('.pkl') || file.endsWith('.pkl.gz')) {
            fs.unlinkSync(join(this.modelsDir, file));
          }
        }
        
        console.log('🧹 Todos los modelos binarios eliminados');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error limpiando modelos:', error);
      return false;
    }
  }
}
