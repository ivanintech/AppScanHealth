import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Badge } from '@/shared/components/ui/badge';
import { Switch } from '@/shared/components/ui/switch';
import { Bell, Clock, Calendar, Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';

interface SupplementReminder {
  id: string;
  user_id: string;
  supplement_ean: string;
  reminder_time: string;
  days_of_week: number[];
  is_active: boolean;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
  product?: {
    product_name: string;
    image_url?: string;
  };
}

const DAYS_OF_WEEK = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const SmartReminders = () => {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<SupplementReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchReminders();
    }
  }, [user]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('supplement_reminders')
        .select(`
          *,
          products:supplement_ean (
            product_name,
            image_url
          )
        `)
        .eq('user_id', user?.id)
        .order('reminder_time', { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleReminder = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('supplement_reminders')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id ? { ...reminder, is_active: isActive } : reminder
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleNotifications = async (id: string, notificationEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('supplement_reminders')
        .update({ notification_enabled: notificationEnabled })
        .eq('id', id);

      if (error) throw error;
      
      setReminders(prev => 
        prev.map(reminder => 
          reminder.id === id ? { ...reminder, notification_enabled: notificationEnabled } : reminder
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('supplement_reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setReminders(prev => prev.filter(reminder => reminder.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };

  const getDaysText = (days: number[]) => {
    if (days.length === 7) return 'Todos los días';
    if (days.length === 5 && !days.includes(0) && !days.includes(6)) return 'Lunes a Viernes';
    if (days.length === 2 && days.includes(0) && days.includes(6)) return 'Fines de semana';
    
    return days.map(day => DAYS_OF_WEEK[day]).join(', ');
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recordatorios Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recordatorios Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">Error cargando recordatorios: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Recordatorios Inteligentes
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {reminders.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No tienes recordatorios configurados</p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Recordatorio
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => (
              <div key={reminder.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {reminder.product?.image_url && (
                      <img 
                        src={reminder.product.image_url} 
                        alt={reminder.product.product_name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div>
                      <h4 className="font-semibold">
                        {reminder.product?.product_name || 'Suplemento'}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatTime(reminder.reminder_time)}
                        <Calendar className="h-3 w-3 ml-2" />
                        {getDaysText(reminder.days_of_week)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={reminder.is_active ? "default" : "secondary"}>
                      {reminder.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteReminder(reminder.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.is_active}
                        onCheckedChange={(checked) => toggleReminder(reminder.id, checked)}
                      />
                      <span className="text-sm">Activar</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.notification_enabled}
                        onCheckedChange={(checked) => toggleNotifications(reminder.id, checked)}
                      />
                      <span className="text-sm">Notificaciones</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            <Button className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nuevo Recordatorio
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
