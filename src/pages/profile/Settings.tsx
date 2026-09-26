import { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Globe, Utensils, Download, AppWindow } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { Switch } from '@/shared/components/ui/switch';
import { Label } from '@/shared/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/supabase/client';
import { useAuth } from '@/shared/hooks/useAuth';
import { InstallPWA } from '@/shared/components/InstallPWA';

interface NotificationPreferences {
  push_enabled: boolean;
  email_enabled: boolean;
  timezone: string;
}

interface SettingsProps {
  onBack: () => void;
}

export const Settings = ({ onBack }: SettingsProps) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    push_enabled: true,
    email_enabled: true,
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      // Por ahora, usar valores por defecto hasta que se implemente la columna
      console.log('Cargando preferencias por defecto...');
      setPreferences({
        push_enabled: true,
        email_enabled: true,
        timezone: 'UTC'
      });
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      // Por ahora, solo mostrar mensaje de éxito hasta que se implemente la columna
      console.log('Guardando preferencias:', preferences);
      
      toast({
        title: "Configuración guardada",
        description: "Tus preferencias han sido actualizadas (modo demo)",
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "No se pudieron guardar las preferencias",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setPreferences(prev => ({ ...prev, push_enabled: true }));
        toast({
          title: "Notificaciones habilitadas",
          description: "Ahora recibirás recordatorios push",
        });
      } else {
        setPreferences(prev => ({ ...prev, push_enabled: false }));
        toast({
          title: "Notificaciones denegadas",
          description: "No podrás recibir recordatorios push",
          variant: "destructive",
        });
      }
    }
  };

  const exportData = async () => {
    if (!user) return;

    try {
      const { data: supplements } = await supabase
        .from('user_supplement_stack')
        .select('*, supplements(*)')
        .eq('user_id', user.id);

      const { data: logs } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id);

      const { data: reminders } = await supabase
        .from('supplement_reminders')
        .select('*')
        .eq('user_id', user.id);

      const exportData = {
        user_id: user.id,
        exported_at: new Date().toISOString(),
        supplements,
        logs,
        reminders
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanhealth-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Datos exportados",
        description: "Tu información ha sido descargada",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "Error",
        description: "No se pudieron exportar los datos",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-md mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Configuración</h1>
        </div>

        {/* Aplicación */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AppWindow className="w-5 h-5" />
              Aplicación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InstallPWA />
          </CardContent>
        </Card>

        {/* Notificaciones */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notificaciones
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="push-notifications">Notificaciones Push</Label>
              <Switch
                id="push-notifications"
                checked={preferences.push_enabled}
                onCheckedChange={(checked) => {
                  if (checked) {
                    requestNotificationPermission();
                  } else {
                    setPreferences(prev => ({ ...prev, push_enabled: false }));
                  }
                }}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="email-notifications">Notificaciones Email</Label>
              <Switch
                id="email-notifications"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) =>
                  setPreferences(prev => ({ ...prev, email_enabled: checked }))
                }
              />
            </div>

          </CardContent>
        </Card>


        {/* Idioma */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Idioma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select defaultValue="es">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Horarios de comida */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Utensils className="w-5 h-5" />
              Horarios de Comida
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desayuno</Label>
              <Input type="time" defaultValue="07:30" />
            </div>
            <div className="space-y-2">
              <Label>Almuerzo</Label>
              <Input type="time" defaultValue="13:00" />
            </div>
            <div className="space-y-2">
              <Label>Cena</Label>
              <Input type="time" defaultValue="19:30" />
            </div>
          </CardContent>
        </Card>

        {/* Datos */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Tus Datos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={exportData}
              className="w-full"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Datos
            </Button>
          </CardContent>
        </Card>

        {/* Guardar cambios */}
        <Button
          onClick={savePreferences}
          disabled={saving}
          className="w-full"
        >
          {saving ? 'Guardando...' : 'Guardar Cambios'}
        </Button>
      </div>
    </div>
  );
};
