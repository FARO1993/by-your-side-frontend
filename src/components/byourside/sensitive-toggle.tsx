import { useId } from 'react';
import { EyeOff } from 'lucide-react';
import { hasCrisisSignal } from '../../lib/crisisSignals';
import { cn } from '../../lib/cn';

/**
 * "Contenido sensible": el post se ve difuminado y cada persona elige si
 * leerlo. Si el texto tiene señales de crisis, se sugiere (nunca se impone).
 */
export function SensitiveToggle({
  checked,
  onChange,
  text,
  compact = false,
  className,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Texto del post, para sugerir la advertencia cuando hace falta. */
  text: string;
  compact?: boolean;
  className?: string;
}) {
  const id = useId();
  const hintId = useId();
  const suggest = !checked && hasCrisisSignal(text);

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={cn(
          'inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 text-sm whitespace-nowrap transition-colors',
          compact ? 'min-h-9' : 'min-h-11',
          checked ? 'border-presence/40 bg-presence-soft text-presence-strong' : 'border-border bg-background text-foreground/80',
        )}
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          aria-describedby={compact ? undefined : hintId}
          className="size-4 accent-[var(--presence)]"
        />
        <EyeOff className="size-4" aria-hidden="true" />
        Contenido sensible
      </label>
      {compact ? null : (
        <p id={hintId} className="mt-1.5 text-xs text-muted-foreground">
          {suggest
            ? 'Lo que contás puede ser difícil de leer para alguien. Si querés, marcalo como sensible: se va a ver difuminado y cada persona elige si abrirlo.'
            : 'Se ve difuminado y cada persona elige si abrirlo. Quién puede verlo no cambia.'}
        </p>
      )}
    </div>
  );
}
