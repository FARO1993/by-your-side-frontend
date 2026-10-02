/** Hoja ilustrada (propia). El texto va encima, en HTML. */
export function LeafShape({ className, tone = 'leaf' }: { className?: string; tone?: 'leaf' | 'autumn' }) {
  const fill = tone === 'leaf' ? 'oklch(0.78 0.09 135)' : 'oklch(0.8 0.1 70)';
  const vein = tone === 'leaf' ? 'oklch(0.6 0.09 140)' : 'oklch(0.62 0.1 60)';
  return (
    <svg viewBox="0 0 200 90" className={className} aria-hidden="true" focusable="false" preserveAspectRatio="none">
      <path d="M8 45 C 40 2, 140 -4, 192 45 C 140 94, 40 88, 8 45 Z" fill={fill} />
      <path d="M2 45 L 22 45" stroke={vein} strokeWidth="3" strokeLinecap="round" />
      <path d="M22 45 C 70 42, 130 42, 186 45" stroke={vein} strokeWidth="2" fill="none" opacity="0.7" />
      <g stroke={vein} strokeWidth="1.4" opacity="0.45" fill="none">
        <path d="M60 44 C 70 34, 78 28, 90 22" />
        <path d="M60 46 C 70 56, 78 62, 90 68" />
        <path d="M110 44 C 120 34, 128 28, 140 24" />
        <path d="M110 46 C 120 56, 128 62, 140 66" />
      </g>
    </svg>
  );
}
