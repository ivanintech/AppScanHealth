import React from 'react';

interface DeficiencyAnalysisProps {
  deficiencies: string[];
  severity: 'low' | 'moderate' | 'high';
  recommendedSupplements: string[];
  onViewSupplement: (supplement: string) => void;
}

export function DeficiencyAnalysis({ 
  deficiencies, 
  severity, 
  recommendedSupplements, 
  onViewSupplement 
}: DeficiencyAnalysisProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'moderate': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return 'Alta prioridad';
      case 'moderate': return 'Prioridad media';
      case 'low': return 'Baja prioridad';
      default: return 'Sin clasificar';
    }
  };

  if (deficiencies.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-center mb-4">
          <div className="text-2xl mr-3">🎉</div>
          <div>
            <h3 className="text-lg font-semibold text-green-800">
              ¡Excelente! No se detectaron carencias importantes
            </h3>
            <p className="text-green-600 text-sm">
              Tu perfil nutricional se ve bien. Mantén una dieta equilibrada y considera suplementos preventivos.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Análisis de Carencias Nutricionales
          </h3>
          <p className="text-gray-600 text-sm">
            Basado en tu perfil de salud y datos de laboratorio
          </p>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(severity)}`}>
          {getSeverityText(severity)}
        </div>
      </div>

      <div className="space-y-4 mb-6">
        {deficiencies.map((deficiency, index) => (
          <div key={index} className="flex items-start p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl mr-4">💊</div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">
                {deficiency}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Carencia nutricional detectada
              </p>
              <div className="flex items-center text-sm text-orange-600">
                <span className="mr-2">⚠️</span>
                <span>Carencia detectada - Se recomienda suplementación</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {recommendedSupplements.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">
            Suplementos Recomendados
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recommendedSupplements.map((supplement, index) => (
              <button
                key={index}
                onClick={() => onViewSupplement(supplement)}
                className="flex items-center p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors text-left"
              >
                <div className="text-lg mr-3">💊</div>
                <div className="flex-1">
                  <div className="font-medium text-blue-900">{supplement}</div>
                  <div className="text-sm text-blue-600">Ver detalles y agregar</div>
                </div>
                <div className="text-blue-600">→</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Ver Recomendaciones Completas
        </button>
      </div>
    </div>
  );
}