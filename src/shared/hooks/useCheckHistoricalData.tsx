import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/supabase/client';

interface HistoricalDataCheck {
  wellness_scores_count: number;
  wellness_scores_dates: Array<{ date: string; score: number }>;
  supplement_logs_count: number;
  supplement_logs_dates: string[];
  date_range: {
    earliest_wellness: string;
    latest_wellness: string;
    earliest_logs: string;
    latest_logs: string;
  };
}

export const useCheckHistoricalData = () => {
  const fetchHistoricalData = async (): Promise<HistoricalDataCheck | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any).rpc('check_all_historical_data', {
        p_user_id: user.id,
      });

      if (error) {
        console.error('[Check] Error fetching historical data:', error);
        return null;
      }
      return data as HistoricalDataCheck;
    } catch (error) {
      console.error('[Check] Error in fetchHistoricalData:', error);
      return null;
    }
  };

  return useQuery({
    queryKey: ['checkHistoricalData'],
    queryFn: fetchHistoricalData,
    staleTime: 0, // Always refetch for debug
    refetchOnWindowFocus: false,
  });
};
