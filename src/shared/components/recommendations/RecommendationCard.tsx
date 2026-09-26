import React from 'react';
import { Recommendation } from '../../lib/recommendation';

interface RecommendationCardProps {
  recommendation: Recommendation;
  onAddToStack?: (supplementEan: string) => void;
  onViewDetails?: (supplementEan: string) => void;
  onGiveFeedback?: (recommendation: Recommendation, feedback: 'positive' | 'negative') => void;
  showActions?: boolean;
}

export function RecommendationCard({ 
  recommendation, 
  onAddToStack, 
  onViewDetails, 
  onGiveFeedback,
  showActions = true 
}: RecommendationCardProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return 'Alta confianza';
    if (confidence >= 0.6) return 'Confianza media';
    return 'Baja confianza';
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {recommendation.supplement_name}
          </h3>
          <p className="text-sm text-gray-600">
            {recommendation.category} • EAN: {recommendation.supplement_ean}
          </p>
        </div>
        <div className="text-right">
          <div className={`text-sm font-medium ${getConfidenceColor(recommendation.confidence)}`}>
            {getConfidenceText(recommendation.confidence)}
          </div>
          <div className="text-xs text-gray-500">
            {Math.round(recommendation.confidence * 100)}% confianza
          </div>
        </div>
      </div>

      {/* Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Puntuación</span>
          <span className="text-sm font-bold text-blue-600">{recommendation.score.toFixed(1)}/10</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${recommendation.score * 10}%` }}
          />
        </div>
      </div>

      {/* Benefits */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Beneficios</h4>
        <div className="flex flex-wrap gap-2">
          {recommendation.benefits.map((benefit, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
            >
              {benefit}
            </span>
          ))}
        </div>
      </div>

      {/* Dosage and Timing */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Dosificación</h4>
          <p className="text-sm text-gray-600">{recommendation.dosage_recommendation}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-1">Momento</h4>
          <p className="text-sm text-gray-600">{recommendation.timing_recommendation}</p>
        </div>
      </div>

      {/* Warnings */}
      {recommendation.interactions_warnings.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-orange-700 mb-2">⚠️ Advertencias</h4>
          <ul className="text-sm text-orange-600 space-y-1">
            {recommendation.interactions_warnings.map((warning, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Contraindications */}
      {recommendation.contraindications.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-700 mb-2">🚫 Contraindicaciones</h4>
          <ul className="text-sm text-red-600 space-y-1">
            {recommendation.contraindications.map((contraindication, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-2">•</span>
                <span>{contraindication}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Reasons */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">¿Por qué te recomendamos esto?</h4>
        <div className="flex flex-wrap gap-2">
          {recommendation.reasons.map((reason, index) => (
            <span 
              key={index}
              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
            >
              {typeof reason === 'string' ? reason : reason.description}
            </span>
          ))}
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onAddToStack?.(recommendation.supplement_ean)}
            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Agregar a mi stack
          </button>
          <button
            onClick={() => onViewDetails?.(recommendation.supplement_ean)}
            className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Ver detalles
          </button>
        </div>
      )}

      {/* Feedback */}
      {onGiveFeedback && (
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          <button
            onClick={() => onGiveFeedback(recommendation, 'positive')}
            className="flex-1 bg-green-100 text-green-700 px-3 py-2 rounded-md hover:bg-green-200 transition-colors text-sm font-medium"
          >
            👍 Útil
          </button>
          <button
            onClick={() => onGiveFeedback(recommendation, 'negative')}
            className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
          >
            👎 No útil
          </button>
        </div>
      )}
    </div>
  );
}