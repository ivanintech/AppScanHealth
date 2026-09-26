import React, { useState } from 'react';
import { Plus, Clock, Save, Star } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/supabase/client';

interface LogSupplementIntakeProps {
  userSupplements: Array<{
    ean: string;
    name: string;
  }>;
  onLogAdded?: () => void;
}

const MOOD_OPTIONS = [
  { value: 1, label: '😣 Muy mal', color: 'text-red-600' },
  { value: 2, label: '😞 Mal', color: 'text-orange-600' },
  { value: 3, label: '😐 Regular', color: 'text-yellow-600' },
  { value: 4, label: '😊 Bien', color: 'text-green-600' },
  { value: 5, label: '🤩 Excelente', color: 'text-emerald-600' },
];

export const LogSupplementIntake: React.FC<LogSupplementIntakeProps> = ({ 
  userSupplements, 
  onLogAdded 
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [doseTaken, setDoseTaken] = useState('');
  const [doseUnit, setDoseUnit] = useState('cápsulas');
  const [moodBefore, setMoodBefore] = useState<number | undefined>();
  const [moodAfter, setMoodAfter] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [takenTime, setTakenTime] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 16); // Format for datetime-local input
  });

  const resetForm = () => {
    setSelectedSupplement('');
    setDoseTaken('');
    setDoseUnit('cápsulas');
    setMoodBefore(undefined);
    setMoodAfter(undefined);
    setNotes('');
    const now = new Date();
    setTakenTime(now.toISOString().slice(0, 16));
  };

  const logMutation = useMutation({
    mutationFn: async (logData: any) => {
      const { error } = await supabase.from('supplement_logs').insert([logData]);
      if (error) throw error;
      return logData;
    },
    onSuccess: () => {
      toast({
        title: "¡Registrado!",
        description: "Tu toma de suplemento ha sido registrada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['gamificationData'] });
      queryClient.invalidateQueries({ queryKey: ['progressData'] });
      setIsDialogOpen(false);
      resetForm();
      onLogAdded?.();
    },
    onError: (error) => {
      console.error('Error saving supplement log:', error);
      toast({
        title: "Error",
        description: "No se pudo registrar la toma del suplemento",
        variant: "destructive",
      });
    },
  });


  const handleSaveLog = async () => {
    if (!selectedSupplement) {
      toast({
        title: "Error",
        description: "Por favor selecciona un suplemento",
        variant: "destructive",
      });
      return;
    }

    if (!doseTaken) {
      toast({
        title: "Error",
        description: "Por favor indica la cantidad tomada",
        variant: "destructive",
      });
      return;
    }

    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      toast({
        title: "Error",
        description: "No estás autenticado",
        variant: "destructive",
      });
      return;
    }

    const doseData = {
      amount: parseFloat(doseTaken) || 1,
      unit: doseUnit,
    };

    const logData = {
      user_id: user.user.id,
      supplement_ean: selectedSupplement,
      taken_at: new Date(takenTime).toISOString(),
      dose_taken: doseData,
      notes: notes.trim() || null,
      mood_before: moodBefore || null,
      mood_after: moodAfter || null,
    };

    logMutation.mutate(logData);
  };

  const getMoodOption = (value?: number) => {
    return MOOD_OPTIONS.find(option => option.value === value);
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={(open) => {
      setIsDialogOpen(open);
      if (!open) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8">
          <Plus className="w-4 h-4 mr-1" />
          Registrar Toma
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Registrar Toma de Suplemento
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="supplement">Suplemento *</Label>
            <Select value={selectedSupplement} onValueChange={setSelectedSupplement}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar suplemento" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border shadow-lg z-50">
                {userSupplements.map((supplement) => (
                  <SelectItem key={supplement.ean} value={supplement.ean} className="hover:bg-muted focus:bg-muted">
                    {supplement.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="taken-time">Fecha y hora *</Label>
            <Input
              id="taken-time"
              type="datetime-local"
              value={takenTime}
              onChange={(e) => setTakenTime(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="dose">Cantidad *</Label>
              <Input
                id="dose"
                type="number"
                step="0.5"
                min="0.1"
                placeholder="1"
                value={doseTaken}
                onChange={(e) => setDoseTaken(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidad</Label>
              <Select value={doseUnit} onValueChange={setDoseUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border border-border shadow-lg z-50">
                  <SelectItem value="cápsulas" className="hover:bg-muted focus:bg-muted">cápsulas</SelectItem>
                  <SelectItem value="tabletas" className="hover:bg-muted focus:bg-muted">tabletas</SelectItem>
                  <SelectItem value="ml" className="hover:bg-muted focus:bg-muted">ml</SelectItem>
                  <SelectItem value="gramos" className="hover:bg-muted focus:bg-muted">gramos</SelectItem>
                  <SelectItem value="cucharadas" className="hover:bg-muted focus:bg-muted">cucharadas</SelectItem>
                  <SelectItem value="gotas" className="hover:bg-muted focus:bg-muted">gotas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>¿Cómo te sentías ANTES de tomarlo? (opcional)</Label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <Button
                    key={`before-${option.value}`}
                    type="button"
                    size="sm"
                    variant={moodBefore === option.value ? "default" : "outline"}
                    className="flex flex-col items-center p-2 h-auto"
                    onClick={() => setMoodBefore(
                      moodBefore === option.value ? undefined : option.value
                    )}
                  >
                    <span className="text-lg mb-1">{option.label.split(' ')[0]}</span>
                    <span className="text-xs text-center leading-tight">
                      {option.label.split(' ').slice(1).join(' ')}
                    </span>
                  </Button>
                ))}
              </div>
              {moodBefore && (
                <p className="text-sm text-muted-foreground">
                  Seleccionado: {getMoodOption(moodBefore)?.label}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>¿Cómo te sientes DESPUÉS? (opcional)</Label>
              <div className="grid grid-cols-5 gap-2">
                {MOOD_OPTIONS.map((option) => (
                  <Button
                    key={`after-${option.value}`}
                    type="button"
                    size="sm"
                    variant={moodAfter === option.value ? "default" : "outline"}
                    className="flex flex-col items-center p-2 h-auto"
                    onClick={() => setMoodAfter(
                      moodAfter === option.value ? undefined : option.value
                    )}
                  >
                    <span className="text-lg mb-1">{option.label.split(' ')[0]}</span>
                    <span className="text-xs text-center leading-tight">
                      {option.label.split(' ').slice(1).join(' ')}
                    </span>
                  </Button>
                ))}
              </div>
              {moodAfter && (
                <p className="text-sm text-muted-foreground">
                  Seleccionado: {getMoodOption(moodAfter)?.label}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="¿Algo que quieras recordar sobre esta toma?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSaveLog} disabled={logMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {logMutation.isPending ? 'Guardando...' : 'Registrar Toma'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
