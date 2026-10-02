import { parseGarden, type GardenState } from './garden';

/**
 * El jardín vive en este dispositivo, separado por usuario. No es contenido
 * sensible (no tiene texto), así que no se borra al cerrar sesión: volver y
 * encontrarlo como estaba es parte de la idea.
 */
const PREFIX = 'byyourside.garden.v1.';

export function gardenKey(userId: string | null | undefined): string {
  return `${PREFIX}${userId ?? 'local'}`;
}

export function loadGarden(userId: string | null | undefined): GardenState | null {
  try {
    return parseGarden(window.localStorage.getItem(gardenKey(userId)));
  } catch {
    return null;
  }
}

export function saveGarden(userId: string | null | undefined, garden: GardenState): void {
  try {
    window.localStorage.setItem(gardenKey(userId), JSON.stringify(garden));
  } catch {
    // Sin almacenamiento (modo privado, cuota llena): el jardín funciona igual en esta visita.
  }
}
