import { useId, useState } from 'react';
import { Ear } from 'lucide-react';
import type { PostResponseType } from '../../api/types';
import { cn } from '../../lib/cn';
import { isListeningResponse, POST_RESPONSES, postResponseLabel, type PostResponseFamily } from '../../lib/postResponse';
import { PresenceGlyph } from './ui';

export function PostResponseMenu({
  value,
  disabled = false,
  onSelect,
}: {
  value: PostResponseType | null;
  disabled?: boolean;
  onSelect: (type: PostResponseType) => void;
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const activeLabel = value ? postResponseLabel(value) : null;
  const choose = (type: PostResponseType) => {
    onSelect(type);
    setOpen(false);
  };
  const presence = POST_RESPONSES.filter((choice) => choice.family === 'presence');
  const listening = POST_RESPONSES.filter((choice) => choice.family === 'listening');

  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        aria-pressed={value !== null}
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') setOpen(false);
        }}
        className={cn(
          'min-h-11 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening',
          value && isListeningResponse(value)
            ? 'border-listening/40 bg-listening-soft text-listening-strong'
            : value
              ? 'border-presence/40 bg-presence-soft text-presence-strong'
              : 'border-border bg-card text-foreground/80 hover:bg-presence-soft/60',
        )}
      >
        {activeLabel ?? 'Estoy acá'}
      </button>
      {open ? (
        <div
          id={panelId}
          className="mt-3 space-y-3"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.stopPropagation();
              setOpen(false);
            }
          }}
        >
          <ResponseGroup
            family="presence"
            label="Presencia"
            choices={presence}
            value={value}
            disabled={disabled}
            onSelect={choose}
          />
          <ResponseGroup
            family="listening"
            label="Escucha"
            choices={listening}
            value={value}
            disabled={disabled}
            onSelect={choose}
          />
        </div>
      ) : null}
    </div>
  );
}

function ResponseGroup({
  family,
  label,
  choices,
  value,
  disabled,
  onSelect,
}: {
  family: PostResponseFamily;
  label: string;
  choices: typeof POST_RESPONSES;
  value: PostResponseType | null;
  disabled: boolean;
  onSelect: (type: PostResponseType) => void;
}) {
  const presence = family === 'presence';

  return (
    <div role="group" aria-label={label} className={cn('rounded-2xl p-3', presence ? 'bg-presence-soft/40' : 'bg-listening-soft/40')}>
      <div className="mb-2 flex items-center gap-2">
        {presence ? <PresenceGlyph className="h-3.5 w-5 text-presence-strong" /> : <Ear className="size-4 text-listening-strong" />}
        <span className={cn('text-xs font-semibold', presence ? 'text-presence-strong' : 'text-listening-strong')}>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {choices.map((choice) => {
          const active = value === choice.type;
          return (
            <button
              key={choice.type}
              type="button"
              aria-pressed={active}
              disabled={disabled}
              onClick={() => onSelect(choice.type)}
              className={cn(
                'min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening',
                active
                  ? presence
                    ? 'border-presence bg-presence-soft text-presence-strong'
                    : 'border-listening bg-listening-soft text-listening-strong'
                  : 'border-border bg-card text-foreground/80',
              )}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
