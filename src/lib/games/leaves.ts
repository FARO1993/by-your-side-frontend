/**
 * Hojas en el río: escribir un pensamiento, ponerlo en una hoja y verla irse
 * con la corriente. Basado en el ejercicio de mindfulness "leaves on a
 * stream": no se trata de pelear con el pensamiento ni de resolverlo, sino de
 * notarlo y dejarlo pasar.
 *
 * Privacidad: el texto vive solo en memoria mientras la hoja flota. No se
 * guarda (ni como borrador), no se envía y no se registra.
 */
export const LEAF_MAX_CHARS = 140;
/** Lo que tarda una hoja en cruzar el río. */
export const LEAF_FLOAT_MS = 16000;
export const LEAF_LANES = 3;

export type Leaf = { id: number; text: string; lane: number };

/** Normaliza el texto; null si no queda nada para soltar. */
export function leafText(raw: string): string | null {
  const text = raw.replace(/\s+/g, ' ').trim().slice(0, LEAF_MAX_CHARS);
  return text === '' ? null : text;
}

/** Va alternando carriles para que dos hojas seguidas no se encimen. */
export function nextLane(previous: number | null): number {
  return previous === null ? 1 : (previous + 1) % LEAF_LANES;
}
