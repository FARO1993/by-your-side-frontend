export default function LogoFull() {
  return (
    <svg viewBox="0 0 400 120" className="h-24 w-auto" role="img" aria-label="ByYourSide">
      <g transform="translate(10,28) scale(1.3)">
        <circle cx="18" cy="24" r="14" fill="none" stroke="#E8876F" strokeWidth="3" />
        <circle cx="30" cy="24" r="14" fill="none" stroke="#4F9C8D" strokeWidth="3" />
      </g>
      <text x="120" y="60" fontFamily="Fraunces, Georgia, serif" fontSize="36" fontWeight="600" fill="#1E2233">
        ByYourSide
      </text>
      <text x="120" y="85" fontFamily="Inter, system-ui, sans-serif" fontSize="15" fill="#4C5578">
        No tenés que atravesarlo solo/a
      </text>
    </svg>
  );
}