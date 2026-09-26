import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Textarea } from "@/shared/components/ui/textarea";
import { Input } from "@/shared/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/shared/components/ui/dialog";
import { supabase } from "@/shared/supabase/client";
import { useToast } from "@/shared/hooks/use-toast";

interface ReviewFormProps {
  supplementEan: string;
  supplementName: string;
  onReviewSubmit: () => void;
}

export const ReviewForm = ({ supplementEan, supplementName, onReviewSubmit }: ReviewFormProps) => {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (rating === 0 || !comment) {
      toast({
        title: "Campos requeridos",
        description: "Por favor, selecciona una calificación y escribe un comentario.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase.from("reviews").insert({
        product_id: supplementEan,
        user_id: user.id,
        rating,
        title,
        comment,
      });

      if (error) throw error;

      toast({
        title: "¡Gracias por tu opinión!",
        description: "Tu reseña ha sido publicada.",
      });
      
      onReviewSubmit();
      setOpen(false); // Close dialog
      // Reset form
      setRating(0);
      setTitle("");
      setComment("");

    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Error",
        description: "No se pudo enviar tu reseña. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Escribir una opinión</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tu opinión sobre {supplementName}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="text-center">
            <p className="text-sm font-medium mb-2">Tu calificación general</p>
            <div className="flex justify-center items-center gap-1">
              {[...Array(5)].map((_, i) => {
                const starValue = i + 1;
                return (
                  <Star
                    key={i}
                    className={`w-8 h-8 cursor-pointer transition-colors ${
                      starValue <= (hoverRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setRating(starValue)}
                    onMouseEnter={() => setHoverRating(starValue)}
                    onMouseLeave={() => setHoverRating(0)}
                  />
                );
              })}
            </div>
          </div>
          <div>
            <label htmlFor="title" className="text-sm font-medium">Añade un título</label>
            <Input 
              id="title" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué es lo más importante?" 
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="comment" className="text-sm font-medium">Añade una reseña escrita</label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te ha gustado y qué no? ¿Has notado resultados?"
              className="mt-1"
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? "Enviando..." : "Enviar opinión"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

