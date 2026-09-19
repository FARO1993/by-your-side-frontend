/**
 * MOCK — "olvidé mi contraseña".
 * No hay endpoint de recovery. La UI muestra confirmación local.
 * Futuro: POST /api/auth/forgot-password.
 */
export function requestPasswordReset(_username: string): Promise<void> {
  return Promise.resolve();
}
