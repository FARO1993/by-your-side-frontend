import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AnimatedWelcome,
  type AnimatedWelcomeVariant,
} from '../components/byourside/animated-welcome';
import { Button } from '../components/byourside/ui';
import { cn } from '../lib/cn';

const VARIANTS: { id: AnimatedWelcomeVariant; label: string }[] = [
  { id: 'new-user', label: 'Nuevo' },
  { id: 'returning-user', label: 'Existente' },
];

export default function WelcomePreviewPage() {
  const [params, setParams] = useSearchParams();
  const variant: AnimatedWelcomeVariant =
    params.get('variant') === 'returning-user' ? 'returning-user' : 'new-user';
  const userName = params.get('name')?.trim() || 'Facundo';
  const [replay, setReplay] = useState(0);
  const [done, setDone] = useState(false);
  const [seenVariant, setSeenVariant] = useState(variant);

  if (variant !== seenVariant) {
    setSeenVariant(variant);
    setDone(false);
    setReplay((value) => value + 1);
  }

  function selectVariant(next: AnimatedWelcomeVariant) {
    const nextParams = new URLSearchParams(params);
    nextParams.set('variant', next);
    setParams(nextParams, { replace: true });
    setDone(false);
    setReplay((value) => value + 1);
  }

  function replayCurrent() {
    setDone(false);
    setReplay((value) => value + 1);
  }

  return (
    <div className="min-h-dvh bg-background">
      <nav
        aria-label="Variante de prueba"
        className="fixed top-[max(0.75rem,env(safe-area-inset-top))] right-3 z-50 flex gap-1 rounded-full border border-border bg-card/95 p-1 text-xs shadow-soft"
      >
        {VARIANTS.map((item) => {
          const selected = item.id === variant && !done;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => selectVariant(item.id)}
              aria-pressed={item.id === variant}
              className={cn(
                'rounded-full px-3 py-1.5 font-medium',
                selected
                  ? 'bg-presence-soft text-presence-strong'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {done ? (
        <div className="flex min-h-dvh items-center justify-center px-6 py-16">
          <div className="max-w-sm text-center">
            <h1 className="font-serif text-2xl text-balance">Listo.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Acá seguiría la aplicación. Esta vista es temporal para revisar la bienvenida.
            </p>
            <Button className="mt-6" onClick={replayCurrent}>
              Ver de nuevo
            </Button>
          </div>
        </div>
      ) : (
        <AnimatedWelcome
          key={`${variant}-${userName}-${replay}`}
          variant={variant}
          userName={userName}
          onComplete={() => setDone(true)}
        />
      )}
    </div>
  );
}
