import { Ear } from 'lucide-react';
import { cn } from '../../lib/cn';
import { RESPONSE_OPTIONS, type ResponseKind, type ResponseOption } from '../../lib/visual';
import { PresenceGlyph } from './ui';

export function ResponseActions({
  options = RESPONSE_OPTIONS,
  selectedId,
  onSelect,
  showConfirmation = true,
}: {
  options?: ResponseOption[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  showConfirmation?: boolean;
}) {
  const presence = options.filter((option) => option.kind === 'presence');
  const listening = options.filter((option) => option.kind === 'listening');
  const selected = options.find((option) => option.id === selectedId);

  return (
    <div className="mt-4 space-y-3">
      <ActionRow kind="presence" label="PRESENCIA" options={presence} selectedId={selectedId} onSelect={onSelect} />
      <ActionRow kind="listening" label="ESCUCHA" options={listening} selectedId={selectedId} onSelect={onSelect} />
      {showConfirmation ? <p
        aria-live="polite"
        className={cn(
          'text-sm text-muted-foreground transition-opacity duration-200',
          selected ? 'opacity-100' : 'opacity-0',
        )}
      >
        {selected ? (
          <>
            Le hiciste saber que <strong className="text-foreground">estás de su lado.</strong>
          </>
        ) : (
          '\u00a0'
        )}
      </p> : null}
    </div>
  );
}

function ActionRow({
  kind,
  label,
  options,
  selectedId,
  onSelect,
}: {
  kind: ResponseKind;
  label: string;
  options: typeof RESPONSE_OPTIONS;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const isPresence = kind === 'presence';

  return (
    <div className={cn('rounded-2xl p-3.5', isPresence ? 'bg-presence-soft/40' : 'bg-listening-soft/40')}>
      <div className="mb-3 flex items-center gap-2">
        {isPresence ? (
          <PresenceGlyph className="h-3.5 w-5 text-presence-strong" />
        ) : (
          <Ear className="size-4 text-listening-strong" />
        )}
        <span
          className={cn(
            'text-[0.7rem] font-semibold tracking-[0.12em] uppercase',
            isPresence ? 'text-presence-strong' : 'text-listening-strong',
          )}
        >
          {label}
        </span>
        <span className={cn('h-px flex-1', isPresence ? 'bg-presence/25' : 'bg-listening/25')} />
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = selectedId === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              aria-label={option.intent}
              onClick={() => onSelect(option.id)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm font-medium transition-all duration-200 ease-[var(--ease-calm)] active:translate-y-px',
                active
                  ? cn(
                      'animate-gentle-pop shadow-soft',
                      isPresence
                        ? 'border-presence bg-presence-soft text-presence-strong'
                        : 'border-listening bg-listening-soft text-listening-strong',
                    )
                  : cn(
                      'border-border bg-card text-foreground/80',
                      isPresence ? 'hover:bg-presence-soft' : 'hover:bg-listening-soft',
                    ),
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
