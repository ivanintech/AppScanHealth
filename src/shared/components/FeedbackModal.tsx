import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import { Label } from '@/shared/components/ui/label';
import { useToast } from '@/shared/hooks/use-toast';
import { supabase } from '@/shared/supabase/client';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'feedback' | 'rating';
}

export const FeedbackModal = ({ isOpen, onClose, type }: FeedbackModalProps) => {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (type === 'rating' && rating === 0) {
      toast({
        title: "Calificación requerida",
        description: "Por favor selecciona una calificación",
        variant: "destructive",
      });
      return;
    }

    if (type === 'feedback' && !comment.trim()) {
      toast({
        title: "Comentario requerido",
        description: "Por favor escribe tu comentario",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Send feedback to backend
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.functions.invoke('send-feedback', {
        body: {
          type,
          rating: type === 'rating' ? rating : null,
          comment: comment.trim(),
          timestamp: new Date().toISOString()
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;

      toast({
        title: type === 'rating' ? "¡Gracias por tu calificación!" : "¡Comentario enviado!",
        description: type === 'rating' 
          ? "Tu calificación nos ayuda a mejorar" 
          : "Apreciamos tu feedback para mejorar la app",
      });

      // Reset form
      setRating(0);
      setComment('');
      onClose();
    } catch (error) {
      console.error('Error sending feedback:', error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu " + (type === 'rating' ? 'calificación' : 'comentario'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openAppStore = () => {
    // Detect device and open appropriate store
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    if (isIOS) {
      window.open('https://apps.apple.com/app/your-app-id', '_blank');
    } else if (isAndroid) {
      window.open('https://play.google.com/store/apps/details?id=your.package.name', '_blank');
    } else {
      // Fallback for desktop
      toast({
        title: "Disponible en móviles",
        description: "La app está disponible en App Store y Google Play",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {type === 'rating' ? 'Calificar la App' : 'Enviar Comentarios'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {type === 'rating' && (
            <>
              <div className="space-y-3">
                <Label>¿Cómo calificarías tu experiencia?</Label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoveredRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    {rating === 5 && "¡Excelente! 🎉"}
                    {rating === 4 && "¡Muy bueno! 👍"}
                    {rating === 3 && "Bueno 👌"}
                    {rating === 2 && "Puede mejorar 🤔"}
                    {rating === 1 && "Necesita mejoras 😞"}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rating-comment">
                  Comentario adicional (opcional)
                </Label>
                <Textarea
                  id="rating-comment"
                  placeholder="Cuéntanos qué te gustó o qué podríamos mejorar..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                />
              </div>

              {rating >= 4 && (
                <div className="p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm text-center mb-3">
                    ¡Nos alegra que disfrutes la app! 
                    ¿Te gustaría calificarla en la tienda?
                  </p>
                  <Button
                    variant="outline"
                    onClick={openAppStore}
                    className="w-full"
                  >
                    Ir a la tienda
                  </Button>
                </div>
              )}
            </>
          )}

          {type === 'feedback' && (
            <div className="space-y-2">
              <Label htmlFor="feedback-comment">
                Cuéntanos tu opinión o sugerencia
              </Label>
              <Textarea
                id="feedback-comment"
                placeholder="Describe tu experiencia, reporta un problema o comparte una sugerencia..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              'Enviando...'
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
