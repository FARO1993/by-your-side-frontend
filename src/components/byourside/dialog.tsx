import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { trapTabKey } from '../../lib/focusTrap';

/**
 * Diálogo modal liviano: overlay, Escape para cerrar, foco inicial adentro,
 * Tab encerrado en el panel y devolución del foco al elemento que lo abrió.
 * En mobile se apoya abajo (tipo sheet); en desktop queda centrado.
 *
 * Se renderiza en un portal sobre <body>: si un ancestro tiene
 * backdrop-filter/transform (ej. headers con backdrop-blur), un `fixed`
 * adentro quedaría encerrado en ese ancestro en vez de cubrir la pantalla.
 */
export function Dialog({
  title,
  description,
  onClose,
  children,
  className,
}: {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = panel.current;
    if (node && !node.contains(document.activeElement)) {
      // Prioridad explícita: lo marcado con data-autofocus gana (ej. "Cancelar"
      // en acciones destructivas), después el primer control.
      const preferred =
        node.querySelector<HTMLElement>('[data-autofocus], [autofocus]') ??
        node.querySelector<HTMLElement>('button, textarea, input, select, a[href]');
      (preferred ?? node).focus();
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onCloseRef.current();
      else trapTabKey(event, panel.current);
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-overlay p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-card p-5 shadow-lift animate-soft-rise focus-visible:outline-none sm:p-6',
          className,
        )}
      >
        <h2 id={titleId} className="font-serif text-xl">
          {title}
        </h2>
        {description ? (
          <div id={descriptionId} className="mt-2 text-sm text-muted-foreground">
            {description}
          </div>
        ) : null}
        <div className="mt-4">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
