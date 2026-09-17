export default function Logo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="18" cy="24" r="14" fill="none" stroke="#E8876F" strokeWidth="3" />
      <circle cx="30" cy="24" r="14" fill="none" stroke="#4F9C8D" strokeWidth="3" />
    </svg>
  );
}