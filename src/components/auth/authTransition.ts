/**
 * Breve espera entre el éxito de login/register y AnimatedWelcome.
 * La duración coincide con auth-screen.css (--auth-transition / reduced).
 * El logo no consulta este módulo: su reduced-motion vive solo en CSS.
 */

export const AUTH_TRANSITION_MS = 420;
export const AUTH_TRANSITION_REDUCED_MS = 160;

type Listener = () => void;

const listeners = new Set<Listener>();
let armed = false;

function emit(): void {
  listeners.forEach((listener) => listener());
}

export function prefersReducedAuthMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function authTransitionMs(): number {
  return prefersReducedAuthMotion() ? AUTH_TRANSITION_REDUCED_MS : AUTH_TRANSITION_MS;
}

export function armAuthTransition(): void {
  if (armed) return;
  armed = true;
  emit();
}

export function disarmAuthTransition(): void {
  if (!armed) return;
  armed = false;
  emit();
}

export function getAuthTransitionArmed(): boolean {
  return armed;
}

export function subscribeAuthTransition(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function resetAuthTransition(): void {
  armed = false;
}
