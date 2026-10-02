import {
  Cloud,
  Feather,
  Flower2,
  Leaf,
  Moon,
  Mountain,
  Sprout,
  Star,
  Sun,
  Waves,
  type LucideIcon,
} from 'lucide-react';

/** Símbolos de Memoria: íconos tranquilos en los tonos de Presencia y Escucha. */
export const MEMORY_SYMBOLS: Record<string, { label: string; icon: LucideIcon; tone: 'presence' | 'listening' }> = {
  luna: { label: 'Luna', icon: Moon, tone: 'listening' },
  sol: { label: 'Sol', icon: Sun, tone: 'presence' },
  hoja: { label: 'Hoja', icon: Leaf, tone: 'listening' },
  nube: { label: 'Nube', icon: Cloud, tone: 'listening' },
  olas: { label: 'Olas', icon: Waves, tone: 'listening' },
  estrella: { label: 'Estrella', icon: Star, tone: 'presence' },
  flor: { label: 'Flor', icon: Flower2, tone: 'presence' },
  pluma: { label: 'Pluma', icon: Feather, tone: 'presence' },
  montana: { label: 'Montaña', icon: Mountain, tone: 'listening' },
  brote: { label: 'Brote', icon: Sprout, tone: 'presence' },
};

/** Orden de símbolos con el que se arma el mazo (también usado por tests deterministas). */
export const MEMORY_SYMBOL_KEYS = Object.keys(MEMORY_SYMBOLS);

/** Tiempo que quedan a la vista dos cartas que no son pareja. */
export const MISMATCH_DELAY_MS = 1000;
