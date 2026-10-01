/**
 * Detección suave de señales de crisis en texto (español rioplatense).
 *
 * Qué es y qué NO es:
 * - Es una lista de frases, no un diagnóstico. Puede fallar para los dos
 *   lados; por eso la UI solo INVITA a buscar ayuda, nunca bloquea ni acusa.
 * - Corre 100% en el dispositivo: el texto, el resultado y si se mostró un
 *   aviso NUNCA se envían al servidor ni se registran.
 * - No genera reportes automáticos (decisión de producto: solo la persona
 *   decide si reporta).
 *
 * Mantener la lista: agregar casos a crisisSignals.test.ts (tanto de riesgo
 * como expresiones cotidianas que NO deben disparar). Idealmente revisada por
 * alguien con formación clínica antes de producción.
 */

/** Minúsculas, sin tildes ni signos, espacios colapsados. */
export function normalizeForSignals(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Complementos que vuelven cotidiana una frase ("me muero de risa").
const EVERYDAY = '(?:de (?:risa|verguenza|hambre|sueno|amor|calor|frio|ganas|envidia|aburrimiento|la risa|los nervios|nervios|celos|ternura)|del (?:calor|frio|hambre|sueno|aburrimiento)|por (?:verte|ir|saber|probar))';

const SIGNALS: RegExp[] = [
  // Ideación suicida explícita
  /\bsuicid(?:arme|arse|io|a|ar)\b/,
  new RegExp(`\\b(?:me quiero|quiero|me voy a|voy a|me gustaria|ganas de) (?:morir|morirme)\\b(?! ${EVERYDAY})`),
  new RegExp(`\\b(?:me quiero|quiero|me voy a|voy a|ganas de) (?:matar|matarme)\\b(?! (?:${EVERYDAY}|\\w+(?:ando|iendo)\\b|a\\b|al\\b|con\\b))`),
  /\b(?:quitarme|sacarme) la vida\b/,
  /\b(?:terminar|acabar) con (?:mi vida|todo esto|todo de una vez)\b/,
  /\bno (?:quiero|puedo) (?:vivir|seguir viviendo|estar viv[oa]|existir)\b(?! (?:en|con|asi en|de esta forma en) )/,
  /\b(?:no tiene|no le veo|no le encuentro) sentido (?:seguir|vivir|a la vida|a vivir|a seguir|estar viv[oa])\b/,
  /\b(?:estarian|estaria|serian|seria) (?:todos )?mejor sin mi\b/,
  /\bojala no (?:despertar|despertarme|despierte|me despierte|existiera|hubiera nacido)\b/,
  /\b(?:no quiero|no quisiera) (?:despertar|despertarme)(?: nunca| mas)\b/,
  /\bquiero desaparecer para siempre\b/,
  /\bdespedirme de (?:todos|ustedes|todo el mundo)\b(?=.*\b(?:ultima|ultimo|para siempre|no voy a estar)\b)/,
  // Autolesión
  /\b(?:autolesion\w*|autolesionarme)\b/,
  /\b(?:hacerme|me hago|me hice|me voy a hacer) dano\b/,
  /\b(?:lastimarme|me lastime|me lastimo) (?:a proposito|de nuevo|otra vez|sola|solo)\b/,
  /\b(?:quiero |volver a |me volvi a |ganas de )?lastimarme\b(?! (?:la|el|los|las) )/,
  /\b(?:me volvi a cortar|volver a cortarme|ganas de cortarme|quiero cortarme)\b(?! (?:el|las?|los) (?:pelo|unas|flequillo|barba|puntas))/,
];

export function hasCrisisSignal(text: string): boolean {
  const normalized = normalizeForSignals(text);
  if (normalized.length < 6) return false;
  return SIGNALS.some((pattern) => pattern.test(normalized));
}
