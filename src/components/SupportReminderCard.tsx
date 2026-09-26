import { useState } from 'react';
import { Link } from 'react-router-dom';
import { pickRandomSupportMessage } from '../lib/supportMessages';

export default function SupportReminderCard() {
  const [message] = useState(pickRandomSupportMessage);

  return (
    <aside className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-1">
      <p className="min-w-0 text-sm leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground/75">Para tener presente. </span>
        {message}
      </p>
      <Link to="/help" className="shrink-0 text-sm font-medium text-listening-strong hover:underline">
        ¿Necesitás ayuda ahora?
      </Link>
    </aside>
  );
}
