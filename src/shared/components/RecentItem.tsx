import { Card } from "@/shared/components/ui/card";
import { Clock, TrendingUp } from "lucide-react";

interface RecentItemProps {
  name: string;
  calories: number;
  time: string;
  image?: string;
}

export const RecentItem = ({
  name,
  calories,
  time,
  image
}: RecentItemProps) => {
  return (
    <Card className="p-4 shadow-card border-border hover:shadow-lg transition-shadow cursor-pointer">
      <div className="flex items-center gap-3">
        {image ? (
          <div className="w-12 h-12 bg-wellness-bg rounded-lg overflow-hidden flex-shrink-0">
            <img src={image} alt={name} className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6 text-primary" />
          </div>
        )}
        
        <div className="min-w-0 flex-1">
          <h4 className="font-medium text-foreground line-clamp-1">{name}</h4>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{time}</span>
            <span>•</span>
            <span>{calories} kcal</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
