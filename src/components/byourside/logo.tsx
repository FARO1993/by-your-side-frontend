import { cn } from '../../lib/cn';

export function Logo({
  className,
  wordmark = false,
}: {
  className?: string;
  wordmark?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 44 28" className="h-6 w-auto" aria-hidden="true">
        <circle cx="16" cy="14" r="11" fill="none" stroke="var(--presence)" strokeWidth="2.5" />
        <circle cx="28" cy="14" r="11" fill="none" stroke="var(--listening)" strokeWidth="2.5" />
      </svg>
      {wordmark ? (
        <span className="font-serif text-lg font-semibold tracking-tight text-foreground">ByYourSide</span>
      ) : null}
    </span>
  );
}
