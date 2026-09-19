import type { StatusMood } from '../api/types';

export type MoodTone = 'steady' | 'reaching' | 'heavy' | 'tender';
export type ResponseKind = 'presence' | 'listening';

export type ResponseOption = {
  id: string;
  label: string;
  kind: ResponseKind;
  intent: string;
};

export const RESPONSE_OPTIONS: ResponseOption[] = [
  { id: 'with-you', label: 'Estoy con vos', kind: 'presence', intent: 'Estoy de tu lado' },
  { id: 'not-alone', label: 'No estás solo/a', kind: 'presence', intent: 'No estás solo/a' },
  { id: 'holding', label: 'Te abrazo', kind: 'presence', intent: 'Te abrazo desde acá' },
  { id: 'reading', label: 'Te leo', kind: 'listening', intent: 'Te leo con calma' },
  { id: 'tell-more', label: 'Contame más', kind: 'listening', intent: 'Podés contarme más' },
  { id: 'listening', label: 'Estoy escuchando', kind: 'listening', intent: 'Estoy escuchando' },
];

// Mismo patrón visual que RESPONSE_OPTIONS (dos filas Presencia/Escucha),
// pero mapeado a StatusReactionType real (src/api/statuses.ts), no a un post.
export const STATUS_RESPONSE_OPTIONS: ResponseOption[] = [
  { id: 'with-you', label: 'Estoy con vos', kind: 'presence', intent: 'Estoy de tu lado' },
  { id: 'not-alone', label: 'No estás solo/a', kind: 'presence', intent: 'No estás solo/a' },
  { id: 'reading', label: 'Te leo', kind: 'listening', intent: 'Te leo con calma' },
  { id: 'tell-more', label: '¿Querés hablar?', kind: 'listening', intent: 'Podés contarme más' },
];

export const MOOD_TONE_STYLES: Record<MoodTone, { chip: string; dot: string }> = {
  steady: {
    chip: 'bg-listening-soft text-listening-strong ring-listening/25',
    dot: 'bg-listening',
  },
  reaching: {
    chip: 'bg-listening-soft text-listening-strong ring-listening/25',
    dot: 'bg-listening',
  },
  heavy: {
    chip: 'bg-presence-soft text-presence-strong ring-presence/25',
    dot: 'bg-presence',
  },
  tender: {
    chip: 'bg-presence-soft text-presence-strong ring-presence/25',
    dot: 'bg-presence',
  },
};

export const STATUS_MOOD_UI: Record<StatusMood, { label: string; tone: MoodTone }> = {
  WELL: { label: 'Estoy bien', tone: 'steady' },
  NEED_DISTRACTION: { label: 'Necesito distraerme', tone: 'reaching' },
  DIFFICULT_DAY: { label: 'Día difícil', tone: 'heavy' },
  NEED_TO_TALK: { label: 'Necesito hablar', tone: 'tender' },
  HERE_FOR_SOMEONE: { label: 'Estoy acá para alguien', tone: 'steady' },
};

// steady/reaching -> listening, heavy/tender -> presence (mismo criterio que HANDOFF §5.3 para el Badge de perfil)
export function moodToneToBadgeTone(tone: MoodTone): 'presence' | 'listening' {
  return tone === 'steady' || tone === 'reaching' ? 'listening' : 'presence';
}
