import { Link } from 'react-router-dom';
import { Logo } from './byourside/logo';
import { pickRandomSupportMessage } from '../lib/supportMessages';
import { useState } from 'react';

export default function SupportReminderCard() {
  const [message] = useState(pickRandomSupportMessage);

  return (
    <aside className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card/60 p-4">
      <Logo />
      <div className="min-w-0">
        <p className="text-[0.7rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
          Para tener presente
        </p>
        <p className="mt-1 text-sm leading-relaxed text-foreground/90">{message}</p>
        <Link to="/help" className="mt-2 inline-block text-sm font-medium text-listening-strong hover:underline">
          ¿Necesitás ayuda ahora?
        </Link>
      </div>
    </aside>
  );
}
