import type { ReactNode } from 'react';
import type { AvatarId } from '../../lib/avatars';

/** Paletas fijas (son ilustraciones: se ven igual en claro y en nocturno). */
const P = {
  coral: { bg: 'oklch(0.93 0.045 35)', fg: 'oklch(0.67 0.14 32)', soft: 'oklch(0.82 0.08 35)' },
  teal: { bg: 'oklch(0.92 0.04 195)', fg: 'oklch(0.56 0.08 197)', soft: 'oklch(0.78 0.06 195)' },
  sand: { bg: 'oklch(0.94 0.05 85)', fg: 'oklch(0.76 0.14 78)', soft: 'oklch(0.86 0.09 82)' },
  lavender: { bg: 'oklch(0.92 0.04 300)', fg: 'oklch(0.6 0.11 300)', soft: 'oklch(0.8 0.07 300)' },
  sky: { bg: 'oklch(0.92 0.04 235)', fg: 'oklch(0.6 0.1 245)', soft: 'oklch(0.8 0.06 240)' },
  sage: { bg: 'oklch(0.92 0.045 145)', fg: 'oklch(0.58 0.1 148)', soft: 'oklch(0.78 0.07 145)' },
  night: { bg: 'oklch(0.34 0.05 275)', fg: 'oklch(0.92 0.07 90)', soft: 'oklch(0.6 0.05 270)' },
} as const;

type Palette = (typeof P)[keyof typeof P];

const ART: Record<AvatarId, { palette: Palette; draw: (c: Palette) => ReactNode }> = {
  hoja: {
    palette: P.sage,
    draw: (c) => (
      <>
        <path d="M18 46 C 16 28, 30 16, 48 16 C 48 34, 36 48, 18 46 Z" fill={c.fg} />
        <path d="M18 46 C 26 36, 34 28, 44 20" stroke={c.bg} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  luna: {
    palette: P.night,
    draw: (c) => (
      <>
        <path d="M38 14 A 18 18 0 1 0 50 40 A 14 14 0 1 1 38 14 Z" fill={c.fg} />
        <circle cx="46" cy="20" r="1.8" fill={c.fg} />
        <circle cx="20" cy="18" r="1.4" fill={c.fg} opacity="0.8" />
      </>
    ),
  },
  sol: {
    palette: P.sand,
    draw: (c) => (
      <>
        <g stroke={c.fg} strokeWidth="3.2" strokeLinecap="round">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
            <line key={a} x1="32" y1="11" x2="32" y2="16" transform={`rotate(${a} 32 32)`} />
          ))}
        </g>
        <circle cx="32" cy="32" r="11" fill={c.fg} />
      </>
    ),
  },
  ola: {
    palette: P.sky,
    draw: (c) => (
      <>
        <path d="M10 40 C 16 40, 18 26, 30 24 C 40 22, 44 30, 38 34 C 34 36, 31 33, 33 31" stroke={c.fg} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M10 46 C 18 42, 24 50, 32 46 C 40 42, 46 50, 54 46" stroke={c.soft} strokeWidth="3.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  montana: {
    palette: P.lavender,
    draw: (c) => (
      <>
        <path d="M8 48 L 26 20 L 44 48 Z" fill={c.fg} />
        <path d="M30 48 L 42 30 L 56 48 Z" fill={c.soft} />
        <path d="M26 20 L 21 28 L 25 26 L 28 29 L 31 28 Z" fill={c.bg} />
      </>
    ),
  },
  flor: {
    palette: P.coral,
    draw: (c) => (
      <>
        <g fill={c.fg}>
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="32" cy="21" rx="7" ry="10" transform={`rotate(${a} 32 32)`} />
          ))}
        </g>
        <circle cx="32" cy="32" r="6.5" fill={P.sand.fg} />
      </>
    ),
  },
  nube: {
    palette: P.sky,
    draw: (c) => (
      <path
        d="M20 42 C 13 42, 12 33, 19 32 C 19 24, 29 21, 33 27 C 37 22, 47 24, 46 32 C 53 32, 53 42, 46 42 Z"
        fill={c.fg}
      />
    ),
  },
  estrella: {
    palette: P.night,
    draw: (c) => (
      <>
        <path d="M32 13 L 37.5 26 L 51 27 L 40.5 36 L 44 50 L 32 42.5 L 20 50 L 23.5 36 L 13 27 L 26.5 26 Z" fill={c.fg} strokeLinejoin="round" />
        <circle cx="50" cy="14" r="1.6" fill={c.fg} opacity="0.8" />
      </>
    ),
  },
  arbol: {
    palette: P.sage,
    draw: (c) => (
      <>
        <rect x="29.5" y="34" width="5" height="16" rx="2" fill={P.sand.fg} opacity="0.9" />
        <circle cx="32" cy="27" r="14" fill={c.fg} />
        <circle cx="26" cy="23" r="4" fill={c.soft} opacity="0.7" />
      </>
    ),
  },
  gota: {
    palette: P.teal,
    draw: (c) => (
      <>
        <path d="M32 12 C 40 24, 46 31, 46 38 A 14 14 0 0 1 18 38 C 18 31, 24 24, 32 12 Z" fill={c.fg} />
        <path d="M25 38 A 7 7 0 0 0 31 45" stroke={c.bg} strokeWidth="2.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  piedras: {
    palette: P.sand,
    draw: (c) => (
      <>
        <ellipse cx="32" cy="45" rx="15" ry="6" fill={c.fg} />
        <ellipse cx="32" cy="34.5" rx="11" ry="5" fill={P.coral.soft} />
        <ellipse cx="32" cy="25.5" rx="7.5" ry="4" fill={c.fg} />
        <ellipse cx="32" cy="18.5" rx="4.5" ry="3" fill={P.coral.soft} />
      </>
    ),
  },
  pluma: {
    palette: P.lavender,
    draw: (c) => (
      <>
        <path d="M44 12 C 30 16, 20 30, 20 44 C 30 42, 44 30, 44 12 Z" fill={c.fg} />
        <path d="M44 12 C 36 24, 26 38, 16 52" stroke={c.bg} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M16 52 L 21 46" stroke={c.fg} strokeWidth="2.2" strokeLinecap="round" />
      </>
    ),
  },
  caracola: {
    palette: P.coral,
    draw: (c) => (
      <>
        <path d="M32 50 C 18 50, 12 40, 14 30 C 16 20, 26 14, 36 16 C 46 18, 50 28, 46 35 C 42 42, 32 42, 29 36 C 26 30, 31 25, 36 27 C 40 29, 39 34, 35 34" stroke={c.fg} strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    ),
  },
  hongo: {
    palette: P.coral,
    draw: (c) => (
      <>
        <path d="M27 34 L 37 34 L 38 49 C 38 51, 26 51, 26 49 Z" fill="oklch(0.97 0.01 80)" />
        <path d="M12 35 C 12 22, 22 14, 32 14 C 42 14, 52 22, 52 35 Z" fill={c.fg} />
        <circle cx="24" cy="25" r="3" fill={c.bg} />
        <circle cx="37" cy="21" r="2.5" fill={c.bg} />
        <circle cx="42" cy="29" r="2" fill={c.bg} />
      </>
    ),
  },
  cactus: {
    palette: P.sage,
    draw: (c) => (
      <>
        <rect x="27" y="14" width="10" height="34" rx="5" fill={c.fg} />
        <path d="M27 34 L 21 34 C 18 34, 17 32, 17 30 L 17 24" stroke={c.fg} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M37 28 L 43 28 C 46 28, 47 26, 47 24 L 47 20" stroke={c.fg} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="20" y="47" width="24" height="6" rx="3" fill={P.coral.fg} />
      </>
    ),
  },
  arcoiris: {
    palette: P.sky,
    draw: () => (
      <g fill="none" strokeWidth="5" strokeLinecap="round">
        <path d="M12 44 A 20 20 0 0 1 52 44" stroke={P.coral.fg} />
        <path d="M18.5 44 A 13.5 13.5 0 0 1 45.5 44" stroke={P.sand.fg} />
        <path d="M25 44 A 7 7 0 0 1 39 44" stroke={P.teal.fg} />
      </g>
    ),
  },
  brote: {
    palette: P.teal,
    draw: (c) => (
      <>
        <path d="M32 50 L 32 30" stroke={c.fg} strokeWidth="3.5" strokeLinecap="round" />
        <path d="M32 32 C 30 22, 22 18, 14 20 C 15 28, 23 33, 32 32 Z" fill={c.fg} />
        <path d="M32 28 C 34 18, 42 14, 50 16 C 49 24, 41 29, 32 28 Z" fill={c.soft} />
        <path d="M22 50 L 42 50" stroke={P.sand.fg} strokeWidth="3.5" strokeLinecap="round" />
      </>
    ),
  },
  faro: {
    palette: P.night,
    draw: (c) => (
      <>
        <path d="M36 21 L 53 15 L 53 27 Z" fill={c.fg} opacity="0.35" />
        <path d="M26 50 L 28 24 L 36 24 L 38 50 Z" fill="oklch(0.97 0.01 80)" />
        <path d="M27.2 33 L 36.8 33 L 37.3 39 L 26.7 39 Z" fill={P.coral.fg} />
        <rect x="27" y="17" width="10" height="7" rx="1.5" fill={c.fg} />
        <path d="M26 17 L 32 12 L 38 17 Z" fill={P.coral.fg} />
        <path d="M18 50 L 46 50" stroke={c.soft} strokeWidth="3" strokeLinecap="round" />
      </>
    ),
  },
};

/** Dibujo del avatar (círculo completo, escala con el contenedor). */
export function AvatarArt({ id, className }: { id: AvatarId; className?: string }) {
  const art = ART[id];
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" focusable="false">
      <circle cx="32" cy="32" r="32" fill={art.palette.bg} />
      {art.draw(art.palette)}
    </svg>
  );
}
