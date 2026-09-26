// 🧠 Sistema de Recomendación Híbrido con IA/ML
export * from './types';

// 🚀 Motor Principal (Core)
export { RecommendationEngine } from './core/RecommendationEngine';

// 🤖 Sistema de Machine Learning
export { DataIntegrationEngine } from './core/DataIntegrationEngine';

// 🔧 Motores Tradicionales (Engines)
export { DeficiencyAnalyzer } from './engines/DeficiencyAnalyzer';
export { UserSimilarityEngine } from './engines/UserSimilarityEngine';
export { ContentBasedFilter } from './engines/ContentBasedFilter';
export { ProductAnalysisEngine } from './engines/ProductAnalysisEngine';

// 📊 Integración de Datos Reales
export { NHANESIntegration } from './engines/NHANESIntegration';
export { DSLDIntegration } from './engines/DSLDIntegration';
export { KaggleFitnessIntegration } from './engines/KaggleFitnessIntegration';
