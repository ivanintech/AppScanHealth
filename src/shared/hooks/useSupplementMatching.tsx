import { useState, useEffect } from 'react';
import { SupplementMatchingService, SupplementFeedback } from '../components/recommendations/SupplementMatchingService';
import { SupplementFeedbackService, StoredFeedback } from '../components/recommendations/SupplementFeedbackService';
import { UserProfile } from '../types';

export interface UseSupplementMatchingReturn {
  feedback: StoredFeedback | null;
  loading: boolean;
  error: string | null;
  refreshFeedback: () => Promise<void>;
  updateFeedbackStatus: (status: 'accepted' | 'rejected') => Promise<void>;
}

export const useSupplementMatching = (
  userId: string,
  supplementId: string
): UseSupplementMatchingReturn => {
  const [feedback, setFeedback] = useState<StoredFeedback | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const feedbackService = new SupplementFeedbackService();

  useEffect(() => {
    loadFeedback();
  }, [userId, supplementId]);

  const loadFeedback = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const feedbacks = await feedbackService.getSupplementFeedback(userId, supplementId);
      
      if (feedbacks.length > 0) {
        // Obtener el feedback más reciente
        const latestFeedback = feedbacks.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        setFeedback(latestFeedback);
      } else {
        setFeedback(null);
      }
    } catch (err) {
      setError('Error cargando feedback del suplemento');
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshFeedback = async () => {
    await loadFeedback();
  };

  const updateFeedbackStatus = async (status: 'accepted' | 'rejected') => {
    if (!feedback) return;

    try {
      const success = await feedbackService.updateFeedbackStatus(feedback.id, status);
      if (success) {
        await loadFeedback();
      }
    } catch (err) {
      console.error('Error updating feedback status:', err);
    }
  };

  return {
    feedback,
    loading,
    error,
    refreshFeedback,
    updateFeedbackStatus
  };
};

export const useSupplementMatchingForUser = (
  userProfile: UserProfile,
  healthAnalysis: any[]
) => {
  const [matches, setMatches] = useState<SupplementFeedback[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const matchingService = new SupplementMatchingService();
  const feedbackService = new SupplementFeedbackService();

  const processMatching = async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener matches
      const supplementMatches = await matchingService.matchSupplementsWithUserProfile(
        userProfile,
        healthAnalysis
      );

      setMatches(supplementMatches);

      // Almacenar feedback para suplementos útiles
      for (const match of supplementMatches) {
        if (match.isUseful && match.utilityScore > 50) {
          await feedbackService.storeSupplementFeedback(
            userProfile.id || 'anonymous',
            match
          );
        }
      }

    } catch (err) {
      setError('Error procesando matching de suplementos');
      console.error('Error processing supplement matching:', err);
    } finally {
      setLoading(false);
    }
  };

  return {
    matches,
    loading,
    error,
    processMatching
  };
};
