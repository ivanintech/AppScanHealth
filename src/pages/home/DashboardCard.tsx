import { Card, CardContent } from "@/shared/components/ui/card";
import { ArrowRight, HelpCircle } from "lucide-react";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: string;
  color: "blue" | "green" | "purple" | "orange";
  onClick: () => void;
}

export const DashboardCard = ({ title, description, icon, color, onClick }: DashboardCardProps) => {
  // Mapeo simple de iconos por nombre
  const getIcon = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'HeartPulse': require('lucide-react').HeartPulse,
      'Calendar': require('lucide-react').Calendar,
      'TrendingUp': require('lucide-react').TrendingUp,
      'Award': require('lucide-react').Award,
    };
    return iconMap[iconName] || HelpCircle;
  };
  
  const Icon = getIcon(icon);

  const colorMap = {
    blue: "from-blue-500 to-blue-700",
    green: "from-green-500 to-green-700",
    purple: "from-purple-500 to-purple-700",
    orange: "from-orange-500 to-orange-700",
  };

  const shadowColorMap = {
    blue: "shadow-blue-500/30",
    green: "shadow-green-500/30",
    purple: "shadow-purple-500/30",
    orange: "shadow-orange-500/30",
  };

  return (
    <Card 
      className={`relative overflow-hidden group cursor-pointer text-white shadow-lg ${shadowColorMap[color]}`}
      onClick={onClick}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
      <CardContent className="relative z-10 p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-xs text-white/80 line-clamp-2">{description}</p>
          </div>
          <Icon className="w-8 h-8 text-white/50" />
        </div>
        <div className="flex justify-end items-center mt-4">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </CardContent>
    </Card>
  );
};

