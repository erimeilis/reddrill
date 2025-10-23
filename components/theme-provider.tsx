'use client';

import { createContext, useContext, useEffect } from 'react';
import { useSettingsStore } from '@/lib/store/useSettingsStore';

type Theme = 'light' | 'dark';

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const { theme, setTheme: setStoreTheme, setInitialized } = useSettingsStore();

  // Initialize theme on mount
  useEffect(() => {
    setInitialized();
  }, [setInitialized]);

  const value = {
    theme,
    setTheme: setStoreTheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};