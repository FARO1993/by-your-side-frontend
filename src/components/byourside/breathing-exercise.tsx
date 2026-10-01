import { useEffect, useState, type CSSProperties } from 'react';
import { Wind } from 'lucide-react';
import { BREATH_CYCLES, TOTAL_SECONDS, breathStateAt } from '../../lib/breathing';
import { Button, Card } from './ui';

const SMALL = 0.62;

type Status = 'idle' | 'running' | 'done';

/**
 * Respiración guiada de ~1 minuto (inhalar 4 · sostener 4 · exhalar 6).
 * - El círculo crece al inhalar y se achica al exhalar, con la duración real
 *   de cada fase. Con "reducir movimiento" no se anima: queda texto y cuenta.
 * - Lectores de pantalla: se anuncia solo el cambio de fase, no cada segundo.
 */
export function BreathingExercise() {
  const [started, setStarted] = useState<'idle' | 'running'>('idle');
  const [elapsed, setElapsed] = useState(0);
  // "Terminado" se deriva del tiempo: sin setState dentro de otro updater.
  const finished = started === 'running' && elapsed >= TOTAL_SECONDS;
  const status: Status = finished ? 'done' : started === 'running' ? 'running' : 'idle';

  useEffect(() => {
    if (started !== 'running' || finished) return undefined;
    const timer = window.setInterval(() => setElapsed((current) => current + 1), 1000);
    return () => window.clearInterval(timer);
  }, [started, finished]);

  function start() {
    setElapsed(0);
    setStarted('running');
  }

  function stop() {
    setStarted('idle');
  }

  const state = status === 'running' ? breathStateAt(elapsed) : null;
  const scale = state && state.phase !== 'exhale' ? 1 : SMALL;
  const circleStyle = {
    '--breath-scale': scale,
    transitionDuration: state ? `${state.phaseSeconds}s` : '0.8s',
  } as CSSProperties;

  return (
    <Card id="respirar" className="p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-listening-soft text-listening-strong">
          <Wind className="size-4" aria-hidden="true" />
        </span>
        <div>
          <h3 className="font-serif text-lg">Respirar un minuto</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No hace falta resolverlo todo ahora. Seguí el círculo: inhalá, sostené y soltá despacio.
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <div className="relative flex size-48 items-center justify-center sm:size-56" aria-hidden="true">
          <div className="absolute inset-0 rounded-full border border-listening/25" />
          <div
            style={circleStyle}
            className="absolute inset-3 rounded-full bg-gradient-to-br from-listening-soft via-listening/35 to-presence-soft shadow-soft transition-transform ease-in-out [transform:scale(var(--breath-scale))] motion-reduce:transition-none motion-reduce:[transform:none]"
          />
          <div className="relative text-center">
            {state ? (
              <>
                <p className="font-serif text-xl text-foreground">{state.label}</p>
                <p className="mt-1 text-3xl font-semibold tabular-nums text-listening-strong">{state.remaining}</p>
              </>
            ) : status === 'done' ? (
              <p className="px-6 font-serif text-lg text-foreground">Bien hecho</p>
            ) : (
              <p className="mx-auto max-w-[6.5rem] font-serif text-lg leading-snug text-foreground/80">Un minuto para vos</p>
            )}
          </div>
        </div>

        {/* Solo la fase: anunciar cada segundo sería ruido. */}
        <p role="status" aria-live="polite" className="sr-only">
          {state ? `${state.label}. Ciclo ${state.cycle} de ${BREATH_CYCLES}.` : status === 'done' ? 'Terminaste el ejercicio.' : ''}
        </p>

        {state ? (
          <p className="mt-4 text-xs text-muted-foreground" aria-hidden="true">
            Ciclo {state.cycle} de {BREATH_CYCLES}
          </p>
        ) : null}

        {status === 'done' ? (
          <p className="mt-4 max-w-xs text-center text-sm text-muted-foreground">
            Tomate un momento para notar cómo estás. Si te hace bien, podés repetirlo.
          </p>
        ) : null}

        <div className="mt-4">
          {status === 'running' ? (
            <Button type="button" size="sm" variant="outline" onClick={stop}>
              Terminar
            </Button>
          ) : (
            <Button type="button" size="sm" variant="listening" onClick={start}>
              {status === 'done' ? 'Otra vez' : 'Empezar'}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
