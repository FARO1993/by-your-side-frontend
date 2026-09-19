import { useState } from 'react';
import { Link } from 'react-router-dom';
import { HereForSomeoneIcon } from './Icons';
import { pickRandomSupportMessage } from '../lib/supportMessages';

export default function SupportReminderCard() {
  const [message, setMessage] = useState(pickRandomSupportMessage);

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
        <button onClick={() => setMessage(pickRandomSupportMessage())} className="hover:text-ink">
          Otro mensaje
        </button>
        <Link to="/help" className="text-calm hover:underline">
          ¿Necesitás ayuda ahora?
        </Link>
      </div>
    </div>
  );
}