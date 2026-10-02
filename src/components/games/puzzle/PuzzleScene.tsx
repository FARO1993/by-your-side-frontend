import { useId } from 'react';
import type { PuzzleSceneId } from '../../../lib/games/puzzleScenes';

/**
 * Ilustraciones propias para el puzzle (300 × 300). Colores fijos: son una
 * "imagen", no siguen el tema. Cada instancia usa ids propios para sus
 * degradés, porque cada pieza dibuja la escena entera recortada.
 */
export function PuzzleScene({ id }: { id: PuzzleSceneId }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = (name: string) => `${name}-${uid}`;

  if (id === 'lago') {
    return (
      <g>
        <defs>
          <linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.78 0.08 300)" />
            <stop offset="0.55" stopColor="oklch(0.86 0.09 50)" />
            <stop offset="1" stopColor="oklch(0.9 0.1 75)" />
          </linearGradient>
          <linearGradient id={ref('water')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.72 0.08 230)" />
            <stop offset="1" stopColor="oklch(0.5 0.08 245)" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={`url(#${ref('sky')})`} />
        <circle cx="205" cy="150" r="38" fill="oklch(0.9 0.13 70)" />
        <g fill="oklch(0.97 0.02 60)" opacity="0.75">
          <ellipse cx="70" cy="60" rx="34" ry="9" />
          <ellipse cx="95" cy="52" rx="22" ry="9" />
          <ellipse cx="225" cy="85" rx="28" ry="7" />
        </g>
        <path d="M0 175 L 55 110 L 95 150 L 140 95 L 200 170 L 240 135 L 300 175 Z" fill="oklch(0.55 0.07 290)" />
        <path d="M120 120 L 140 95 L 158 118 L 148 114 L 140 122 L 131 114 Z" fill="oklch(0.95 0.02 290)" />
        <path d="M0 185 L 40 150 L 90 185 L 150 140 L 215 185 L 265 155 L 300 185 Z" fill="oklch(0.45 0.08 175)" />
        <rect y="185" width="300" height="115" fill={`url(#${ref('water')})`} />
        <g stroke="oklch(0.92 0.11 70)" strokeWidth="4" strokeLinecap="round" opacity="0.8">
          <line x1="185" y1="200" x2="225" y2="200" />
          <line x1="192" y1="214" x2="218" y2="214" />
          <line x1="198" y1="228" x2="212" y2="228" />
        </g>
        <g stroke="oklch(0.85 0.04 230)" strokeWidth="2" strokeLinecap="round" opacity="0.6">
          <line x1="30" y1="230" x2="70" y2="230" />
          <line x1="240" y1="255" x2="280" y2="255" />
          <line x1="110" y1="280" x2="150" y2="280" />
        </g>
        <path d="M60 250 L 120 250 L 110 262 L 70 262 Z" fill="oklch(0.42 0.06 40)" />
        <path d="M90 250 L 90 205 L 115 247 Z" fill="oklch(0.97 0.01 80)" />
        <path d="M88 250 L 88 212 L 68 247 Z" fill="oklch(0.72 0.13 30)" />
        <g fill="oklch(0.35 0.05 300)">
          <path d="M235 40 q 5 -5 10 0 q 5 -5 10 0" stroke="oklch(0.35 0.05 300)" strokeWidth="2" fill="none" />
          <path d="M260 55 q 4 -4 8 0 q 4 -4 8 0" stroke="oklch(0.35 0.05 300)" strokeWidth="2" fill="none" />
        </g>
      </g>
    );
  }

  if (id === 'noche') {
    const stars = [
      [30, 30], [80, 55], [125, 25], [160, 70], [205, 35], [260, 60], [50, 100], [110, 110], [240, 110], [285, 25], [15, 70], [185, 115],
    ];
    return (
      <g>
        <defs>
          <linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="oklch(0.25 0.06 275)" />
            <stop offset="1" stopColor="oklch(0.45 0.08 265)" />
          </linearGradient>
        </defs>
        <rect width="300" height="300" fill={`url(#${ref('sky')})`} />
        <g fill="oklch(0.95 0.03 90)">
          {stars.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 2.4 : 1.5} />
          ))}
        </g>
        <circle cx="225" cy="70" r="30" fill="oklch(0.95 0.03 90)" />
        <circle cx="238" cy="62" r="27" fill="oklch(0.3 0.06 272)" />
        <path d="M0 200 C 60 150, 120 170, 170 190 C 220 210, 260 160, 300 170 L 300 300 L 0 300 Z" fill="oklch(0.38 0.06 170)" />
        <path d="M0 240 C 70 215, 150 225, 210 245 C 250 258, 280 240, 300 235 L 300 300 L 0 300 Z" fill="oklch(0.3 0.05 160)" />
        <rect x="150" y="170" width="60" height="45" fill="oklch(0.75 0.08 50)" />
        <path d="M142 172 L 180 140 L 218 172 Z" fill="oklch(0.55 0.12 30)" />
        <rect x="162" y="183" width="14" height="14" fill="oklch(0.9 0.14 85)" />
        <rect x="188" y="190" width="12" height="25" fill="oklch(0.45 0.06 40)" />
        <rect x="64" y="175" width="8" height="40" fill="oklch(0.35 0.05 50)" />
        <circle cx="68" cy="165" r="24" fill="oklch(0.33 0.06 155)" />
        <circle cx="55" cy="175" r="16" fill="oklch(0.36 0.06 155)" />
        <g fill="oklch(0.92 0.15 105)">
          <circle cx="110" cy="235" r="2.5" />
          <circle cx="240" cy="250" r="2.5" />
          <circle cx="40" cy="260" r="2.5" />
          <circle cx="170" cy="275" r="2.5" />
        </g>
        <path d="M120 300 C 140 270, 165 245, 180 215" stroke="oklch(0.6 0.05 60)" strokeWidth="10" fill="none" strokeLinecap="round" />
      </g>
    );
  }

  const flowers: [number, number, string][] = [
    [30, 240, 'oklch(0.72 0.14 25)'],
    [75, 262, 'oklch(0.84 0.15 88)'],
    [120, 235, 'oklch(0.68 0.11 300)'],
    [165, 265, 'oklch(0.97 0.01 90)'],
    [210, 238, 'oklch(0.72 0.14 25)'],
    [255, 260, 'oklch(0.7 0.1 245)'],
    [285, 230, 'oklch(0.84 0.15 88)'],
  ];
  return (
    <g>
      <defs>
        <linearGradient id={ref('sky')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="oklch(0.8 0.08 230)" />
          <stop offset="1" stopColor="oklch(0.94 0.04 200)" />
        </linearGradient>
      </defs>
      <rect width="300" height="300" fill={`url(#${ref('sky')})`} />
      <circle cx="60" cy="60" r="28" fill="oklch(0.92 0.13 92)" />
      <g fill="oklch(0.99 0.005 90)">
        <ellipse cx="190" cy="55" rx="40" ry="14" />
        <ellipse cx="215" cy="45" rx="25" ry="14" />
        <ellipse cx="120" cy="100" rx="28" ry="9" />
      </g>
      <path d="M0 165 C 70 120, 140 140, 190 160 C 240 175, 270 140, 300 145 L 300 300 L 0 300 Z" fill="oklch(0.72 0.1 140)" />
      <path d="M0 205 C 80 180, 170 190, 300 200 L 300 300 L 0 300 Z" fill="oklch(0.62 0.11 145)" />
      <g>
        <rect x="228" y="120" width="6" height="40" fill="oklch(0.45 0.05 50)" />
        <circle cx="231" cy="112" r="20" fill="oklch(0.55 0.11 150)" />
      </g>
      {flowers.map(([x, y, color], i) => (
        <g key={i}>
          <line x1={x} y1={y} x2={x} y2={y + 40} stroke="oklch(0.5 0.1 148)" strokeWidth="3" />
          <g fill={color}>
            {[0, 72, 144, 216, 288].map((angle) => (
              <ellipse key={angle} cx={x} cy={y - 8} rx="5" ry="8" transform={`rotate(${angle} ${x} ${y})`} />
            ))}
          </g>
          <circle cx={x} cy={y} r="4.5" fill="oklch(0.8 0.15 80)" />
        </g>
      ))}
      <g transform="translate(150 140) rotate(-12)">
        <ellipse cx="-7" cy="0" rx="8" ry="7" fill="oklch(0.72 0.14 25)" />
        <ellipse cx="7" cy="0" rx="8" ry="7" fill="oklch(0.72 0.14 25)" />
        <ellipse cx="-5" cy="9" rx="5" ry="4" fill="oklch(0.78 0.12 40)" />
        <ellipse cx="5" cy="9" rx="5" ry="4" fill="oklch(0.78 0.12 40)" />
        <rect x="-1.2" y="-5" width="2.4" height="17" rx="1.2" fill="oklch(0.3 0.03 280)" />
      </g>
    </g>
  );
}
