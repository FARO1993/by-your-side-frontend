import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Phone } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { LeafShape } from '../../components/games/leaves/LeafShape';
import { CrisisNotice } from '../../components/safety/CrisisNotice';
import { Button, Card, PresenceGlyph } from '../../components/byourside/ui';
import { hasCrisisSignal } from '../../lib/crisisSignals';
import { LEAF_FLOAT_MS, LEAF_MAX_CHARS, leafText, nextLane, type Leaf } from '../../lib/games/leaves';

/** Altura de cada carril, en % del río. */
const LANE_TOP = ['14%', '40%', '64%'];

/** Hojitas sin texto que pasan solas, para que el río nunca esté quieto. */
const AMBIENT = [
  { top: '8%', delay: '-4s', duration: '26s', size: 'w-14' },
  { top: '58%', delay: '-15s', duration: '30s', size: 'w-10' },
  { top: '78%', delay: '-9s', duration: '34s', size: 'w-12' },
];

export default function LeavesGamePage() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState('');
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [heavy, setHeavy] = useState(false);
  const [finished, setFinished] = useState(false);
  const nextId = useRef(1);
  const lastLane = useRef<number | null>(null);
  const timers = useRef(new Set<number>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach((timer) => window.clearTimeout(timer));
  }, []);

  function release(event: FormEvent) {
    event.preventDefault();
    const text = leafText(draft);
    if (!text) return;

    const lane = nextLane(lastLane.current);
    lastLane.current = lane;
    const leaf: Leaf = { id: nextId.current, text, lane };
    nextId.current += 1;

    setLeaves((current) => [...current, leaf]);
    setDraft('');
    setAnnouncement('Pusiste el pensamiento en una hoja. Se va con el río, a su ritmo.');
    if (hasCrisisSignal(text)) setHeavy(true);

    // Cuando la hoja termina de cruzar, el texto deja de existir.
    const timer = window.setTimeout(() => {
      timers.current.delete(timer);
      setLeaves((current) => current.filter((item) => item.id !== leaf.id));
    }, LEAF_FLOAT_MS + 500);
    timers.current.add(timer);
  }

  function finish() {
    timers.current.forEach((timer) => window.clearTimeout(timer));
    timers.current.clear();
    setLeaves([]);
    setDraft('');
    setFinished(true);
    setAnnouncement('');
  }

  return (
    <GameShell
      title="Hojas en el río"
      subtitle="Cuando aparezca un pensamiento, ponelo en una hoja y dejalo ir. No hace falta empujarlo ni resolverlo."
      actions={
        finished ? null : (
          <Button type="button" size="sm" variant="outline" onClick={finish}>
            Terminar
          </Button>
        )
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <div
        data-testid="river"
        className="relative h-72 overflow-hidden rounded-3xl bg-gradient-to-b from-river-top to-river-bottom shadow-soft sm:h-80"
      >
        {/* Orillas */}
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-5 bg-leaf/70" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-5 bg-soil-deep" />

        {/* Corriente */}
        <div aria-hidden="true" className="absolute inset-y-0 left-0 w-[200%] animate-flow">
          {['22%', '36%', '52%', '70%', '84%'].map((top, i) => (
            <div key={top} className="absolute inset-x-0 flex justify-around" style={{ top }}>
              {Array.from({ length: 8 }, (_, j) => (
                <span
                  key={j}
                  className="block h-0.5 rounded-full bg-white/35"
                  style={{ width: `${2 + ((i + j) % 3)}rem`, marginLeft: `${(i * 7 + j * 3) % 5}rem` }}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Hojitas de ambiente */}
        {AMBIENT.map((leaf) => (
          <div
            key={leaf.top}
            aria-hidden="true"
            className="absolute animate-float-away opacity-80 motion-reduce:hidden"
            style={{ top: leaf.top, animationDelay: leaf.delay, animationDuration: leaf.duration, animationIterationCount: 'infinite' }}
          >
            <LeafShape className={`${leaf.size} h-6`} tone="autumn" />
          </div>
        ))}

        {/* Las hojas de la persona */}
        {leaves.map((leaf) => (
          <div
            key={leaf.id}
            data-testid="leaf"
            className="absolute w-52 animate-float-away"
            style={{ top: LANE_TOP[leaf.lane], '--leaf-ms': `${LEAF_FLOAT_MS}ms` } as CSSProperties}
          >
            <div className="relative animate-bob">
              <LeafShape className="h-24 w-52 drop-shadow-md" />
              <p className="absolute inset-0 flex items-center justify-center px-10 text-center font-serif text-xs leading-snug text-[oklch(0.25_0.04_150)]">
                <span className="line-clamp-3">{leaf.text}</span>
              </p>
            </div>
          </div>
        ))}

        {finished ? null : leaves.length === 0 ? (
          <p className="pointer-events-none absolute inset-x-0 bottom-8 text-center text-sm text-white/90 drop-shadow">
            Mirá el agua un momento. Cuando quieras, soltá una hoja.
          </p>
        ) : null}
      </div>

      {heavy ? (
        <div className="rounded-2xl bg-presence-soft/80 p-4 text-sm text-foreground animate-soft-rise" role="note">
          <p className="flex items-start gap-2.5">
            <PresenceGlyph className="mt-1 h-3 w-5 shrink-0 text-presence-strong" />
            <span>
              <span className="font-medium">Eso que soltaste suena muy pesado.</span> Dejarlo ir en una hoja está bien, y
              también podés hablarlo con alguien ahora mismo, gratis y sin dar tu nombre.
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
            <Link to="/help" className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium">
              Ver líneas de ayuda
            </Link>
            <button
              type="button"
              onClick={() => setHeavy(false)}
              className="min-h-9 px-2 text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              Seguir en el río
            </button>
          </div>
        </div>
      ) : null}

      {finished ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Los pensamientos vienen y van</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Como las hojas. No hace falta pelear con ellos. Gracias por darte este momento.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => setFinished(false)}>
              Seguir mirando el río
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
              Elegir otro juego
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={release} className="space-y-2">
          <label htmlFor="leaf-text" className="block text-sm font-medium">
            ¿Qué pensamiento aparece?
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="leaf-text"
              type="text"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={LEAF_MAX_CHARS}
              autoComplete="off"
              placeholder="Por ejemplo: «no voy a llegar con todo»"
              className="min-h-11 flex-1 rounded-full border border-border bg-card px-4 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
            <Button type="submit" variant="listening" disabled={leafText(draft) === null}>
              Ponerlo en una hoja
            </Button>
          </div>
          <CrisisNotice text={draft} />
          <p className="text-xs text-muted-foreground">
            Lo que escribas no se guarda ni se envía: solo se va con el río. Si el mismo pensamiento vuelve, está bien;
            ponelo en otra hoja.
          </p>
        </form>
      )}
    </GameShell>
  );
}
