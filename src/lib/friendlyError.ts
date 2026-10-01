import { OFFLINE_MESSAGE, readApiError } from '../auth/apiError';

/**
 * Mensaje de error para mostrar al usuario después de una acción.
 *
 * El backend responde mensajes técnicos en inglés ("displayName cannot be
 * blank", "You cannot…"): NUNCA se muestran tal cual. Acá se traducen los
 * casos comunes a un texto cálido en español; el resto usa `fallback`.
 */
export function friendlyError(error: unknown, fallback: string): string {
  const api = readApiError(error);
  if (api.offline) return OFFLINE_MESSAGE;
  if (api.status === 429) return 'Fueron muchos intentos seguidos. Esperá un momento y probá de nuevo.';
  if (api.status === 404) return 'Esto ya no está disponible.';
  return fallback;
}
