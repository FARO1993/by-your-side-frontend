import { useId, type ComponentPropsWithoutRef, type ElementType, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'presence' | 'listening' | 'outline' | 'ghost' | 'soft';
type ButtonSize = 'sm' | 'md' | 'lg';
type BadgeTone = 'neutral' | 'presence' | 'listening';

const buttonVariantClass: Record<ButtonVariant, string> = {
  presence: 'bg-presence text-presence-foreground shadow-soft hover:brightness-[1.03]',
  listening: 'bg-listening text-listening-foreground shadow-soft hover:brightness-[1.03]',
  outline: 'border border-border bg-card text-foreground hover:bg-muted',
  ghost: 'text-foreground/80 hover:bg-muted hover:text-foreground',
  soft: 'bg-presence-soft text-presence-strong hover:brightness-[0.98]',
};

const buttonSizeClass: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3.5 text-sm',
  md: 'min-h-11 px-5 text-sm',
  lg: 'min-h-12 px-6 text-base',
};

export function PresenceGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={className} aria-hidden="true">
      <circle cx="9" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="15" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

export function Spinner({ label = 'Cargando', className }: { label?: string; className?: string }) {
  return (
    <span className={cn('inline-flex items-center justify-center', className)} role="status">
      <Loader2 className="size-4 animate-spin text-presence" aria-hidden="true" />
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
        'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 ease-[var(--ease-calm)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none',
        buttonVariantClass[variant],
        buttonSizeClass[size],
        fullWidth ? 'w-full' : undefined,
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
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
}: ComponentPropsWithoutRef<'button'> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(
        'relative inline-flex size-10 items-center justify-center rounded-full text-foreground/80 transition-colors duration-200 ease-[var(--ease-calm)] hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none',
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
  suffix,
  id,
  className,
  disabled,
  ...props
}: ComponentPropsWithoutRef<'input'> & {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  suffix?: ReactNode;
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
          <span className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'min-h-11 w-full rounded-xl border border-input bg-card px-3.5 text-[0.975rem] text-foreground placeholder:text-muted-foreground focus:border-presence focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
            icon ? 'pl-10' : undefined,
            suffix ? 'pr-12' : undefined,
            error ? 'border-destructive' : undefined,
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="absolute inset-y-0 right-1 flex items-center">{suffix}</span>
        ) : null}
      </div>
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
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
  label?: string;
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
      {label ? (
        <label htmlFor={areaId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      ) : null}
      <textarea
        id={areaId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'w-full resize-none rounded-xl border border-input bg-card p-3.5 text-[0.975rem] leading-relaxed text-foreground placeholder:text-muted-foreground focus:border-presence focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-destructive' : undefined,
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={errorId} className="text-xs font-medium text-destructive">
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
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        tone === 'neutral' ? 'bg-muted text-muted-foreground ring-border' : undefined,
        tone === 'presence' ? 'bg-presence-soft text-presence-strong ring-presence/25' : undefined,
        tone === 'listening' ? 'bg-listening-soft text-listening-strong ring-listening/25' : undefined,
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
  icon?: ReactNode | null;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('animate-soft-rise rounded-2xl bg-card p-10 text-center shadow-soft', className)}>
      {icon !== null ? (
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-presence-soft text-presence-strong">
          {icon ?? <PresenceGlyph className="h-4 w-6" />}
        </div>
      ) : null}
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {description ? (
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  title = 'Algo no salió como esperábamos',
  description = 'No pudimos cargar esto ahora. Podés intentarlo de nuevo en un momento.',
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
      className={cn('rounded-2xl border border-border/60 bg-card p-8 text-center shadow-soft', className)}
    >
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      {description ? <p className="mt-2 text-sm text-muted-foreground">{description}</p> : null}
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

export function SectionTitle({ className, children, ...props }: ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2 className={cn('font-serif text-lg font-semibold text-foreground', className)} {...props}>
      {children}
    </h2>
  );
}