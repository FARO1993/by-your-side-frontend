export const PUZZLE_SCENES = [
  { id: 'lago', title: 'Lago al atardecer' },
  { id: 'noche', title: 'Noche de campo' },
  { id: 'jardin', title: 'Jardín en flor' },
] as const;

export type PuzzleSceneId = (typeof PUZZLE_SCENES)[number]['id'];
