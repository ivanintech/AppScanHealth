import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/shared/components/ui/collapsible';
import { Badge } from '@/shared/components/ui/badge';
import {
  BookOpen,
  Target,
  Activity,
  Brain,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';

interface SupplementInfoCardsProps {
  examineData: {
    description?: string;
    benefits?: string[];
    mechanisms?: string[];
    dosage?: string | { effective: string; safe: string; notes: string };
    sideEffects?: string[];
    interactions?: string[];
    research?: {
      studies: number;
      evidence: 'High' | 'Medium' | 'Low';
    };
  };
  supplementData: any;
}

export const SupplementInfoCards: React.FC<SupplementInfoCardsProps> = ({
  examineData,
  supplementData
}) => {
  const [openSections, setOpenSections] = React.useState<Record<string, boolean>>({
    description: true,
    benefits: false,
    mechanisms: false,
    dosage: false,
    sideEffects: false,
    interactions: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getEvidenceColor = (evidence: string) => {
    switch (evidence) {
      case 'High': return 'bg-green-50 text-green-700 border-green-200';
      case 'Medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Low': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <>
      {/* Información Científica principal */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-blue-600" />
            Información Científica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Descripción */}
          {examineData.description && (
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {examineData.description}
              </p>
              {examineData.research && (
                <div className="flex gap-2">
                  {/* <Badge variant="outline" className={`text-sm ${getEvidenceColor(examineData.research.evidence)}`}>
                    <Award className="w-3 h-3 mr-1" />
                    Evidencia {examineData.research.evidence}
                  </Badge>
                  <Badge variant="outline" className="text-sm bg-blue-50 text-blue-700 border-blue-200">
                    <Users className="w-3 h-3 mr-1" />
                    {examineData.research.studies} estudios
                  </Badge> */}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Beneficios */}
      {examineData.benefits && examineData.benefits.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="w-5 h-5 text-green-600" />
              Beneficios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="pl-6 list-disc space-y-1 text-sm text-muted-foreground">
              {examineData.benefits.map((benefit, index) => (
                <li key={index}>{benefit}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Dosificación */}
      {examineData.dosage && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="w-5 h-5 text-orange-600" />
              Dosificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="">
              {typeof examineData.dosage === 'string' ? (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {examineData.dosage}
                </p>
              ) : (
                <div className="space-y-2">
                  <div>
                    <span className="text-sm font-medium text-foreground">Efectiva:</span>
                    <p className="ml-4 text-sm text-muted-foreground">{examineData.dosage.effective}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-foreground">Segura:</span>
                    <p className="ml-4 text-sm text-muted-foreground">{examineData.dosage.safe}</p>
                  </div>
                  {examineData.dosage.notes && (
                    <div>
                      <span className="text-sm font-medium text-foreground">Notas:</span>
                      <p className="ml-4 text-sm text-muted-foreground">{examineData.dosage.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Efectos Secundarios */}
      {examineData.sideEffects && examineData.sideEffects.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Eye className="w-5 h-5 text-red-600" />
              Efectos Secundarios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="pl-6 list-disc space-y-1 text-sm text-muted-foreground">
              {examineData.sideEffects.map((effect, index) => (
                <li key={index}>{effect}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Interacciones */}
      {examineData.interactions && examineData.interactions.length > 0 && (
        <Card className="mt-4">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              Interacciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {examineData.interactions.map((interaction, index) => (
                <div key={index} className="flex items-start gap-2">
                  {/* <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" /> */}
                  <span className="text-sm text-muted-foreground">{interaction}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};