import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameShell } from '../../components/games/GameShell';
import { GardenView, SeedPicker } from '../../components/games/garden/GardenView';
import { Button, Card } from '../../components/byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { createGarden, dayPart, growIfFull, plantSeed, water, type GardenState, type Species } from '../../lib/games/garden';
import { SPECIES_META, STAGE_LABEL, speciesArticle as article } from '../../lib/games/gardenSpecies';
import { loadGarden, saveGarden } from '../../lib/games/gardenStorage';

export default function GardenGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id ?? null;

  const [garden, setGarden] = useState<GardenState>(() => loadGarden(userId) ?? createGarden());
  const [seed, setSeed] = useState<Species>('margarita');
  const [announcement, setAnnouncement] = useState('');
  const [splash, setSplash] = useState<{ index: number; key: number } | null>(null);
  const [session, setSession] = useState({ planted: 0, bloomed: 0 });
  const [finished, setFinished] = useState(false);
  const splashTimer = useRef<number | undefined>(undefined);
  const part = useMemo(() => dayPart(new Date().getHours()), []);

  useEffect(() => {
    saveGarden(userId, garden);
  }, [userId, garden]);

  useEffect(() => () => window.clearTimeout(splashTimer.current), []);

  function tend(index: number) {
    const current = garden.plots[index];
    const result = current ? water(garden, index) : plantSeed(garden, index, seed);
    if (result.event === 'ignored') return;

    const grown = growIfFull(result.garden);
    setGarden(grown.garden);

    const plant = grown.garden.plots[index];
    const label = plant ? SPECIES_META[plant.species].label.toLowerCase() : '';
    const messages: string[] = [];
    if (result.event === 'planted') {
      messages.push(`Plantaste ${article(seed)} ${label}.`);
      setSession((s) => ({ ...s, planted: s.planted + 1 }));
    }
    if (result.event === 'watered') messages.push(`Regaste. Ahora es ${STAGE_LABEL[plant?.stage ?? 0]}.`);
    if (result.event === 'bloomed') {
      messages.push(`¡Floreció ${article(plant?.species ?? 'margarita')} ${label}!`);
      setSession((s) => ({ ...s, bloomed: s.bloomed + 1 }));
    }
    if (result.event === 'already-bloomed' && plant) {
      messages.push(`${article(plant.species) === 'un' ? 'Este' : 'Esta'} ${label} ya está en flor.`);
    }
    if (grown.grew) messages.push('El jardín creció: hay canteros nuevos.');
    setAnnouncement(messages.join(' '));

    if (result.event === 'watered' || result.event === 'bloomed') {
      window.clearTimeout(splashTimer.current);
      setSplash((prev) => ({ index, key: (prev?.key ?? 0) + 1 }));
      splashTimer.current = window.setTimeout(() => setSplash(null), 700);
    }
  }


  function closingLine() {
    if (session.bloomed > 0) return `Hoy ${session.bloomed === 1 ? 'floreció una planta' : `florecieron ${session.bloomed} plantas`}.`;
    if (session.planted > 0) return `Hoy ${session.planted === 1 ? 'plantaste una semilla' : `plantaste ${session.planted} semillas`}.`;
    return 'A veces alcanza con pasar a mirar.';
  }

  return (
    <GameShell
      title="Jardín"
      subtitle="Plantá, regá y mirá cómo crece. Acá nada se marchita: tu jardín te espera como lo dejaste."
      actions={
        finished ? null : (
          <Button type="button" size="sm" variant="outline" onClick={() => setFinished(true)}>
            Terminar por hoy
          </Button>
        )
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <GardenView
        garden={garden}
        part={part}
        seed={seed}
        disabled={finished}
        onTend={tend}
        splash={splash}
      />

      {finished ? (
        <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
          <p className="font-serif text-xl">Gracias por compartir este ratito 🌱</p>
          <p className="mt-1 text-sm text-muted-foreground">{closingLine()} Tu jardín queda acá, tal cual, para cuando quieras volver.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Button type="button" variant="listening" onClick={() => setFinished(false)}>
              Seguir un rato más
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
              Elegir otro juego
            </Button>
          </div>
        </Card>
      ) : (
        <div className="mx-auto max-w-md space-y-3">
          <SeedPicker seed={seed} onChange={setSeed} />
          <p className="text-center text-xs text-muted-foreground">
            Tocá un cantero vacío para plantar, y una planta para regarla.
          </p>
        </div>
      )}
    </GameShell>
  );
}
