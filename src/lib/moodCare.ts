import type { StatusMood } from '../api/types';

/**
 * Una respuesta cuidada cuando alguien cuenta cómo llega: una o dos cosas
 * concretas que pueden ayudar, sin insistir. Nunca es automática ni
 * alarmista (las señales de crisis tienen su propio camino), se puede cerrar
 * con "Ahora no" y no vuelve a aparecer ese día para ese mismo ánimo.
 */
export type MoodCareAction = { label: string; to: string } | { label: string; breathe: true };

export type MoodCare = {
  title: string;
  body: string;
  actions: MoodCareAction[];
  /** Línea discreta hacia Ayuda (solo para los ánimos más pesados). */
  showHelp: boolean;
  tone: 'presence' | 'listening';
};

export const MOOD_CARE: Record<StatusMood, MoodCare> = {
  NEED_DISTRACTION: {
    title: '¿Querés despejarte un rato?',
    body: 'Juegos tranquilos, sin apuro y sin puntajes. Solo/a o con alguien.',
    actions: [
      { label: 'Jugar algo tranquilo', to: '/distraerme?jugar=solo' },
      { label: 'Jugar con alguien', to: '/distraerme/invitar' },
    ],
    showHelp: false,
    tone: 'listening',
  },
  DIFFICULT_DAY: {
    title: 'Un día difícil pesa',
    body: 'No hace falta resolverlo todo hoy. Si te sirve, podemos empezar por algo chiquito.',
    actions: [
      { label: 'Respirar un minuto', breathe: true },
      { label: 'Buscar compañía', to: '/companion' },
      { label: 'Soltar un pensamiento', to: '/distraerme/hojas' },
    ],
    showHelp: true,
    tone: 'presence',
  },
  NEED_TO_TALK: {
    title: 'Hablar ayuda',
    body: 'Hay personas de la comunidad disponibles para escucharte, sin juzgar.',
    actions: [
      { label: 'Encontrar a alguien que escuche', to: '/companion' },
      { label: 'Escribir sin nombre', to: '/anonimo' },
    ],
    showHelp: true,
    tone: 'presence',
  },
  WELL: {
    title: 'Qué bueno leerte así',
    body: 'Si hoy tenés un rato, quizás alguien necesita compañía.',
    actions: [{ label: 'Estar disponible', to: '/companion' }],
    showHelp: false,
    tone: 'listening',
  },
  HERE_FOR_SOMEONE: {
    title: 'Gracias por estar',
    body: 'Acompañar también cansa: está bien poner límites y descansar.',
    actions: [{ label: 'Ver quién busca compañía', to: '/companion' }],
    showHelp: false,
    tone: 'listening',
  },
};

/** Día local (YYYY-MM-DD): "hoy" es el de la persona, no el del servidor. */
export function localDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const key = (userId: string) => `byyourside.moodCare.v1.${userId}`;

export const moodCareStorage = {
  /** Si ya cerró la tarjeta hoy para ese ánimo. */
  isDismissed(userId: string, mood: StatusMood, now = new Date()): boolean {
    try {
      const raw = localStorage.getItem(key(userId));
      if (!raw) return false;
      const saved = JSON.parse(raw) as { day?: string; moods?: string[] };
      return saved.day === localDay(now) && Array.isArray(saved.moods) && saved.moods.includes(mood);
    } catch {
      return false;
    }
  },
  dismiss(userId: string, mood: StatusMood, now = new Date()): void {
    try {
      const day = localDay(now);
      const raw = localStorage.getItem(key(userId));
      const saved = raw ? (JSON.parse(raw) as { day?: string; moods?: string[] }) : {};
      const moods = saved.day === day && Array.isArray(saved.moods) ? saved.moods : [];
      localStorage.setItem(key(userId), JSON.stringify({ day, moods: [...new Set([...moods, mood])] }));
    } catch {
      // Sin almacenamiento: se cierra igual en esta visita.
    }
  },
};
