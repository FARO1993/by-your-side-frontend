import { useId } from 'react';
import { piecePath, pieceViewBox, type Piece } from '../../../lib/games/puzzle';
import type { PuzzleSceneId } from '../../../lib/games/puzzleScenes';
import { PuzzleScene } from './PuzzleScene';

/** Una pieza suelta: la escena recortada con la forma de la pieza. */
export function PuzzlePieceSvg({ piece, size, scene, className }: { piece: Piece; size: number; scene: PuzzleSceneId; className?: string }) {
  const clipId = `piece-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const box = pieceViewBox(piece, size);
  const path = piecePath(piece, size);
  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.w}`} className={className} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <PuzzleScene id={scene} />
      </g>
      <path d={path} fill="none" stroke="oklch(1 0 0 / 0.75)" strokeWidth={box.w * 0.012} />
      <path d={path} fill="none" stroke="oklch(0.2 0.02 275 / 0.25)" strokeWidth={box.w * 0.006} />
    </svg>
  );
}

/** Una pieza ya colocada, dibujada dentro del tablero. */
export function PlacedPiece({ piece, size, scene, outline }: { piece: Piece; size: number; scene: PuzzleSceneId; outline: boolean }) {
  const clipId = `placed-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const path = piecePath(piece, size);
  return (
    <g>
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <PuzzleScene id={scene} />
      </g>
      {outline ? <path d={path} fill="none" stroke="oklch(1 0 0 / 0.35)" strokeWidth="0.8" /> : null}
    </g>
  );
}
