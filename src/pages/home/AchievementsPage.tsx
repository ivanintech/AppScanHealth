import { useAllAchievements } from "@/features/analytics/hooks/useAllAchievements";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/shared/components/ui/card";
import { Badge } from "@/shared/components/ui/badge";
import { Lock, Trophy, ArrowLeft, Gem, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn, getAchievementIconByName } from "@/shared/lib/utils";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { Button } from "@/shared/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Progress } from "@/shared/components/ui/progress";

const rarityConfig = {
  common: {
    border: "border-gray-400",
    bg: "bg-gray-300/10",
    text: "text-gray-400",
    name: "Común",
  },
  rare: {
    border: "border-blue-400",
    bg: "bg-blue-400/10",
    text: "text-blue-400",
    name: "Raro",
  },
  epic: {
    border: "border-purple-400",
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    name: "Épico",
  },
  legendary: {
    border: "border-yellow-400",
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    name: "Legendario",
  },
};

const AchievementCardSkeleton = () => (
  <div className="h-full text-center p-4 flex flex-col items-center justify-center rounded-xl border-2 border-dashed bg-muted/40">
    <Skeleton className="w-16 h-16 rounded-full mb-2" />
    <Skeleton className="w-24 h-5 mb-2" />
    <Skeleton className="w-32 h-4" />
  </div>
);

export const AchievementsPage = () => {
  const { achievements, loading, error } = useAllAchievements();
  const navigate = useNavigate();

  const unlockedCount = achievements.filter((a) => a.is_unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <div className="p-4 space-y-6">
        {/* Skeleton for Header */}
        <div className="flex items-center gap-2">
          <Skeleton className="w-10 h-10" />
          <Skeleton className="w-48 h-7" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 font-semibold text-xl">
              <Skeleton className="w-6 h-6" />
              <Skeleton className="w-40 h-6" />
            </div>
            <div className="text-sm text-muted-foreground pt-1">
              <Skeleton className="w-64 h-5" />
            </div>
          </CardHeader>
        </Card>

        {/* Skeleton for Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <Card key={index} className="p-4 flex flex-col items-center justify-center">
              <Skeleton className="w-16 h-16 rounded-full mb-2" />
              <Skeleton className="w-24 h-5 mb-2" />
              <Skeleton className="w-32 h-4" />
              <Skeleton className="h-6 w-24 mt-auto" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 space-y-6"
    >
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Logros</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            Muro de Logros
          </CardTitle>
          <CardDescription>
            Has desbloqueado {unlockedCount} de {totalCount} logros. ¡Sigue así!
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {achievements.map((ach, index) => (
          <motion.div
            key={ach.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={cn(
              "h-full text-center p-4 flex flex-col items-center justify-center transition-all duration-300 border-2",
              ach.is_unlocked ? rarityConfig[ach.rarity].border : "bg-muted/40 border-dashed",
              ach.is_unlocked ? `shadow-lg ${rarityConfig[ach.rarity].bg}` : "shadow-sm",
              "relative overflow-hidden"
            )}>
              {/* <Badge variant="secondary" className="absolute top-2 right-2 text-xs font-bold">
                <Gem className="w-3 h-3 mr-1" />
                {ach.points} Puntos
              </Badge> */}

              {/* {!ach.is_unlocked && ach.current_progress > 0 && (
                <div
                  className="absolute top-0 left-0 h-full bg-primary/10 transition-all duration-500"
                  style={{ width: `${(ach.current_progress / ach.target_progress) * 100}%` }}
                />
              )} */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full">
                {ach.is_unlocked ? (
                  (() => {
                    const Icon = getAchievementIconByName(ach.name);
                    return (
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-2">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted/60 flex items-center justify-center mb-2">
                    <Lock className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <h3 className={cn(
                  "font-bold text-sm",
                  !ach.is_unlocked && "text-muted-foreground"
                )}>
                  {ach.name}
                </h3>
                <p className={cn(
                  "text-xs text-muted-foreground mt-1",
                  ach.is_unlocked && "text-foreground/80"
                )}>
                  {ach.description}
                </p>

                <div className="mt-auto pt-3 flex flex-col items-center gap-2">
                  {ach.is_unlocked ? (
                    ach.earned_at && (
                      <Badge variant="secondary" className="text-xs">
                        {new Date(ach.earned_at).toLocaleDateString()}
                      </Badge>
                    )
                  ) : (
                    ach.current_progress > 0 && (
                      <div className="w-full">
                        <Progress value={(ach.current_progress / ach.target_progress) * 100} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {Math.floor(ach.current_progress)} / {ach.target_progress}
                        </p>
                      </div>
                    )
                  )}
                  <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize", rarityConfig[ach.rarity].bg, rarityConfig[ach.rarity].text)}>
                    {rarityConfig[ach.rarity].name} • {ach.points} pts
                  </span>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};




