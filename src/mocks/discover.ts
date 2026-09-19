/**
 * MOCK — Temas de Discover.
 * Motivo: el backend solo expone GET /api/users/discover (personas).
 * No hay endpoint de topics ni búsqueda.
 * UI: label, description, tone, posts.
 * Futuro: GET /api/discover/topics (sugerido). Reemplazar getDiscoverTopics().
 */
export type DiscoverTopic = {
  id: string;
  label: string;
  description: string;
  tone: 'presence' | 'listening';
  posts: number;
};

export const DISCOVER_TOPICS: DiscoverTopic[] = [
  {
    id: 'company',
    label: 'Compañía silenciosa',
    description: 'Estar al lado, sin apuro de resolver nada.',
    tone: 'presence',
    posts: 24,
  },
  {
    id: 'listen',
    label: 'Necesito que me lean',
    description: 'Espacio para contar y ser escuchado/a.',
    tone: 'listening',
    posts: 18,
  },
  {
    id: 'heavy',
    label: 'Días pesados',
    description: 'Cuando el cuerpo pide contención.',
    tone: 'presence',
    posts: 31,
  },
  {
    id: 'breathe',
    label: 'Respirar un rato',
    description: 'Distracción suave y presencia liviana.',
    tone: 'listening',
    posts: 12,
  },
];

export function getDiscoverTopics(): DiscoverTopic[] {
  return DISCOVER_TOPICS;
}

export function searchDiscoverTopics(query: string): DiscoverTopic[] {
  const q = query.trim().toLowerCase();
  if (!q) return DISCOVER_TOPICS;
  return DISCOVER_TOPICS.filter(
    (topic) =>
      topic.label.toLowerCase().includes(q) || topic.description.toLowerCase().includes(q),
  );
}
