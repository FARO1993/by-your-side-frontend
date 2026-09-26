/**
 * Nombre para el saludo del Home. No modifica el perfil guardado.
 * No hay firstName en el contrato: si displayName tiene varias palabras,
 * se usa la primera. Si no hay displayName, se usa el username.
 */
export function greetingName(displayName?: string | null, username?: string | null): string {
  const preferred = displayName?.trim();
  const source = preferred || username?.trim() || '';
  if (!source) return '';
  const [first] = source.split(/\s+/);
  return first.replace(/[.,;:]+$/g, '');
}
