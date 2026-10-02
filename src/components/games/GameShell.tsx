import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

/**
 * Marco común de los juegos de Distraerme: volver siempre a mano, un título
 * y una línea que baja la presión. Sin puntajes globales ni rankings.
 */
export function GameShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start gap-3">
        <button
          type="button"
          aria-label="Volver a Distraerme"
          onClick={() => navigate('/distraerme?jugar=solo')}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-card shadow-soft"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-2xl sm:text-3xl">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {actions ? <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:shrink-0">{actions}</div> : null}
      </header>
      {children}
    </div>
  );
}
