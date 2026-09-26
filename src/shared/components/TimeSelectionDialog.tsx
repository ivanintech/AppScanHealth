import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/components/ui/dialog";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Sunrise, Sun, Moon } from "lucide-react";

interface TimeSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTime: (timeSlot: 'morning' | 'midday' | 'night') => void;
  supplementName: string;
}

export const TimeSelectionDialog = ({ 
  isOpen, 
  onOpenChange, 
  onSelectTime, 
  supplementName 
}: TimeSelectionDialogProps) => {
  const timeOptions = [
    {
      id: 'morning',
      label: 'Mañana',
      description: '6:00 - 12:00',
      icon: Sunrise,
      color: 'text-orange-500'
    },
    {
      id: 'midday',
      label: 'Mediodía',
      description: '12:00 - 18:00',
      icon: Sun,
      color: 'text-yellow-500'
    },
    {
      id: 'night',
      label: 'Noche',
      description: '18:00 - 24:00',
      icon: Moon,
      color: 'text-blue-500'
    }
  ];

  const handleSelectTime = (timeSlot: 'morning' | 'midday' | 'night') => {
    onSelectTime(timeSlot);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cuándo tomas {supplementName}?</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-3 py-4">
          {timeOptions.map((option) => {
            const Icon = option.icon;
            return (
              <Card 
                key={option.id}
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => handleSelectTime(option.id as 'morning' | 'midday' | 'night')}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <Icon className={`h-6 w-6 ${option.color}`} />
                  <div className="flex-1">
                    <h3 className="font-medium">{option.label}</h3>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
