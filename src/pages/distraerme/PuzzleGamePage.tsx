import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shuffle } from 'lucide-react';
import { GameShell } from '../../components/games/GameShell';
import { PuzzlePicker } from '../../components/games/puzzle/PuzzlePicker';
import { PuzzlePlay } from '../../components/games/puzzle/PuzzlePlay';
import { Button, Card } from '../../components/byourside/ui';
import { createPuzzle, isComplete, place, placedCount, type PieceCount, type PuzzleState } from '../../lib/games/puzzle';
import { PUZZLE_SCENES, type PuzzleSceneId } from '../../lib/games/puzzleScenes';

export default function PuzzleGamePage() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'choosing' | 'playing'>('choosing');
  const [scene, setScene] = useState<PuzzleSceneId>('lago');
  const [count, setCount] = useState<PieceCount>(9);
  const [puzzle, setPuzzle] = useState<PuzzleState>(() => createPuzzle(9));
  // Cada partida nueva arranca el tablero de cero (selección, guía, avisos).
  const [gameId, setGameId] = useState(0);

  const complete = phase === 'playing' && isComplete(puzzle);
  const sceneTitle = PUZZLE_SCENES.find((item) => item.id === scene)?.title ?? '';

  function start(nextScene: PuzzleSceneId, nextCount: PieceCount) {
    setScene(nextScene);
    setCount(nextCount);
    setPuzzle(createPuzzle(nextCount));
    setGameId((id) => id + 1);
    setPhase('playing');
  }

  function onPlace(pieceId: number, row: number, col: number) {
    const { state, result } = place(puzzle, pieceId, row, col);
    if (result === 'placed') setPuzzle(state);
    return result;
  }

  if (phase === 'choosing') {
    return (
      <GameShell title="Puzzle" subtitle="Pieza por pieza, sin reloj. Si una no va, vuelve a la bandeja y listo.">
        <PuzzlePicker onStart={start} initialScene={scene} initialCount={count} />
      </GameShell>
    );
  }

  return (
    <GameShell
      title="Puzzle"
      subtitle={`${sceneTitle}. Arrastrá cada pieza a su lugar, o tocala y después tocá dónde va.`}
      actions={
        <Button type="button" size="sm" variant="outline" onClick={() => setPhase('choosing')}>
          <Shuffle className="size-4" aria-hidden="true" />
          Cambiar puzzle
        </Button>
      }
    >
      <p className="sr-only">
        Juego visual. Elegí una pieza de la bandeja y después el lugar del tablero donde va. Las piezas de esquina y de
        borde están indicadas.
      </p>
      <PuzzlePlay
        key={gameId}
        puzzle={puzzle}
        scene={scene}
        onPlace={onPlace}
        progressLabel={`${placedCount(puzzle)} de ${puzzle.pieces.length} piezas`}
        footer={
          complete ? (
            <Card className="mx-auto max-w-md p-5 text-center animate-soft-rise">
              <p className="font-serif text-xl">Armaste el paisaje</p>
              <p className="mt-1 text-sm text-muted-foreground">Pieza por pieza, sin reloj. Fue un rato para vos.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" variant="listening" onClick={() => setPhase('choosing')}>
                  Otro puzzle
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/distraerme?jugar=solo')}>
                  Elegir otro juego
                </Button>
              </div>
            </Card>
          ) : null
        }
      />
    </GameShell>
  );
}
