import { useState } from 'react';
import { Button } from '../../byourside/ui';
import { cn } from '../../../lib/cn';
import { PIECE_COUNTS, PUZZLE_SIZE, type PieceCount } from '../../../lib/games/puzzle';
import { PUZZLE_SCENES, type PuzzleSceneId } from '../../../lib/games/puzzleScenes';
import { PuzzleScene } from './PuzzleScene';

/** Elegir imagen y cantidad de piezas antes de empezar. */
export function PuzzlePicker({
  onStart,
  initialScene = 'lago',
  initialCount = 9,
  startLabel = 'Empezar',
  disabled = false,
  note,
}: {
  onStart: (scene: PuzzleSceneId, count: PieceCount) => void;
  initialScene?: PuzzleSceneId;
  initialCount?: PieceCount;
  startLabel?: string;
  disabled?: boolean;
  note?: string;
}) {
  const [scene, setScene] = useState<PuzzleSceneId>(initialScene);
  const [count, setCount] = useState<PieceCount>(initialCount);

  return (
    <div className="space-y-5">
      <section aria-labelledby="puzzle-image" className="space-y-3">
        <h2 id="puzzle-image" className="font-serif text-lg">
          Elegí una imagen
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {PUZZLE_SCENES.map((item) => (
            <button
              key={item.id}
              type="button"
              aria-pressed={scene === item.id}
              onClick={() => setScene(item.id)}
              className={cn(
                'overflow-hidden rounded-2xl bg-card text-left shadow-soft transition-shadow',
                scene === item.id ? 'ring-2 ring-listening' : 'hover:shadow-lift',
              )}
            >
              <svg viewBox={`0 0 ${PUZZLE_SIZE} ${PUZZLE_SIZE}`} className="block aspect-square w-full" aria-hidden="true">
                <PuzzleScene id={item.id} />
              </svg>
              <span className="block px-2 py-2 text-xs font-medium text-foreground sm:text-sm">{item.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="puzzle-count" className="space-y-3">
        <h2 id="puzzle-count" className="font-serif text-lg">
          ¿Cuántas piezas?
        </h2>
        <div role="group" aria-labelledby="puzzle-count" className="inline-flex gap-1 rounded-full bg-muted p-1">
          {PIECE_COUNTS.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={count === option}
              onClick={() => setCount(option)}
              className={cn(
                'min-h-10 rounded-full px-4 text-sm transition-colors',
                count === option ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
              )}
            >
              {option} piezas
            </button>
          ))}
        </div>
      </section>

      {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}

      <Button type="button" variant="listening" disabled={disabled} onClick={() => onStart(scene, count)}>
        {startLabel}
      </Button>
    </div>
  );
}
