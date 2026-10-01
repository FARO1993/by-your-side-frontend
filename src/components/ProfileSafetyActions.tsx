import { useState } from 'react';
import { Dialog } from './byourside/dialog';
import { Button } from './byourside/ui';
import { ReportDialog } from './safety/ReportDialog';

export default function ProfileSafetyActions({
  userId,
  name,
  blocked,
  muted,
  onBlock,
  onUnblock,
  onMute,
  onUnmute,
}: {
  /** Si se pasa, se ofrece reportar a la persona. */
  userId?: string;
  name: string;
  blocked: boolean;
  muted: boolean;
  onBlock: () => Promise<void>;
  onUnblock: () => Promise<void>;
  onMute: () => Promise<void>;
  onUnmute: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setWorking(true);
    setError(null);
    try {
      await action();
      setOpen(false);
      setConfirming(false);
    } catch {
      setError('No pudimos actualizar esa relación.');
    } finally {
      setWorking(false);
    }
  }

  if (blocked) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">Bloqueaste a esta persona.</p>
        <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => void run(onUnblock)}>
          Desbloquear
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        aria-expanded={open}
        onClick={() => {
          setError(null);
          setOpen((current) => !current);
        }}
      >
        Más acciones
      </Button>
      {open ? (
        <div className="mt-2 space-y-2 rounded-2xl bg-muted/60 p-3">
          <p className="text-sm text-muted-foreground">Silenciar la saca de las listas. No impide ver su perfil ni escribirle.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => void run(muted ? onUnmute : onMute)}>
              {muted ? 'Dejar de silenciar' : 'Silenciar'}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => setConfirming(true)}>
              Bloquear
            </Button>
            {userId ? (
              <Button type="button" size="sm" variant="outline" disabled={working} onClick={() => setReporting(true)}>
                Reportar
              </Button>
            ) : null}
          </div>
          {error ? (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
      {reporting && userId ? (
        <ReportDialog
          targetType="USER"
          targetId={userId}
          name={name}
          onClose={() => setReporting(false)}
          onBlock={() => {
            setReporting(false);
            setConfirming(true);
          }}
        />
      ) : null}
      {confirming ? (
        <Dialog
          title={`Bloquear a ${name}`}
          description="Van a dejar de verse y de interactuar. Las solicitudes pendientes se cancelan."
          onClose={() => setConfirming(false)}
        >
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="presence" disabled={working} onClick={() => void run(onBlock)}>
              Bloquear
            </Button>
            <Button type="button" size="sm" variant="outline" data-autofocus disabled={working} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </div>
        </Dialog>
      ) : null}
    </div>
  );
}
