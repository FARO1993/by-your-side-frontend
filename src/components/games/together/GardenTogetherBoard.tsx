import { useEffect, useMemo, useRef, useState } from 'react';
import { getGameHistory, type GameEvent, type GameRoom } from '../../../api/gameRooms';
import { dayPart, isBloomed, type Species } from '../../../lib/games/garden';
import { SPECIES_META, speciesArticle } from '../../../lib/games/gardenSpecies';
import { replayGardenTogether, type GardenAction } from '../../../lib/games/gardenTogether';
import { personName } from '../../../lib/games/gameNames';
import { Button, Card } from '../../byourside/ui';
import { GardenView, SeedPicker } from '../garden/GardenView';

function sinceText(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' });
}

function describe(action: GardenAction, who: string): string {
  const name = SPECIES_META[action.species].label.toLowerCase();
  const art = speciesArticle(action.species);
  const parts: string[] = [];
  if (action.event === 'planted') parts.push(`${who} plantó ${art} ${name}.`);
  if (action.event === 'watered') parts.push(`${who} regó ${art === 'un' ? 'el' : 'la'} ${name}.`);
  if (action.event === 'bloomed') parts.push(`${who} regó y floreció ${art} ${name}.`);
  if (action.grew) parts.push('El jardín creció: hay canteros nuevos.');
  return parts.join(' ');
}

/**
 * Jardín compartido: el mismo jardín para las dos personas, sin turnos, y
 * que sigue creciendo de una vez a la otra. Nada se marchita.
 */
export function GardenTogetherBoard({
  room,
  events,
  myId,
  send,
  onLeave,
}: {
  room: GameRoom;
  events: GameEvent[];
  myId: string;
  send: (type: string, payload: unknown) => Promise<void>;
  onLeave: () => void;
}) {
  const [history, setHistory] = useState<GameEvent[] | null>(null);
  const [historyFailed, setHistoryFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [seed, setSeed] = useState<Species>('margarita');
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [note, setNote] = useState('');
  const [splash, setSplash] = useState<{ index: number; key: number } | null>(null);
  const splashTimer = useRef<number | undefined>(undefined);
  const part = useMemo(() => dayPart(new Date().getHours()), []);

  useEffect(() => () => window.clearTimeout(splashTimer.current), []);

  useEffect(() => {
    let cancelled = false;
    getGameHistory(room.id)
      .then((loaded) => {
        if (!cancelled) setHistory(loaded);
      })
      .catch(() => {
        if (!cancelled) setHistoryFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [room.id, attempt]);

  const state = useMemo(() => replayGardenTogether(history ?? [], events), [history, events]);
  const since = useMemo(() => (history ? replayGardenTogether(history, []).since : null), [history]);

  const partner = room.host.id === myId ? room.guest : room.host;
  const partnerName = personName(partner);

  if (historyFailed) {
    return (
      <Card className="space-y-3 p-5 text-sm">
        <p>No pudimos traer su jardín.</p>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setHistoryFailed(false);
            setAttempt((n) => n + 1);
          }}
        >
          Probar de nuevo
        </Button>
      </Card>
    );
  }

  if (!history) {
    return <p className="text-sm text-muted-foreground">Buscando su jardín…</p>;
  }

  const garden = state.garden;
  const last = state.lastAction;
  const partnerLast = last && last.actorId !== myId ? last : null;

  async function tend(index: number) {
    const plant = garden.plots[index];
    if (plant && isBloomed(plant)) {
      setNote(`${speciesArticle(plant.species) === 'un' ? 'Este' : 'Esta'} ${SPECIES_META[plant.species].label.toLowerCase()} ya está en flor.`);
      return;
    }
    setNote('');
    setFailed(false);
    if (plant) {
      window.clearTimeout(splashTimer.current);
      setSplash((prev) => ({ index, key: (prev?.key ?? 0) + 1 }));
      splashTimer.current = window.setTimeout(() => setSplash(null), 700);
    }
    try {
      await (plant ? send('WATER', { index }) : send('PLANT', { index, species: seed }));
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {since ? `Lo vienen cuidando juntos desde el ${sinceText(since)}.` : 'Es su primer rato en este jardín. Lo que planten queda para la próxima.'}
      </p>

      <p role="status" aria-live="polite" className="sr-only">
        {partnerLast ? describe(partnerLast, partnerName) : note}
      </p>

      <GardenView
        garden={garden}
        part={part}
        seed={seed}
        disabled={finished}
        onTend={(index) => void tend(index)}
        splash={splash}
        highlight={partnerLast?.index ?? null}
      />

      {partnerLast ? (
        <p className="text-center text-sm text-muted-foreground" aria-hidden="true">
          {describe(partnerLast, partnerName)}
        </p>
      ) : null}
      {note ? (
        <p className="text-center text-sm text-muted-foreground" aria-hidden="true">
          {note}
        </p>
      ) : null}
      {failed ? (
        <p role="alert" className="text-center text-sm text-muted-foreground">
          No pudimos mandar eso. Probá de nuevo.
        </p>
      ) : null}

      {finished ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Gracias por compartir este ratito 🌱</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Su jardín queda acá, tal cual, para la próxima vez que jueguen juntos.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => setFinished(false)}>
              Seguir un rato más
            </Button>
            <Button type="button" variant="outline" onClick={onLeave}>
              Salir
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mx-auto max-w-md space-y-3">
          <SeedPicker seed={seed} onChange={setSeed} />
          <p className="text-center text-xs text-muted-foreground">
            Pueden plantar y regar los dos a la vez. Tocá un cantero vacío para plantar y una planta para regarla.
          </p>
          <div className="flex justify-center">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFinished(true)}>
              Terminar por hoy
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
