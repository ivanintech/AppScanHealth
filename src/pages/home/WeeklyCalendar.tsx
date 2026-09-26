import React from "react";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/utils";
import { useDateNavigation } from "@/shared/hooks/useDateNavigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useCallback, useState } from "react";

// Componente para círculo de progreso con borde parcial
const ProgressCircle = ({ 
  percentage, 
  isSelected, 
  isToday, 
  dayNumber, 
  onClick,
  isFuture = false
}: { 
  percentage: number; 
  isSelected: boolean; 
  isToday: boolean; 
  dayNumber: number; 
  onClick: () => void;
  isFuture?: boolean;
}) => {
  const circumference = 2 * Math.PI * 18; // radio de 18px
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Calcular color basado en el porcentaje (rojo a verde)
  const getProgressColor = (percent: number) => {
    if (percent === 0) return '#e5e7eb'; // gris para 0%
    
    // Interpolación de rojo a verde
    const red = Math.max(0, 255 - (percent / 100) * 255);
    const green = Math.min(255, (percent / 100) * 255);
    const blue = 0;
    
    return `rgb(${Math.round(red)}, ${Math.round(green)}, ${Math.round(blue)})`;
  };

  const progressColor = getProgressColor(percentage);

  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-10 h-10 absolute inset-0" viewBox="0 0 40 40">
        {/* Círculo de fondo */}
        <circle
          cx="20"
          cy="20"
          r="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-gray-300"
        />
        {/* Círculo de progreso con gradiente de rojo a verde */}
        {percentage > 0 && (
          <circle
            cx="20"
            cy="20"
            r="18"
            fill="none"
            stroke={progressColor}
            strokeWidth="2"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '20px 20px'
            }}
          />
        )}
      </svg>
      <Button
        variant="ghost"
        size="icon"
        disabled={isFuture}
        className={cn(
          "relative w-10 h-10 rounded-full text-sm font-bold transition-all duration-300",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "text-foreground",
          isFuture && "opacity-50 cursor-not-allowed",
          !isFuture && "hover:bg-muted/50"
        )}
        onClick={isFuture ? undefined : onClick}
      >
        {dayNumber}
        {isToday && !isSelected && (
          <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
        )}
      </Button>
    </div>
  );
};

interface AdherenceData {
  log_date?: string;
  adherence_percentage?: number;
  date?: string;
  adherence?: number;
}

interface WeeklyCalendarProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  disablePastDays?: boolean;
  adherenceData?: AdherenceData[];
}

export const WeeklyCalendar = ({
  selectedDate,
  onDateSelect,
  disablePastDays = false,
  adherenceData = []
}: WeeklyCalendarProps) => {
  // Estado interno para la navegación de semanas (sin afectar los datos del dashboard)
  const [displayedWeek, setDisplayedWeek] = useState<Date>(selectedDate);
  
  // Calcular las fechas de la semana basándose en displayedWeek
  const getWeekDates = (baseDate: Date) => {
    const dates = [];
    const startOfWeek = new Date(baseDate);
    
    // Get Monday of the current week
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const dayShorts = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      
      const isToday = currentDate.toDateString() === today.toDateString();
      const isSelected = currentDate.toDateString() === selectedDate.toDateString();
      const isFuture = currentDate > today;
      
      dates.push({
        date: currentDate,
        dayName: dayNames[i],
        dayShort: dayShorts[i],
        dayNumber: currentDate.getDate(),
        isToday,
        isSelected,
        isFuture
      });
    }
    
    return dates;
  };

  const weekDates = getWeekDates(displayedWeek);
  // El header siempre debe mostrar la fecha del día seleccionado, no la semana navegada
  const monthYear = selectedDate.toLocaleDateString('es-ES', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  // Sincronizar displayedWeek cuando cambie selectedDate desde el padre
  useEffect(() => {
    setDisplayedWeek(selectedDate);
  }, [selectedDate]);

  // Sincronización de fechas
  useEffect(() => {
    // Solo log si hay cambios significativos
    if (adherenceData.length > 0) {
      console.log('📅 [WeeklyCalendar] Data loaded:', adherenceData.length, 'records');
    }
  }, [adherenceData]);

  const handleDateSelect = (date: Date) => {
    // Notificar al padre para que actualice el estado global
    onDateSelect(date);
  };

  // Manejar navegación de semana (solo actualiza la vista, no los datos)
  const handlePreviousWeek = () => {
    const newDate = new Date(displayedWeek);
    newDate.setDate(newDate.getDate() - 7);
    setDisplayedWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(displayedWeek);
    newDate.setDate(newDate.getDate() + 7);
    setDisplayedWeek(newDate);
  };

  const getAdherenceStatus = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);
    
    // Si es un día futuro, siempre es 'future'
    if (dateOnly > today) {
      return 'future';
    }
    
    const dateString = date.toISOString().split('T')[0];
    const data = adherenceData.find(d => d.log_date === dateString);
    
    // Si es un día pasado pero no hay datos, es 'no_data'
    if (!data) {
      return 'no_data';
    }
    
    const percentage = data.adherence_percentage;
    
    if (percentage >= 80) return 'high';
    if (percentage >= 35) return 'medium';
    if (percentage > 0) return 'low';
    return 'zero'; // Stack > 0 pero adherencia 0%
  }, [adherenceData]);

  const getAdherencePercentage = useCallback((date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Buscar datos que coincidan con la fecha (manejar diferentes formatos)
    const data = adherenceData.find(d => {
      // Formato 1: {log_date: "2025-09-29T00:00:00+00:00", adherence_percentage: 22.22}
      if (d.log_date) {
        const logDate = d.log_date.split('T')[0];
        return logDate === dateString;
      }
      // Formato 2: {date: "2025-09-29", adherence: 22.22}
      if (d.date) {
        return d.date === dateString;
      }
      return false;
    });
    
    // Obtener el porcentaje según el formato
    const percentage = data?.adherence_percentage || data?.adherence || 0;
    
    return percentage;
  }, [adherenceData]);

  return (
    <div className="mx-0 my-0 px-0 py-0">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h3 className="text-base font-semibold text-foreground tracking-tight">{monthYear}</h3>
        <div className="flex items-center gap-1">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={handlePreviousWeek} 
              variant="ghost" 
              size="icon" 
              className="w-7 h-7 rounded-lg transition-all duration-200 hover:bg-muted"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <Button 
              onClick={handleNextWeek} 
              variant="ghost" 
              size="icon" 
              className="w-7 h-7 rounded-lg transition-all duration-200 hover:bg-muted"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Week View */}
      <div className="relative flex justify-between gap-1 animate-fade-in">
        <AnimatePresence mode="wait">
          <motion.div
            key={weekDates[0]?.date.toISOString() || 'week'}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex justify-between gap-1 w-full"
          >
            {weekDates.map((dayInfo, index) => (
              <motion.div
                key={dayInfo.date.toISOString()}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05, duration: 0.2, ease: "easeOut" }}
                className="flex-1 flex flex-col items-center"
              >
                <span className={cn(
                  "text-xs mb-2",
                  dayInfo.isSelected ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {dayInfo.dayShort}
                </span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <ProgressCircle
                    percentage={getAdherencePercentage(dayInfo.date)}
                    isSelected={dayInfo.isSelected}
                    isToday={dayInfo.isToday}
                    dayNumber={dayInfo.dayNumber}
                    isFuture={dayInfo.isFuture}
                    onClick={() => handleDateSelect(dayInfo.date)}
                  />
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
