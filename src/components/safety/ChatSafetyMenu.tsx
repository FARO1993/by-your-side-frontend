import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ban, BellOff, Bell, Flag, MoreVertical, User } from 'lucide-react';
import { blockUser, unblockUser } from '../../api/blocks';
import { muteUser, unmuteUser } from '../../api/mutes';
import { cn } from '../../lib/cn';
import { Dialog } from '../byourside/dialog';
import { Button, IconButton } from '../byourside/ui';
import { ReportDialog } from './ReportDialog';

export type ChatRelation = { blocked: boolean; muted: boolean };

type MenuItem = {
  id: string;
  label: string;
  icon: typeof User;
  onSelect: () => void;
  tone?: 'danger';
};

/**
 * Menú de acciones de seguridad dentro de una conversación:
 * ver perfil, silenciar, bloquear y reportar.
 *
 * `relation` es null cuando no la conocemos (todavía cargando, o la otra
 * persona no es visible): en ese caso solo se ofrecen ver perfil y reportar.
 * Nunca se deduce ni se muestra si la otra persona nos bloqueó.
 */
export function ChatSafetyMenu({
  userId,
  name,
  relation,
  onRelationChange,
}: {
  userId: string;
  name: string;
  relation: ChatRelation | null;
  onRelationChange: (relation: ChatRelation) => void;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<'block' | 'report' | null>(null);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState('');
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    menu.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (!menu.current?.contains(target) && !trigger.current?.contains(target)) setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  function closeMenu(returnFocus = true) {
    setOpen(false);
    if (returnFocus) trigger.current?.focus();
  }

  async function run(action: () => Promise<void>, next: ChatRelation, message: string) {
    setWorking(true);
    setError(null);
    try {
      await action();
      onRelationChange(next);
      setAnnouncement(message);
      setDialog(null);
    } catch {
      setError('No pudimos actualizar esa relación. Probá de nuevo.');
    } finally {
      setWorking(false);
    }
  }

  const items: MenuItem[] = [
    { id: 'profile', label: 'Ver perfil', icon: User, onSelect: () => navigate(`/profile/${userId}`) },
  ];
  if (relation) {
    items.push(
      relation.muted
        ? {
            id: 'unmute',
            label: 'Dejar de silenciar',
            icon: Bell,
            onSelect: () =>
              void run(() => unmuteUser(userId), { ...relation, muted: false }, `Dejaste de silenciar a ${name}.`),
          }
        : {
            id: 'mute',
            label: 'Silenciar',
            icon: BellOff,
            onSelect: () =>
              void run(
                () => muteUser(userId),
                { ...relation, muted: true },
                `Silenciaste a ${name}. No va a aparecer en tus listas, y podés seguir escribiéndole.`,
              ),
          },
      relation.blocked
        ? {
            id: 'unblock',
            label: 'Desbloquear',
            icon: Ban,
            onSelect: () =>
              void run(() => unblockUser(userId), { ...relation, blocked: false }, `Desbloqueaste a ${name}.`),
          }
        : { id: 'block', label: 'Bloquear', icon: Ban, onSelect: () => setDialog('block'), tone: 'danger' },
    );
  }
  items.push({ id: 'report', label: 'Reportar', icon: Flag, onSelect: () => setDialog('report'), tone: 'danger' });

  function onMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const nodes = Array.from(menu.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []);
    const index = nodes.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      nodes[(index + 1) % nodes.length]?.focus();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      nodes[0]?.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      nodes[nodes.length - 1]?.focus();
    } else if (event.key === 'Tab') {
      closeMenu(false);
    }
  }

  return (
    <div className="relative ml-auto">
      <IconButton
        ref={trigger}
        label={`Opciones de la conversación con ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setError(null);
          setOpen((current) => !current);
        }}
      >
        <MoreVertical className="size-5" />
      </IconButton>

      {open ? (
        <div
          ref={menu}
          role="menu"
          aria-label={`Opciones con ${name}`}
          onKeyDown={onMenuKeyDown}
          className="absolute top-full right-0 z-40 mt-1 w-56 overflow-hidden rounded-2xl border border-border/60 bg-popover p-1.5 text-popover-foreground shadow-lift animate-soft-rise"
        >
          {items.map(({ id, label, icon: Icon, onSelect, tone }) => (
            <button
              key={id}
              type="button"
              role="menuitem"
              tabIndex={-1}
              disabled={working}
              onClick={() => {
                closeMenu(false);
                onSelect();
              }}
              className={cn(
                'flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none disabled:opacity-50',
                tone === 'danger' ? 'text-destructive' : 'text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      ) : null}

      <p role="status" className="sr-only">
        {announcement}
      </p>
      {error && !dialog ? (
        <p role="alert" className="absolute top-full right-0 z-30 mt-1 w-64 rounded-xl bg-card p-3 text-sm text-destructive shadow-soft">
          {error}
        </p>
      ) : null}

      {dialog === 'block' && relation ? (
        <Dialog
          title={`Bloquear a ${name}`}
          description="No van a poder escribirse ni verse en la app. La conversación de hasta ahora queda guardada para vos. Podés desbloquear cuando quieras."
          onClose={() => setDialog(null)}
        >
          {error ? (
            <p role="alert" className="mb-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" size="sm" variant="outline" data-autofocus onClick={() => setDialog(null)}>
              Cancelar
            </Button>
            <Button
              type="button"
              size="sm"
              loading={working}
              onClick={() =>
                void run(() => blockUser(userId), { ...relation, blocked: true }, `Bloqueaste a ${name}.`)
              }
            >
              Bloquear
            </Button>
          </div>
        </Dialog>
      ) : null}

      {dialog === 'report' ? (
        <ReportDialog
          targetType="USER"
          targetId={userId}
          name={name}
          onClose={() => setDialog(null)}
          onBlock={relation && !relation.blocked ? () => setDialog('block') : undefined}
        />
      ) : null}
    </div>
  );
}
