import { Star, MessageCircle, ThumbsUp } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { Progress } from "@/shared/components/ui/progress";
import { supabase } from "@/shared/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { ReviewForm } from "./ReviewForm";

interface Review {
  id: number;
  product_id: string;
  user_id: string | null;
  rating: number;
  title: string | null;
  comment: string | null;
  created_at: string;
  profiles: {
    username: string | null;
    avatar_url: string | null;
  } | null;
}

interface ReviewsProps {
  supplementEan: string;
  supplementName: string;
}

export const Reviews = ({ supplementEan, supplementName }: ReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState(0);
  const [ratingCounts, setRatingCounts] = useState<{ [key: number]: number }>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select(`
          *,
          profiles (username, avatar_url)
        `)
        .eq("product_id", supplementEan)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching reviews:", error);
      } else if (data) {
        setReviews(data as Review[]);
        
        if (data.length > 0) {
          const totalRating = data.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(totalRating / data.length);

          const counts = data.reduce((acc, review) => {
            acc[review.rating]++;
            return acc;
          }, { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
          setRatingCounts(counts);
        }
      }
      setLoading(false);
  }, [supplementEan]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const StarRating = ({ rating, className = "" }: { rating: number; className?: string }) => (
    <div className={`flex items-center gap-0.5 ${className}`}>
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse bg-card rounded-lg p-4 border border-border h-24"></div>
        <div className="animate-pulse bg-card rounded-lg p-4 border border-border h-32"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-foreground">Opiniones de la Comunidad</h3>
          <ReviewForm 
            supplementEan={supplementEan} 
            supplementName={supplementName}
            onReviewSubmit={fetchReviews}
          />
        </div>
        {reviews.length > 0 ? (
          <div className="flex flex-col md:flex-row items-start gap-6 bg-muted/30 p-4 rounded-lg">
            <div className="flex-shrink-0 text-center">
              <p className="text-4xl font-bold text-foreground">{averageRating.toFixed(1)}</p>
              <StarRating rating={averageRating} className="justify-center" />
              <p className="text-sm text-muted-foreground mt-1">Basado en {reviews.length} opiniones</p>
            </div>
            <div className="w-full flex-1">
              {[5, 4, 3, 2, 1].map(star => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-6">{star} ★</span>
                  <Progress 
                    value={(ratingCounts[star] / reviews.length) * 100} 
                    className="h-2" 
                    indicatorClassName={star >= 4 ? "bg-green-500" : star >= 3 ? "bg-yellow-500" : "bg-red-500"} 
                  />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {((ratingCounts[star] / reviews.length) * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 px-4 bg-muted/30 rounded-lg">
            <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-semibold text-foreground">Aún no hay opiniones</h4>
            <p className="text-sm text-muted-foreground">Sé el primero en compartir tu experiencia con {supplementName}.</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {reviews.map(review => (
          <div key={review.id} className="border-b pb-6 last:border-b-0">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={review.profiles?.avatar_url || undefined} />
                <AvatarFallback>{review.profiles?.username?.charAt(0) || 'A'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-semibold text-foreground">{review.profiles?.username || "Anónimo"}</p>
                <StarRating rating={review.rating} />
              </div>
              <span className="text-xs text-muted-foreground ml-auto">{new Date(review.created_at).toLocaleDateString()}</span>
            </div>
            {review.title && <h5 className="font-semibold text-foreground mb-1">{review.title}</h5>}
            <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>
            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" size="sm" className="flex items-center gap-2 text-muted-foreground hover:text-primary">
                <ThumbsUp className="w-4 h-4" />
                <span>Útil</span>
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
