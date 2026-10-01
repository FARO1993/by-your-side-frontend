import { cn } from '../../lib/cn';

/**
 * Aviso discreto sobre el borrador de un campo de texto.
 * - Si el texto vino de un borrador anterior: lo dice y ofrece descartarlo.
 * - Si no, y hay texto: indica que se está guardando en este dispositivo.
 */
export function DraftNotice({
  restored,
  hasText,
  onDiscard,
  className,
}: {
  restored: boolean;
  hasText: boolean;
  onDiscard: () => void;
  className?: string;
}) {
  if (!hasText) return null;

  if (restored) {
    return (
      <p role="status" className={cn('flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground', className)}>
        <span>Recuperamos lo que estabas escribiendo.</span>
        <button
          type="button"
          onClick={onDiscard}
          className="font-medium text-listening-strong underline-offset-2 hover:underline"
        >
          Descartar
        </button>
      </p>
    );
  }

  return <p className={cn('text-xs text-muted-foreground', className)}>Borrador guardado en este dispositivo.</p>;
}
