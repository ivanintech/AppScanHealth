import React, { createContext, useContext, useEffect } from 'react';

type Theme = 'light';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  actualTheme: 'light';
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
  actualTheme: 'light',
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'vite-ui-theme',
  ...props
}: ThemeProviderProps) {
  
  useEffect(() => {
    const root = window.document.documentElement;
    // Always force light theme
    root.classList.remove('dark');
    root.classList.add('light');
  }, []);

  const value = {
    theme: 'light' as Theme,
    setTheme: () => {
      // Theme is always light, no-op
    },
    actualTheme: 'light' as const,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
