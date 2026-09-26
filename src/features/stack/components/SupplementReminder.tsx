import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Bell, BellOff, Plus, Calendar, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Input } from '@/shared/components/ui/input';
import { Label } from '@/shared/components/ui/label';
import { Switch } from '@/shared/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/shared/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Checkbox } from '@/shared/components/ui/checkbox';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from "@/shared/supabase/client";

interface Reminder {
  id: string;
  supplement_ean: string;
  supplement_name: string;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
  notification_enabled: boolean;
}

interface SupplementReminderProps {
  userSupplements: Array<{
    ean: string;
    name: string;
  }>;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

export const SupplementReminder: React.FC<SupplementReminderProps> = ({ userSupplements }) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const { toast } = useToast();

  // Form state
  const [selectedSupplement, setSelectedSupplement] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const fetchReminders = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const { data, error } = await supabase
        .from('supplement_reminders')
        .select('*')
        .eq('user_id', user.user.id)
        .order('reminder_time');

      if (error) throw error;

      // Por ahora, usar el EAN como nombre hasta que se configure la tabla correctamente
      const formattedReminders = data?.map(reminder => ({
        ...reminder,
        supplement_name: reminder.supplement_ean || 'Suplemento desconocido'
      })) || [];

      setReminders(formattedReminders);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los recordatorios",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReminders();
  }, [fetchReminders]);

  const resetForm = () => {
    setSelectedSupplement('');
    setReminderTime('08:00');
    setSelectedDays([1, 2, 3, 4, 5, 6, 7]);
    setNotificationEnabled(true);
    setEditingReminder(null);
  };

  const handleSaveReminder = async () => {
    if (!selectedSupplement) {
      toast({
        title: "Error",
        description: "Por favor selecciona un suplemento",
        variant: "destructive",
      });
      return;
    }

    if (selectedDays.length === 0) {
      toast({
        title: "Error", 
        description: "Por favor selecciona al menos un día",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const reminderData = {
        user_id: user.user.id,
        supplement_ean: selectedSupplement,
        reminder_time: reminderTime,
        days_of_week: selectedDays,
        notification_enabled: notificationEnabled,
        is_active: true,
      };

      if (editingReminder) {
        const { error } = await supabase
          .from('supplement_reminders')
          .update(reminderData)
          .eq('id', editingReminder.id);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Recordatorio actualizado correctamente",
        });
      } else {
        const { error } = await supabase
          .from('supplement_reminders')
          .insert([reminderData]);

        if (error) throw error;
        
        toast({
          title: "Éxito",
          description: "Recordatorio creado correctamente",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchReminders();
    } catch (error) {
      console.error('Error saving reminder:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el recordatorio",
        variant: "destructive",
      });
    }
  };

  const handleToggleReminder = async (reminderId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('supplement_reminders')
        .update({ is_active: !isActive })
        .eq('id', reminderId);

      if (error) throw error;
      
      fetchReminders();
      toast({
        title: "Éxito",
        description: isActive ? "Recordatorio desactivado" : "Recordatorio activado",
      });
    } catch (error) {
      console.error('Error toggling reminder:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el recordatorio",
        variant: "destructive",
      });
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setSelectedSupplement(reminder.supplement_ean);
    setReminderTime(reminder.reminder_time);
    setSelectedDays(reminder.days_of_week);
    setNotificationEnabled(reminder.notification_enabled);
    setIsDialogOpen(true);
  };

  const handleDayToggle = (dayValue: number) => {
    setSelectedDays(prev => 
      prev.includes(dayValue)
        ? prev.filter(d => d !== dayValue)
        : [...prev, dayValue]
    );
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDaysLabel = (days: number[]) => {
    const sortedDays = [...days].sort();
    return sortedDays.map(day => 
      DAYS_OF_WEEK.find(d => d.value === day)?.label
    ).join(', ');
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-full mx-auto animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-48 mx-auto"></div>
              <div className="h-3 bg-muted/60 rounded w-32 mx-auto"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Recordatorios
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8">
              <Plus className="w-4 h-4 mr-1" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingReminder ? 'Editar' : 'Nuevo'} Recordatorio
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="supplement">Suplemento</Label>
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
                <Label htmlFor="time">Hora</Label>
                <Input
                  id="time"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label>Días de la semana</Label>
                <div className="flex flex-wrap gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={selectedDays.includes(day.value)}
                        onCheckedChange={() => handleDayToggle(day.value)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-sm">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={notificationEnabled}
                  onCheckedChange={setNotificationEnabled}
                />
                <Label htmlFor="notifications">Habilitar notificaciones</Label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveReminder}>
                {editingReminder ? 'Actualizar' : 'Crear'} Recordatorio
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary opacity-60" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">No tienes recordatorios</h3>
            <p className="text-sm mb-4">Agrega recordatorios para no olvidar tus suplementos</p>
            <Button variant="outline" size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear tu primer recordatorio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                className={`group p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${
                  reminder.is_active 
                    ? 'bg-card border-border hover:border-primary/20 hover:bg-card/80' 
                    : 'bg-muted/50 border-muted opacity-70 hover:opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex-shrink-0">
                      {reminder.is_active ? (
                        <Bell className="w-5 h-5 text-primary" />
                      ) : (
                        <BellOff className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground line-clamp-1">
                        {reminder.supplement_name}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{formatTime(reminder.reminder_time)}</span>
                        <span>•</span>
                        <span>{getDaysLabel(reminder.days_of_week)}</span>
                      </div>
                      {reminder.notification_enabled && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          Notificaciones ON
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditReminder(reminder)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={reminder.is_active}
                      onCheckedChange={() => handleToggleReminder(reminder.id, reminder.is_active)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
