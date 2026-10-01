import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/themeContext';
import { IconButton } from './ui';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <IconButton
      // Etiqueta fija + aria-pressed: patrón de botón de alternancia accesible.
      label="Modo nocturno"
      aria-pressed={isDark}
      title={isDark ? 'Volver al tema claro' : 'Activar modo nocturno'}
      className={className}
      onClick={toggleTheme}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </IconButton>
  );
}
