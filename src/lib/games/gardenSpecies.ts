import type { Species } from './garden';

export const SPECIES_META: Record<Species, { label: string; petal: string; center: string }> = {
  margarita: { label: 'Margarita', petal: 'oklch(0.97 0.01 90)', center: 'oklch(0.82 0.15 85)' },
  tulipan: { label: 'Tulipán', petal: 'oklch(0.7 0.14 25)', center: 'oklch(0.6 0.15 22)' },
  girasol: { label: 'Girasol', petal: 'oklch(0.84 0.15 88)', center: 'oklch(0.45 0.07 55)' },
  lavanda: { label: 'Lavanda', petal: 'oklch(0.68 0.11 300)', center: 'oklch(0.58 0.12 300)' },
  campanita: { label: 'Campanita', petal: 'oklch(0.7 0.1 245)', center: 'oklch(0.6 0.11 245)' },
};

export const STAGE_LABEL = ['semilla', 'brote', 'capullo', 'en flor'] as const;

/** "un girasol", "una margarita". */
export function speciesArticle(species: Species): 'un' | 'una' {
  return species === 'tulipan' || species === 'girasol' ? 'un' : 'una';
}
