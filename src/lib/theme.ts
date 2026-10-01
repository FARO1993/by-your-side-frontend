/**
 * Tema claro / nocturno.
 *
 * - La preferencia del usuario ('light' | 'dark') vive en localStorage.
 * - Si no eligió nada, seguimos al sistema (prefers-color-scheme).
 * - El tema resuelto se aplica como `data-theme` en <html>; los tokens de
 *   color de index.css cambian según ese atributo.
 *
 * index.html aplica el tema antes del primer render (script inline) para
 * evitar el destello claro al abrir la app de noche. Mantener la misma
 * clave y lógica en ambos lugares.
 */

export type ResolvedTheme = 'light' | 'dark';
export type ThemePreference = ResolvedTheme | 'system';

export const THEME_STORAGE_KEY = 'bys-theme';

const DARK_QUERY = '(prefers-color-scheme: dark)';

// Colores de la barra del navegador en mobile (= --background de cada tema).
const THEME_COLOR: Record<ResolvedTheme, string> = {
  light: '#fbf6f1',
  dark: '#14161c',
};

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function writeThemePreference(preference: ThemePreference): void {
  try {
    if (preference === 'system') localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Sin storage (modo privado, etc.): el tema dura solo esta sesión.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false;
}

export function resolveTheme(preference: ThemePreference, prefersDark = systemPrefersDark()): ResolvedTheme {
  if (preference === 'system') return prefersDark ? 'dark' : 'light';
  return preference;
}

export function applyTheme(theme: ResolvedTheme): void {
  const root = document.documentElement;
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = THEME_COLOR[theme];
}

/** Se suscribe a cambios del tema del sistema. Devuelve la función de limpieza. */
export function onSystemThemeChange(listener: (prefersDark: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(DARK_QUERY);
  const handler = (event: MediaQueryListEvent) => listener(event.matches);
  media.addEventListener('change', handler);
  return () => media.removeEventListener('change', handler);
}
