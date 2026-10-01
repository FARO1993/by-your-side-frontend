/**
 * Respiración guiada: inhalar 4 · sostener 4 · exhalar 6, 4 ciclos (~1 min).
 * Exhalar más largo que inhalar ayuda a bajar la activación.
 */
export type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const BREATH_PATTERN: { phase: BreathPhase; seconds: number; label: string }[] = [
  { phase: 'inhale', seconds: 4, label: 'Inhalá' },
  { phase: 'hold', seconds: 4, label: 'Sostené' },
  { phase: 'exhale', seconds: 6, label: 'Exhalá despacio' },
];

export const BREATH_CYCLES = 4;
export const CYCLE_SECONDS = BREATH_PATTERN.reduce((total, step) => total + step.seconds, 0);
export const TOTAL_SECONDS = CYCLE_SECONDS * BREATH_CYCLES;

export type BreathState = {
  phase: BreathPhase;
  label: string;
  /** Segundos que faltan en esta fase (1..n). */
  remaining: number;
  /** Duración total de la fase, para animar. */
  phaseSeconds: number;
  /** Ciclo actual, empezando en 1. */
  cycle: number;
};

/** Estado del ejercicio a los `elapsed` segundos; null si ya terminó. */
export function breathStateAt(elapsed: number): BreathState | null {
  if (elapsed < 0 || elapsed >= TOTAL_SECONDS) return null;
  const cycle = Math.floor(elapsed / CYCLE_SECONDS) + 1;
  let offset = elapsed % CYCLE_SECONDS;
  for (const step of BREATH_PATTERN) {
    if (offset < step.seconds) {
      return { phase: step.phase, label: step.label, remaining: step.seconds - offset, phaseSeconds: step.seconds, cycle };
    }
    offset -= step.seconds;
  }
  return null;
}
