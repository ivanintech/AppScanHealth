import React from 'react';
import { ProductAnalysisResult } from '../../lib/recommendation';

interface ProductAnalysisCardProps {
  analysis: ProductAnalysisResult;
  onAddToStack?: () => void;
  onViewDetails?: () => void;
}

export function ProductAnalysisCard({ 
  analysis, 
  onAddToStack, 
  onViewDetails 
}: ProductAnalysisCardProps) {
  const getCompatibilityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 0.8) return 'Muy compatible';
    if (score >= 0.6) return 'Compatible';
    return 'Poco compatible';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Análisis del Producto
          </h3>
          <p className="text-gray-600 text-sm">
            Compatibilidad con tu perfil de salud
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getCompatibilityColor(analysis.compatibility_score)}`}>
          {getCompatibilityText(analysis.compatibility_score)}
        </div>
      </div>

      {/* Compatibility Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Puntuación de Compatibilidad</span>
          <span className="text-sm font-bold text-blue-600">
            {Math.round(analysis.compatibility_score * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${analysis.compatibility_score * 100}%` }}
          />
        </div>
      </div>

      {/* Suitability */}
      <div className="mb-6">
        <div className="flex items-center mb-3">
          <div className={`w-3 h-3 rounded-full mr-3 ${analysis.is_suitable ? 'bg-green-500' : 'bg-red-500'}`} />
          <h4 className="text-lg font-medium text-gray-900">
            {analysis.is_suitable ? '✅ Recomendado para ti' : '❌ No recomendado'}
          </h4>
        </div>
        {analysis.is_suitable ? (
          <p className="text-green-700 text-sm">
            Este producto es compatible con tu perfil de salud y puede beneficiarte.
          </p>
        ) : (
          <p className="text-red-700 text-sm">
            Este producto no es recomendable para tu perfil de salud actual.
          </p>
        )}
      </div>

      {/* Benefits */}
      {analysis.benefits.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Beneficios para ti</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analysis.benefits.map((benefit, index) => (
              <div key={index} className="flex items-center p-3 bg-green-50 rounded-lg">
                <div className="text-green-600 mr-3">✓</div>
                <span className="text-green-800 text-sm">{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Interactions */}
      {analysis.interactions.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Interacciones</h4>
          <div className="space-y-3">
            {analysis.interactions.map((interaction, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">
                    {interaction.supplement_ean}
                  </span>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {interaction.severity}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{interaction.description}</p>
                {interaction.recommendation && (
                  <p className="text-sm text-blue-600 font-medium">
                    💡 {interaction.recommendation}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {analysis.warnings.length > 0 && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-orange-900 mb-3">⚠️ Advertencias</h4>
          <div className="space-y-2">
            {analysis.warnings.map((warning, index) => (
              <div key={index} className="flex items-start p-3 bg-orange-50 rounded-lg">
                <div className="text-orange-600 mr-3 mt-0.5">⚠️</div>
                <span className="text-orange-800 text-sm">{warning}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {analysis.recommendations && (
        <div className="mb-6">
          <h4 className="text-lg font-medium text-gray-900 mb-3">Recomendaciones de Uso</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">Dosificación</h5>
              <p className="text-blue-800 text-sm">{analysis.recommendations.dosage}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">Momento</h5>
              <p className="text-blue-800 text-sm">{analysis.recommendations.timing}</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <h5 className="font-medium text-blue-900 mb-1">Duración</h5>
              <p className="text-blue-800 text-sm">{analysis.recommendations.duration}</p>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
        {analysis.is_suitable && onAddToStack && (
          <button
            onClick={onAddToStack}
            className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            Agregar a mi stack
          </button>
        )}
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Ver detalles completos
          </button>
        )}
      </div>
    </div>
  );
}