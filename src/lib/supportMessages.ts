export const supportMessages: string[] = [
    'Lo que sentís hoy es válido, incluso si no podés explicarlo.',
    'No tenés que atravesar esto con una sonrisa.',
    'Está bien pedir ayuda. Pedirla es un acto de coraje, no de debilidad.',
    'Un mal día no borra todos los días buenos que ya tuviste.',
    'Podés ir despacio. No hay una carrera que estés perdiendo.',
    'Alguien, en algún lugar, se alegra de que existas.',
    'Descansar también es avanzar.',
    'No estás roto/a. Estás atravesando algo difícil.',
    'Tus emociones no tienen que tener sentido para ser reales.',
    'Sobreviviste a cada uno de tus peores días hasta ahora.',
    'Está bien no estar bien todo el tiempo.',
    'Sos más que el peor momento que estás viviendo hoy.',
    'No hace falta que lo resuelvas todo hoy.',
    'Merecés el mismo cuidado que le darías a alguien que querés.',
    'A veces, simplemente seguir respirando ya es suficiente por hoy.',
  ];
  
  export function pickRandomSupportMessage(): string {
    return supportMessages[Math.floor(Math.random() * supportMessages.length)];
  }