import { useState } from 'react';
import { 
  Star, 
  MessageSquare, 
  Mail, 
  Share2, 
  ClipboardList, 
  Utensils, 
  Bell, 
  Globe, 
  Download, 
  Crown, 
  CreditCard, 
  FileText, 
  Shield,
  ChevronRight,
  User,
  LogOut,
  Settings as SettingsIcon
} from "lucide-react";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { useAuth } from "@/shared/hooks/useAuth";
import { Settings } from "./Settings";
import { FeedbackModal } from "@/shared/components/FeedbackModal";
import { ShareModal } from "@/shared/components/ShareModal";
import { PremiumModal } from "@/shared/components/PremiumModal";

export const Profile = () => {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<'profile' | 'settings'>('profile');
  const [activeModal, setActiveModal] = useState<'feedback' | 'rating' | 'share' | 'premium-upgrade' | 'premium-manage' | null>(null);

  type MenuItem = {
    icon: any;
    text: string;
    hasChevron: boolean;
    highlight?: boolean;
    action?: () => void;
  };

  const supportItems: MenuItem[] = [
    { 
      icon: Star, 
      text: "Calificar la App", 
      hasChevron: true,
      action: () => setActiveModal('rating')
    },
    { 
      icon: MessageSquare, 
      text: "Enviar Comentarios", 
      hasChevron: true,
      action: () => setActiveModal('feedback')
    },
    { 
      icon: Mail, 
      text: "Contactar Desarrollador", 
      hasChevron: true,
      action: () => window.open('mailto:support@scanhealth.app', '_blank')
    },
    { 
      icon: Share2, 
      text: "Compartir App", 
      hasChevron: true,
      action: () => setActiveModal('share')
    },
  ];

  const settingsItems: MenuItem[] = [
    { 
      icon: SettingsIcon, 
      text: "Configuración General", 
      hasChevron: true,
      action: () => setCurrentView('settings')
    },
  ];

  const premiumItems: MenuItem[] = [
    { 
      icon: Crown, 
      text: "Actualizar a PRO", 
      hasChevron: true, 
      highlight: true,
      action: () => setActiveModal('premium-upgrade')
    },
    { 
      icon: CreditCard, 
      text: "Gestionar Suscripción", 
      hasChevron: true,
      action: () => setActiveModal('premium-manage')
    },
  ];

  const aboutItems: MenuItem[] = [
    { 
      icon: FileText, 
      text: "Términos de Servicio", 
      hasChevron: true,
      action: () => window.open('https://scanhealth.app/terms', '_blank')
    },
    { 
      icon: Shield, 
      text: "Política de Privacidad", 
      hasChevron: true,
      action: () => window.open('https://scanhealth.app/privacy', '_blank')
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      // Redirigir a la página de autenticación después del logout
      window.location.href = '/landing';
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show settings view
  if (currentView === 'settings') {
    return <Settings onBack={() => setCurrentView('profile')} />;
  }

  const MenuSection = ({ title, items }: { title: string; items: MenuItem[] }) => (
    <div className="mb-8">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">{title}</h2>
      <Card>
        <CardContent className="p-0">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors ${
                index !== items.length - 1 ? 'border-b border-border' : ''
              } ${item.highlight ? 'text-primary' : ''}`}
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.highlight ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="font-medium">{item.text}</span>
              </div>
              {item.hasChevron && (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="w-16 h-16">
            <AvatarImage src={user?.user_metadata?.avatar_url} alt="Mi perfil" />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
              <User className="w-8 h-8" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">
              {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Mi Perfil'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {user?.email || 'Configuración y preferencias'}
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        {/* Support & Feedback Section */}
        <MenuSection title="SOPORTE Y COMENTARIOS" items={supportItems} />

        {/* General Settings Section */}
        <MenuSection title="CONFIGURACIÓN" items={settingsItems} />

        {/* Premium Section */}
        <MenuSection title="PREMIUM" items={premiumItems} />

        {/* About Section */}
        <MenuSection title="ACERCA DE" items={aboutItems} />

        {/* Modals */}
        <FeedbackModal
          isOpen={activeModal === 'feedback'}
          onClose={() => setActiveModal(null)}
          type="feedback"
        />
        
        <FeedbackModal
          isOpen={activeModal === 'rating'}
          onClose={() => setActiveModal(null)}
          type="rating"
        />
        
        <ShareModal
          isOpen={activeModal === 'share'}
          onClose={() => setActiveModal(null)}
        />
        
        <PremiumModal
          isOpen={activeModal === 'premium-upgrade'}
          onClose={() => setActiveModal(null)}
          type="upgrade"
        />
        
        <PremiumModal
          isOpen={activeModal === 'premium-manage'}
          onClose={() => setActiveModal(null)}
          type="manage"
        />
      </div>
    </div>
  );
};
