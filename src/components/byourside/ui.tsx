import { useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'presence' | 'listening' | 'outline' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';
type BadgeTone = 'neutral' | 'presence' | 'listening';

const buttonVariantClass: Record<ButtonVariant, string> = {
  presence:
    'bg-presence text-presence-foreground hover:bg-presence-strong focus-visible:outline-ring',
  listening:
    'bg-listening text-listening-foreground hover:bg-listening-strong focus-visible:outline-ring',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-muted focus-visible:outline-ring',
  ghost: 'bg-transparent text-foreground hover:bg-muted focus-visible:outline-ring',
  soft: 'bg-presence-soft text-presence-strong hover:bg-muted focus-visible:outline-ring',
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
};

export function PresenceGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <circle cx="18" cy="24" r="14" fill="none" stroke="var(--presence)" strokeWidth="3" />
      <circle cx="30" cy="24" r="14" fill="none" stroke="var(--listening)" strokeWidth="3" />
    </svg>
  );
}

export function Spinner({ label = 'Cargando', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)} role="status">
      <span
        className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Button({
  variant = 'presence',
  size = 'md',
  loading = false,
  fullWidth = false,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-[var(--ease-calm)] active:translate-y-px disabled:pointer-events-none disabled:opacity-60',
        buttonVariantClass[variant],
        buttonSizeClass[size],
        fullWidth ? 'w-full' : undefined,
        className,
      )}
      {...props}
    >
      {loading ? <Spinner label="Cargando" /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  label,
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ComponentPropsWithoutRef<'button'> & {
  label: string;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'relative inline-flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 ease-[var(--ease-calm)] hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:translate-y-px disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextField({
  label,
  hint,
  error,
  icon,
  id,
  className,
  disabled,
  ...props
}: ComponentPropsWithoutRef<'input'> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-xl border border-input bg-card px-4 py-2.5 text-[0.975rem] text-foreground placeholder:text-muted-foreground transition-all duration-200 ease-[var(--ease-calm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60',
            icon ? 'pl-10' : undefined,
            error ? 'border-destructive' : undefined,
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function TextArea({
  label,
  hint,
  error,
  id,
  className,
  disabled,
  ...props
}: ComponentPropsWithoutRef<'textarea'> & {
  label: string;
  hint?: string;
  error?: string;
}) {
  const generatedId = useId();
  const areaId = id ?? generatedId;
  const hintId = hint ? `${areaId}-hint` : undefined;
  const errorId = error ? `${areaId}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={areaId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <textarea
        id={areaId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full resize-none rounded-xl border border-input bg-card px-4 py-3 text-[0.975rem] leading-relaxed text-foreground placeholder:text-muted-foreground transition-all duration-200 ease-[var(--ease-calm)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-60',
          error ? 'border-destructive' : undefined,
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Badge({
  tone = 'neutral',
  className,
  children,
}: {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        tone === 'neutral' ? 'bg-muted text-muted-foreground' : undefined,
        tone === 'presence' ? 'bg-presence-soft text-presence-strong' : undefined,
        tone === 'listening' ? 'bg-listening-soft text-listening-strong' : undefined,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card<T extends ElementType = 'div'>({
  as,
  className,
  ...props
}: {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className'>) {
  const Comp = as ?? 'div';
  return <Comp className={cn('rounded-2xl bg-card shadow-soft', className)} {...props} />;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex animate-soft-rise flex-col items-center px-4 py-10 text-center', className)}>
      {icon ? <div className="mb-4 text-muted-foreground">{icon}</div> : null}
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Algo salió mal',
  description,
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex animate-soft-rise flex-col items-center rounded-2xl bg-card px-4 py-8 text-center shadow-soft',
        className,
      )}
    >
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p> : null}
      {onRetry ? (
        <div className="mt-5">
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            Reintentar
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function SectionTitle({
  className,
  children,
  ...props
}: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2 className={cn('font-serif text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h2>
  );
}
