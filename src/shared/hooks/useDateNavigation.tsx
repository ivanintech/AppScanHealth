import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/supabase/client';

interface DateInfo {
  date: Date;
  dayName: string;
  dayShort: string;
  dayNumber: number;
  isToday: boolean;
  isSelected: boolean;
  adherence?: 'high' | 'medium' | 'low' | 'no_history';
}

interface AdherenceData {
  day: string; // YYYY-MM-DD
  adherence_percentage: number | null;
}

export const useDateNavigation = () => {
  const [displayedDate, setDisplayedDate] = useState<Date>(new Date());
  const [weekDates, setWeekDates] = useState<DateInfo[]>([]);
  const [adherence, setAdherence] = useState<Record<string, 'high' | 'medium' | 'low' | 'no_history'>>({});

  const fetchAdherence = useCallback(async (startDate: Date) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const startDateString = startDate.toISOString().split('T')[0];
      
      const { data, error } = await supabase.rpc('get_weekly_adherence', {
        p_user_id: user.user.id,
        p_start_date: startDateString
      });

      if (error) throw error;
      
      const adherenceMap: Record<string, 'high' | 'medium' | 'low' | 'no_history'> = {};
      (data as AdherenceData[]).forEach(item => {
        let level: 'high' | 'medium' | 'low' | 'no_history';
        if (item.adherence_percentage === null) {
          level = 'no_history';
        } else if (item.adherence_percentage >= 80) {
          level = 'high';
        } else if (item.adherence_percentage >= 40) {
          level = 'medium';
        } else {
          level = 'low';
        }
        adherenceMap[item.day] = level;
      });
      setAdherence(adherenceMap);

    } catch (error) {
      console.error("Error fetching weekly adherence:", error);
    }
  }, []);

  const getWeekDates = useCallback((baseDate: Date) => {
    const dates: DateInfo[] = [];
    const startOfWeek = new Date(baseDate);
    
    // Get Monday of the current week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    // Solo hacer fetch de adherencia si es necesario (debounce)
    const weekKey = startOfWeek.toISOString().split('T')[0];
    if (!adherence[weekKey]) {
      fetchAdherence(startOfWeek);
    }

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayShorts = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = currentDate.toDateString() === displayedDate.toDateString();
      const dateString = currentDate.toISOString().split('T')[0];

      dates.push({
        date: currentDate,
        dayName: dayNames[i],
        dayShort: dayShorts[i],
        dayNumber: currentDate.getDate(),
        isToday,
        isSelected,
        adherence: adherence[dateString]
      });
    }

    return dates;
  }, [displayedDate, adherence, fetchAdherence]);

  const formatCurrentDate = () => {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    
    const today = new Date();
    const day = today.getDate();
    const month = months[today.getMonth()];
    
    return `Hoy, ${day} de ${month}`;
  };

  useEffect(() => {
    const dates = getWeekDates(displayedDate);
    setWeekDates(dates);
  }, [displayedDate, getWeekDates]);

  const selectDate = (date: Date) => {
    setDisplayedDate(date);
  };

  const goToToday = () => {
    setDisplayedDate(new Date());
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(displayedDate);
    newDate.setDate(displayedDate.getDate() - 7);
    setDisplayedDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(displayedDate);
    newDate.setDate(displayedDate.getDate() + 7);
    setDisplayedDate(newDate);
  };

  const getMonthYear = () => {
     const month = displayedDate.toLocaleString('es-ES', { month: 'long' });
     const year = displayedDate.getFullYear();
     return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }

  return {
    selectedDate: displayedDate,
    weekDates,
    selectDate,
    goToToday,
    goToPreviousWeek,
    goToNextWeek,
    monthYear: getMonthYear(),
    formatCurrentDate: formatCurrentDate(),
    setSelectedDate: setDisplayedDate
  };
};
