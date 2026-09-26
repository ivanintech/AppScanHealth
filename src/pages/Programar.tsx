import { useState } from "react";
import { Coffee, UtensilsCrossed, Mountain, Plus, Flame } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { WeeklyCalendar } from "@/pages/home/WeeklyCalendar";

export const Programar = () => {
  const [selectedDay, setSelectedDay] = useState(3); // Wednesday selected

  const meals = [{
    id: "breakfast",
    icon: Coffee,
    name: "Mañana",
    items: []
  }, {
    id: "lunch",
    icon: UtensilsCrossed,
    name: "Mediodia",
    items: []
  }, {
    id: "dinner",
    icon: Mountain,
    name: "Cena",
    items: []
  }];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-background/95 backdrop-blur-sm">
        <h1 className="font-bold text-foreground text-lg">
          Hoy, 3 de septiembre
        </h1>
        
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full px-3 py-2 flex items-center gap-2 border border-primary/20">
            <Flame className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-sm font-bold text-primary">7</span>
          </div>
          <div className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
            PRO
          </div>
        </div>
      </header>

      {/* Weekly Calendar */}
      <WeeklyCalendar />

      {/* Supplements Section */}
      <main className="px-4 mt-6">
        <h2 className="text-xl font-bold text-foreground mb-6">Añadir suplementos</h2>
        
        <section className="space-y-4">
          {meals.map((meal) => {
            const Icon = meal.icon;
            return (
              <article key={meal.id} className="bg-card rounded-lg p-4 border border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground">{meal.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Aún no hay elementos registrados
                      </p>
                    </div>
                  </div>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-primary border-primary/20 hover:bg-primary/10 flex-shrink-0"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Registrar
                  </Button>
                </div>
              </article>
            );
          })}
        </section>
      </main>
    </div>
  );
};
