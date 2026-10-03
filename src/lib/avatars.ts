/**
 * Avatares ilustrados de ByYourSide. En una red de salud mental no se suben
 * fotos: identifican a la persona, pueden ser inapropiadas y hay que
 * moderarlas. Son motivos de naturaleza, sin caras: nadie tiene que elegir
 * un aspecto que lo represente (o que no).
 *
 * El listado tiene que coincidir con AvatarCatalog del backend.
 */
export const AVATAR_IDS = [
  'hoja',
  'luna',
  'sol',
  'ola',
  'montana',
  'flor',
  'nube',
  'estrella',
  'arbol',
  'gota',
  'piedras',
  'pluma',
  'caracola',
  'hongo',
  'cactus',
  'arcoiris',
  'brote',
  'faro',
] as const;

export type AvatarId = (typeof AVATAR_IDS)[number];

export const AVATAR_LABELS: Record<AvatarId, string> = {
  hoja: 'Hoja',
  luna: 'Luna',
  sol: 'Sol',
  ola: 'Ola',
  montana: 'Montaña',
  flor: 'Flor',
  nube: 'Nube',
  estrella: 'Estrella',
  arbol: 'Árbol',
  gota: 'Gota',
  piedras: 'Piedras',
  pluma: 'Pluma',
  caracola: 'Caracola',
  hongo: 'Hongo',
  cactus: 'Cactus',
  arcoiris: 'Arcoíris',
  brote: 'Brote',
  faro: 'Faro',
};

export function isAvatarId(value: string | null | undefined): value is AvatarId {
  return typeof value === 'string' && (AVATAR_IDS as readonly string[]).includes(value);
}
