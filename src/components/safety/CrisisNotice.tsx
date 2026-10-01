import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { cn } from '../../lib/cn';
import { hasCrisisSignal } from '../../lib/crisisSignals';
import { PresenceGlyph } from '../byourside/ui';

/**
 * Invitación suave a buscar ayuda cuando lo que la persona ESCRIBE tiene
 * señales de crisis (ver lib/crisisSignals.ts). Nunca bloquea el envío, no
 * acusa y no sale del dispositivo. "Seguir escribiendo" la oculta hasta que
 * el campo vuelva a quedar vacío (ej. después de enviar).
 */
export function CrisisNotice({ text, className }: { text: string; className?: string }) {
  // Espera a que la frase termine ("me quiero morir… de risa") antes de evaluar.
  const settled = useDebouncedValue(text, 600);
  const detected = useMemo(() => hasCrisisSignal(settled), [settled]);
  const [dismissed, setDismissed] = useState(false);
  const empty = text.trim() === '';
  if (dismissed && empty) setDismissed(false);

  return (
    <div aria-live="polite" className={cn(!detected || dismissed || empty ? 'hidden' : undefined, className)}>
      {detected && !dismissed && !empty ? (
        <div className="rounded-2xl bg-presence-soft/80 p-4 text-sm text-foreground animate-soft-rise">
          <p className="flex items-start gap-2.5">
            <PresenceGlyph className="mt-1 h-3 w-5 shrink-0 text-presence-strong" />
            <span>
              <span className="font-medium">Lo que estás escribiendo suena muy pesado.</span> No tenés que atravesarlo en
              soledad: hay personas para hablar ahora mismo, gratis y sin dar tu nombre.
            </span>
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 pl-7">
            <a
              href="tel:135"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-presence px-3.5 text-sm font-semibold text-presence-foreground shadow-soft"
            >
              <Phone className="size-4" aria-hidden="true" />
              Hablar ahora (135)
            </a>
            <Link
              to="/help"
              className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium"
            >
              Ver líneas de ayuda
            </Link>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              className="min-h-9 px-2 text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Seguir escribiendo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
