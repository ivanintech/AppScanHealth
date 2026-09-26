import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getHealthGoalClasses = (goal: string) => {
  const normalizedGoal = goal.toLowerCase();
  switch (normalizedGoal) {
    case 'fuerza':
    case 'músculo':
    case 'rendimiento':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    case 'energía':
    case 'cognición':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'inmunidad':
    case 'salud general':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'sueño':
    case 'relajación':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300';
    case 'salud articular':
    case 'salud ósea':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
    case 'belleza':
    case 'piel':
      return 'bg-pink-100 text-pink-800 dark:bg-pink-900/40 dark:text-pink-300';
    case 'salud cardiovascular':
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

import { Flame, Calendar, Zap, BarChart, Target, User, Shield, BookOpen, Star, Trophy, GitCommit, PlusCircle, PenSquare, FileText, CalendarCheck, Crown, ShieldCheck, Microscope, Puzzle, BrainCircuit, Users, HeartPulse, Bone, Gem } from 'lucide-react';

export const getAchievementIconByName = (name: string) => {
  const lowerName = name.toLowerCase();

  // Streaks
  if (lowerName.includes('racha')) return Flame;
  if (lowerName.includes('perfecto')) return Star;
  if (lowerName.includes('constancia')) return CalendarCheck;
  
  // Onboarding & Profile
  if (lowerName.includes('primer paso') || lowerName.includes('primer registro')) return FileText;
  if (lowerName.includes('perfil completo')) return User;
  if (lowerName.includes('mi primer stack')) return PlusCircle;
  
  // Exploration & Collection
  if (lowerName.includes('explorador') || lowerName.includes('coleccionista')) return Gem;
  if (lowerName.includes('escáner pro')) return Zap;
  
  // Knowledge & Analysis
  if (lowerName.includes('analista de stack')) return Microscope;
  if (lowerName.includes('lector curioso') || lowerName.includes('gurú')) return BookOpen;
  
  // Mastery & Top Tier
  if (lowerName.includes('maestro')) return Crown;
  if (lowerName.includes('leyenda')) return Trophy;
  
  // Health Specific
  if (lowerName.includes('bienestar total')) return ShieldCheck;
  if (lowerName.includes('experto en suplementos')) return BrainCircuit;

  // Fallback default
  return Target;
};

// Funciones para parsear datos de productos
export const parseStringArray = (str: string | null | undefined): string[] => {
  if (!str) return [];
  try {
    // Si es un string que parece JSON array, parsearlo
    if (str.startsWith('[') && str.endsWith(']')) {
      return JSON.parse(str);
    }
    // Si es un string simple, devolverlo como array
    return [str];
  } catch {
    return [str];
  }
};

export const extractCleanText = (tag: string): string => {
  if (!tag) return '';
  // Extraer el texto después del último ':'
  const parts = tag.split(':');
  return parts[parts.length - 1] || tag;
};

export const getBrandFromTags = (brandsTags: string | null | undefined): string => {
  const brands = parseStringArray(brandsTags);
  if (brands.length === 0) return 'Sin marca';
  
  // Tomar el primer brand y limpiarlo
  const firstBrand = extractCleanText(brands[0]);
  return firstBrand.charAt(0).toUpperCase() + firstBrand.slice(1);
};

export const getCategoryFromTags = (categoriesTags: string | null | undefined): string => {
  const categories = parseStringArray(categoriesTags);
  if (categories.length === 0) return 'Sin categoría';
  
  // Buscar categorías relevantes para suplementos
  const supplementCategories = categories.filter(cat => 
    cat.includes('supplement') || 
    cat.includes('vitamin') || 
    cat.includes('dietary') ||
    cat.includes('health')
  );
  
  if (supplementCategories.length > 0) {
    return extractCleanText(supplementCategories[0]);
  }
  
  // Si no hay categorías de suplementos, tomar la primera
  return extractCleanText(categories[0]);
};

export const getLabelsFromTags = (labelsTags: string | null | undefined): string[] => {
  const labels = parseStringArray(labelsTags);
  return labels.map(extractCleanText).filter(label => 
    label && !label.includes('en:') && !label.includes('xx:')
  );
};

export const getScoreColor = (score: number | null | undefined): string => {
  if (!score) return 'text-gray-500';
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-yellow-600';
  if (score >= 2) return 'text-orange-600';
  return 'text-red-600';
};

export const getScoreLabel = (score: number | null | undefined): string => {
  if (!score) return 'Sin puntuación';
  if (score >= 4) return 'Excelente';
  if (score >= 3) return 'Bueno';
  if (score >= 2) return 'Regular';
  return 'Bajo';
};

export const formatProductInfo = (product: any) => {
  const brand = getBrandFromTags(product.brands_tags);
  const category = getCategoryFromTags(product.categories_tags);
  const labels = getLabelsFromTags(product.labels_tags);
  const score = product.calculated_score;
  
  return {
    brand,
    category,
    labels,
    score,
    scoreColor: getScoreColor(score),
    scoreLabel: getScoreLabel(score),
    hasLabels: labels.length > 0,
    isSupplement: category.toLowerCase().includes('supplement') || 
                  category.toLowerCase().includes('vitamin') ||
                  category.toLowerCase().includes('dietary')
  };
};
