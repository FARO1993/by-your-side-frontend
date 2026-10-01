import { Link } from 'react-router-dom';
import { HeartHandshake } from 'lucide-react';
import { Button } from '../byourside/ui';

/**
 * Orientación para quien acompaña cuando la otra persona escribió algo con
 * señales de crisis. Se calcula solo en este dispositivo; no avisa a nadie.
 * Reportar es opcional y siempre lo decide quien acompaña.
 */
export function CompanionCrisisGuide({
  name,
  onReport,
  onDismiss,
}: {
  name: string;
  onReport: () => void;
  onDismiss: () => void;
}) {
  return (
    <section
      aria-label={`Cómo acompañar a ${name} ahora`}
      className="border-t border-border/60 bg-listening-soft/70 p-4 text-sm text-foreground animate-soft-rise"
    >
      <p className="flex items-start gap-2.5 font-medium">
        <HeartHandshake className="mt-0.5 size-4 shrink-0 text-listening-strong" aria-hidden="true" />
        Lo que escribió {name} suena muy difícil. Así podés acompañar:
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-11 text-foreground/85 marker:text-listening-strong">
        <li>Preguntale directamente cómo está y si está a salvo. Preguntar no empeora las cosas.</li>
        <li>Quedate en la charla y escuchá; no hace falta tener respuestas.</li>
        <li>
          Acercale el <strong>135</strong> (gratuito y confidencial). Si corre peligro ahora, el <strong>911</strong>.
        </li>
      </ul>
      <p className="mt-2 pl-6.5 text-xs text-muted-foreground">Vos tampoco tenés que cargar con esto en soledad.</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 pl-6.5">
        <Button type="button" size="sm" variant="listening" onClick={onReport}>
          Avisar al equipo
        </Button>
        <Link
          to="/help"
          className="inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3.5 text-sm font-medium"
        >
          Ver líneas de ayuda
        </Link>
        <button
          type="button"
          onClick={onDismiss}
          className="min-h-9 px-2 text-sm text-muted-foreground underline-offset-2 hover:underline"
        >
          Entendido
        </button>
      </div>
    </section>
  );
}
