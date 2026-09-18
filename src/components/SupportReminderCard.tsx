import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HereForSomeoneIcon } from './Icons';

const messages: string[] = [
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

function pickRandom(): string {
  return messages[Math.floor(Math.random() * messages.length)];
}

export default function SupportReminderCard() {
  const [message, setMessage] = useState(pickRandom);

  return (
    <div className="mb-6 animate-fade-slide-in border-l-2 border-mist bg-white p-4">
      <div className="flex items-start gap-3">
        <HereForSomeoneIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-dusk" />
        <div>
          <p className="text-sm text-dusk">Cuando te sientas mal, recordá:</p>
          <p className="mt-1 text-ink">{message}</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-dusk">
        <button onClick={() => setMessage(pickRandom())} className="hover:text-ink">
          Otro mensaje
        </button>
        <Link to="/help" className="text-calm hover:underline">
          ¿Necesitás ayuda ahora?
        </Link>
      </div>
    </div>
  );
}