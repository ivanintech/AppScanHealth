import { useState } from 'react';
import { Share2, Copy, MessageCircle, Mail, Link2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { useToast } from '@/shared/hooks/use-toast';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal = ({ isOpen, onClose }: ShareModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const appUrl = window.location.origin;
  const shareText = "¡Descubre ScanHealth! La app perfecta para gestionar tus suplementos de forma inteligente 💊📱";
  const shareData = {
    title: 'ScanHealth - Gestión Inteligente de Suplementos',
    text: shareText,
    url: appUrl,
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText}\n\n${appUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "¡Copiado!",
        description: "El enlace se copió al portapapeles",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Error",
        description: "No se pudo copiar el enlace",
        variant: "destructive",
      });
    }
  };

  const shareViaWhatsApp = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText}\n\n${appUrl}`)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    // Detect if on mobile and try Gmail first
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const subject = encodeURIComponent('ScanHealth - App de Suplementos');
    const body = encodeURIComponent(`${shareText}\n\n${appUrl}`);
    
    if (isMobile) {
      // Try Gmail app first on mobile
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
      window.open(gmailUrl, '_blank');
    } else {
      // Try Gmail web on desktop, fallback to mailto
      const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      
      // Try Gmail web first, fallback to mailto if it fails
      const newWindow = window.open(gmailWebUrl, '_blank');
      if (!newWindow) {
        window.open(mailtoUrl);
      }
    }
  };

  const shareViaNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast({
          title: "¡Compartido!",
          description: "Gracias por compartir ScanHealth",
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      copyToClipboard();
    }
  };

  const shareViaTwitter = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartir App
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">
              ¡Comparte ScanHealth con tus amigos!
            </h3>
            <p className="text-sm text-muted-foreground">
              Ayuda a otros a mejorar su salud con suplementos inteligentes
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enlace de la app</label>
              <div className="flex">
                <Input
                  value={appUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyToClipboard}
                  className="ml-2"
                >
                  {copied ? (
                    <span className="text-xs text-green-600">✓</span>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {navigator.share && (
                <Button
                  variant="outline"
                  onClick={shareViaNative}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Compartir
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={shareViaWhatsApp}
                className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </Button>

              <Button
                variant="outline"
                onClick={shareViaEmail}
                className="flex items-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Email
              </Button>

              <Button
                variant="outline"
                onClick={shareViaTwitter}
                className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <span className="w-4 h-4 font-bold">𝕏</span>
                Twitter
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted/30 rounded-lg">
            <h4 className="font-medium mb-2">💡 ¿Por qué compartir?</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Ayuda a amigos a optimizar su salud</li>
              <li>• Comparte recordatorios inteligentes</li>
              <li>• Evita interacciones peligrosas</li>
              <li>• Fomenta hábitos saludables</li>
            </ul>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
