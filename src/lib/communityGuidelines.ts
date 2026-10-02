/**
 * Normas de la comunidad: contenido único que usan el onboarding y /normas.
 *
 * Que la persona las leyó se guarda solo en este dispositivo (igual que la
 * bienvenida: el backend todavía no tiene un campo de onboarding). La clave
 * lleva versión: si las normas cambian de fondo, subir GUIDELINES_VERSION
 * hace que todos las vuelvan a ver una vez.
 */
export const GUIDELINES_VERSION = 'v1';

export type Guideline = { title: string; body: string };

export const COMMUNITY_GUIDELINES: Guideline[] = [
  {
    title: 'Escuchá antes de aconsejar',
    body: 'No hace falta resolverle nada a nadie. Muchas veces alcanza con estar y preguntar cómo sigue.',
  },
  {
    title: 'Sin juicios ni burlas',
    body: 'Lo que alguien siente es válido aunque a vos no te pase igual.',
  },
  {
    title: 'Lo que te cuentan, queda acá',
    body: 'No compartas capturas, nombres ni datos de otras personas fuera de ByYourSide.',
  },
  {
    title: 'Sin indicaciones médicas',
    body: 'No recomiendes medicación ni tratamientos. Si algo preocupa, sugerí ayuda profesional.',
  },
  {
    title: 'Hablá de cómo te sentís, no de métodos',
    body: 'Contá lo que te pasa con la confianza que necesites, pero sin detalles de autolesión: a otras personas les puede hacer mal leerlos.',
  },
  {
    title: 'Sin acoso, odio, spam ni pedidos de dinero',
    body: 'Si ves algo así, reportalo. Lo revisamos con cuidado.',
  },
];

const PREFIX = 'byyourside.guidelinesAccepted.';

function key(userId: string): string {
  return `${PREFIX}${GUIDELINES_VERSION}.${userId}`;
}

export const guidelinesStorage = {
  hasAccepted(userId: string): boolean {
    try {
      return localStorage.getItem(key(userId)) === 'true';
    } catch {
      // Sin storage no bloqueamos la app con un onboarding que no se puede cerrar.
      return true;
    }
  },

  accept(userId: string): void {
    try {
      localStorage.setItem(key(userId), 'true');
    } catch {
      // nada que guardar
    }
  },
};
