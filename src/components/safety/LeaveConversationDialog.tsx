import { useState } from 'react';
import { cn } from '../../lib/cn';
import { GOODBYE_MESSAGES } from '../../lib/goodbyes';
import { Dialog } from '../byourside/dialog';
import { Button } from '../byourside/ui';

/**
 * "Necesito irme": salir de una conversación sin culpa.
 * Se puede mandar una despedida ya escrita o simplemente salir;
 * las dos opciones son igual de válidas y ninguna avisa nada más.
 */
export function LeaveConversationDialog({
  name,
  onSendAndLeave,
  onLeave,
  onClose,
}: {
  name: string;
  onSendAndLeave: (message: string) => Promise<void>;
  onLeave: () => void;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<string>(GOODBYE_MESSAGES[0]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendAndLeave() {
    setSending(true);
    setError(null);
    try {
      await onSendAndLeave(selected);
    } catch {
      setError('No pudimos enviar la despedida. Podés salir igual.');
      setSending(false);
    }
  }

  return (
    <Dialog
      title="Está bien irse"
      description={`Cuidarte también es poner un límite. Podés despedirte de ${name} o salir sin decir nada.`}
      onClose={onClose}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-medium">Despedida</legend>
        <div className="space-y-2">
          {GOODBYE_MESSAGES.map((message) => (
            <label
              key={message}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-border px-3 py-2 text-sm transition-colors',
                selected === message ? 'border-listening bg-listening-soft/70' : 'hover:bg-muted',
              )}
            >
              <input
                type="radio"
                name="goodbye-message"
                value={message}
                checked={selected === message}
                onChange={() => setSelected(message)}
                className="size-4 accent-[var(--listening)]"
              />
              {message}
            </label>
          ))}
        </div>
      </fieldset>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={onLeave}>
          Salir sin enviar
        </Button>
        <Button type="button" size="sm" variant="listening" loading={sending} data-autofocus onClick={() => void sendAndLeave()}>
          Enviar y salir
        </Button>
      </div>
    </Dialog>
  );
}
