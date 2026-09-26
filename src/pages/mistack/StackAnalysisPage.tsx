import { useState, useEffect } from "react";
import { supabase } from "@/shared/supabase/client";
import {
  AlertTriangle,
  Zap,
  CheckCircle,
  Info,
  ArrowLeft,
  PlusCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

type InteractionType = "positive" | "negative" | "caution";

interface Interaction {
  supplement_a_ean: string;
  supplement_b_ean: string;
  interaction_type: InteractionType;
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  recommendation: string;
  supplements_a: { name: string; image_url: string };
  supplements_b: { name: string; image_url: string };
}

type GroupedInteractions = {
  [key in InteractionType]?: Interaction[];
};

const InteractionCardSkeleton = () => (
  <div className="p-4 rounded-lg border bg-gray-50">
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-5 h-5 rounded-full" />
      <Skeleton className="w-32 h-5" />
    </div>
    <div className="flex items-center gap-4 mb-4">
      <div className="text-center">
        <Skeleton className="w-16 h-16 rounded-md mx-auto" />
        <Skeleton className="w-20 h-4 mt-2 mx-auto" />
      </div>
      <div className="text-2xl font-light text-muted-foreground">+</div>
      <div className="text-center">
        <Skeleton className="w-16 h-16 rounded-md mx-auto" />
        <Skeleton className="w-20 h-4 mt-2 mx-auto" />
      </div>
    </div>
    <Skeleton className="w-full h-4 mb-2" />
    <Skeleton className="w-3/4 h-4" />
  </div>
);

export const StackAnalysisPage = () => {
  const [groupedInteractions, setGroupedInteractions] = useState<GroupedInteractions>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSufficientSupplements, setHasSufficientSupplements] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStackAnalysis = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError("Debes iniciar sesión para ver tu análisis.");
          setLoading(false);
          return;
        }

        const { data: stack, error: stackError } = await supabase
          .from("user_supplement_stack")
          .select("supplement_ean")
          .eq("user_id", user.id);

        if (stackError) throw stackError;

        if (!stack || stack.length < 2) {
          setHasSufficientSupplements(false);
          setLoading(false);
          return;
        }

        setHasSufficientSupplements(true);
        const eans = stack.map(s => s.supplement_ean);
        const pairs: [string, string][] = [];
        for (let i = 0; i < eans.length; i++) {
          for (let j = i + 1; j < eans.length; j++) {
            pairs.push([eans[i], eans[j]]);
          }
        }

        // TODO: Implement interaction checking when the RPC function is available
        // For now, we'll set empty interactions
        setGroupedInteractions({});
      } catch (e: unknown) {
        setError("No se pudo cargar el análisis de tu stack.");
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchStackAnalysis();
  }, []);

  const InteractionCard = ({ interaction }: { interaction: Interaction }) => {
    const typeMap = {
      positive: {
        icon: Zap,
        color: "text-green-500",
        bgColor: "bg-green-50",
        title: "Sinergia Positiva",
      },
      negative: {
        icon: AlertTriangle,
        color: "text-red-500",
        bgColor: "bg-red-50",
        title: "Interacción Negativa",
      },
      caution: {
        icon: Info,
        color: "text-yellow-500",
        bgColor: "bg-yellow-50",
        title: "Precaución",
      },
    };
    const { icon: Icon, color, bgColor, title } = typeMap[interaction.interaction_type];

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-4 rounded-lg border ${bgColor}`}
      >
        <div className={`flex items-center gap-3 font-bold mb-3 ${color}`}>
          <Icon className="w-5 h-5" />
          <span>{title}</span>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-center">
            <img src={interaction.supplements_a.image_url} alt={interaction.supplements_a.name} className="w-16 h-16 object-contain rounded-md mx-auto bg-white p-1" />
            <p className="text-xs mt-1 font-medium">{interaction.supplements_a.name}</p>
          </div>
          <div className="text-2xl font-light text-muted-foreground">+</div>
          <div className="text-center">
            <img src={interaction.supplements_b.image_url} alt={interaction.supplements_b.name} className="w-16 h-16 object-contain rounded-md mx-auto bg-white p-1" />
            <p className="text-xs mt-1 font-medium">{interaction.supplements_b.name}</p>
          </div>
        </div>
        <p className="text-sm text-foreground mb-2">{interaction.description}</p>
        <p className="text-sm text-muted-foreground font-semibold">{interaction.recommendation}</p>
      </motion.div>
    );
  };

  const interactionOrder: { type: InteractionType, title: string }[] = [
    { type: "negative", title: "Interacciones Negativas" },
    { type: "caution", title: "Precauciones a Considerar" },
    { type: "positive", title: "Sinergias Positivas" },
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-4">
          <InteractionCardSkeleton />
          <InteractionCardSkeleton />
          <InteractionCardSkeleton />
        </div>
      );
    }
    if (error) return <p className="text-red-500">{error}</p>;

    if (!hasSufficientSupplements) {
      return (
        <div className="text-center py-10 flex flex-col items-center">
          <PlusCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold">Añade más suplementos</h2>
          <p className="text-muted-foreground max-w-sm mx-auto mb-6">
            Necesitas al menos dos suplementos en tu stack para analizar las
            posibles interacciones.
          </p>
          <Button onClick={() => navigate("/")}>
            Añadir suplementos
          </Button>
        </div>
      );
    }

    const totalInteractions = Object.values(groupedInteractions).flat().length;

    if (totalInteractions === 0) {
      return (
        <div className="text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold">¡Todo en orden!</h2>
          <p className="text-muted-foreground">No hemos encontrado interacciones conocidas entre los suplementos de tu stack.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {interactionOrder.map(({ type, title }) => {
          const interactionsForType = groupedInteractions[type];
          if (!interactionsForType || interactionsForType.length === 0) {
            return null;
          }
          return (
            <div key={type}>
              <h2 className="text-lg font-semibold mb-3">{title}</h2>
              <div className="space-y-4">
                {interactionsForType.map((interaction, i) => (
                  <InteractionCard key={`${type}-${i}`} interaction={interaction} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 pb-20">
      <header className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Análisis de Stack</h1>
          <p className="text-sm text-muted-foreground">Revisa sinergias y posibles conflictos.</p>
        </div>
      </header>
      {renderContent()}
    </div>
  );
};
