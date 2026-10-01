import { createContext, useContext } from 'react';
import type { ResolvedTheme, ThemePreference } from '../lib/theme';

export type ThemeContextValue = {
  /** Tema aplicado ahora mismo. */
  theme: ResolvedTheme;
  /** Lo que eligió el usuario ('system' si nunca eligió). */
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
  /** Alterna entre claro y nocturno y recuerda la elección. */
  toggleTheme: () => void;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return context;
}
