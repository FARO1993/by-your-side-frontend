import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { LifeBuoy } from 'lucide-react';
import { createReport } from '../../api/reports';
import type { ReportReason, ReportTargetType } from '../../api/types';
import { cn } from '../../lib/cn';
import { Dialog } from '../byourside/dialog';
import { Button } from '../byourside/ui';

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'HARASSMENT', label: 'Me acosa o me hace sentir incómodo/a' },
  { value: 'SELF_HARM_RISK', label: 'Creo que puede estar en riesgo de hacerse daño' },
  { value: 'HATE_SPEECH', label: 'Mensajes de odio o discriminación' },
  { value: 'SPAM', label: 'Spam o publicidad' },
  { value: 'OTHER', label: 'Otro motivo' },
];

const DESCRIPTION_MAX = 1000;

/**
 * Reporte a moderación (POST /api/reports).
 * La persona reportada no recibe ninguna notificación.
 * Si el motivo es riesgo de autolesión, además de reportar se muestran
 * recursos de ayuda inmediata: moderar no reemplaza una urgencia.
 */
export function ReportDialog({
  targetType,
  targetId,
  name,
  onClose,
  onBlock,
  initialReason = null,
}: {
  targetType: ReportTargetType;
  targetId: string;
  name: string;
  onClose: () => void;
  /** Si se pasa, al terminar se ofrece bloquear también. */
  onBlock?: () => void;
  /** Motivo preseleccionado (se puede cambiar). */
  initialReason?: ReportReason | null;
}) {
  const [reason, setReason] = useState<ReportReason | null>(initialReason);
  const [description, setDescription] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!reason) return;
    setSending(true);
    setError(null);
    try {
      await createReport({ targetType, targetId, reason, description });
      setSent(true);
    } catch {
      setError('No pudimos enviar el reporte. Probá de nuevo en un momento.');
    } finally {
      setSending(false);
    }
  }

  const selfHarm = reason === 'SELF_HARM_RISK';

  if (sent) {
    return (
      <Dialog
        title="Gracias por avisarnos"
        description="Vamos a revisarlo con cuidado. La otra persona no se entera de que la reportaste."
        onClose={onClose}
      >
        {selfHarm ? <UrgentHelp /> : null}
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          {onBlock ? (
            <Button type="button" size="sm" variant="outline" onClick={onBlock}>
              Bloquear también
            </Button>
          ) : null}
          <Button type="button" size="sm" onClick={onClose} data-autofocus>
            Listo
          </Button>
        </div>
      </Dialog>
    );
  }

  return (
    <Dialog
      title={`Reportar a ${name}`}
      description="Contanos qué pasa. Lo revisa el equipo de moderación y la otra persona no recibe ningún aviso."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Motivo</legend>
          <div className="space-y-2">
            {REASONS.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm transition-colors',
                  reason === option.value ? 'border-presence bg-presence-soft/60' : 'hover:bg-muted',
                )}
              >
                <input
                  type="radio"
                  name="report-reason"
                  value={option.value}
                  checked={reason === option.value}
                  onChange={() => setReason(option.value)}
                  className="size-4 accent-[var(--presence)]"
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        {selfHarm ? <UrgentHelp /> : null}

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">¿Querés contarnos algo más? (opcional)</span>
          <textarea
            rows={3}
            maxLength={DESCRIPTION_MAX}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="w-full resize-none rounded-xl border border-input bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-presence focus-visible:outline-none"
            placeholder="Por ejemplo, qué mensaje te preocupó."
          />
        </label>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" disabled={!reason} loading={sending}>
            Enviar reporte
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

function UrgentHelp() {
  return (
    <div className="rounded-xl bg-listening-soft p-3 text-sm text-foreground">
      <p className="flex items-start gap-2">
        <LifeBuoy className="mt-0.5 size-4 shrink-0 text-listening-strong" aria-hidden="true" />
        <span>
          Si creés que corre peligro ahora, llamá al <strong>911</strong>. También podés acercarle la línea{' '}
          <strong>135</strong> o la <strong>0800-999-0091</strong>, gratuitas y confidenciales.
        </span>
      </p>
      <Link to="/help" className="mt-2 inline-block font-medium text-listening-strong underline-offset-2 hover:underline">
        Ver todas las líneas de ayuda
      </Link>
    </div>
  );
}
