import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, X } from 'lucide-react';
import type { StatusMood } from '../api/types';
import { cn } from '../lib/cn';
import { MOOD_CARE } from '../lib/moodCare';
import { BreathingExercise } from './byourside/breathing-exercise';

/** Respuesta cuidada al ánimo que la persona acaba de contar. */
export function MoodCareCard({ mood, onDismiss }: { mood: StatusMood; onDismiss: () => void }) {
  const care = MOOD_CARE[mood];
  const [breathing, setBreathing] = useState(false);
  const presence = care.tone === 'presence';

  return (
    <section
      aria-label={care.title}
      className={cn('rounded-2xl px-4 py-4 animate-soft-rise', presence ? 'bg-presence-soft/70' : 'bg-listening-soft')}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-serif text-lg text-foreground">{care.title}</p>
          <p className="mt-0.5 text-sm text-muted-foreground">{care.body}</p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Ahora no"
          title="Ahora no"
          className="-mt-1 -mr-1 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-card/60"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {breathing ? (
        <div className="mt-3">
          <BreathingExercise />
        </div>
      ) : (
        <ul className="mt-3 space-y-2">
          {care.actions.map((action) => (
            <li key={action.label}>
              {'to' in action ? (
                <Link
                  to={action.to}
                  className="flex min-h-11 items-center justify-between gap-3 rounded-xl bg-card/80 px-3 py-2 text-sm font-medium text-foreground hover:bg-card"
                >
                  {action.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setBreathing(true)}
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-card/80 px-3 py-2 text-left text-sm font-medium text-foreground hover:bg-card"
                >
                  {action.label}
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {care.showHelp ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Si en algún momento es demasiado,{' '}
          <Link to="/help" className="font-medium text-foreground underline underline-offset-2">
            hay ayuda profesional ahora
          </Link>
          .
        </p>
      ) : null}
    </section>
  );
}
