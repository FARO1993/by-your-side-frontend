import { useId } from 'react';
import { cn } from '../../lib/cn';
import { AVATAR_IDS, AVATAR_LABELS, type AvatarId } from '../../lib/avatars';
import Avatar from '../Avatar';
import { AvatarArt } from './AvatarArt';

/**
 * Grilla para elegir avatar: los ilustrados y, al principio, las iniciales.
 * Son radios nativos (se puede usar con teclado: flechas para moverse).
 */
export function AvatarPicker({
  value,
  onChange,
  name,
}: {
  value: AvatarId | null;
  onChange: (value: AvatarId | null) => void;
  /** Nombre de la persona, para mostrar cómo se ven sus iniciales. */
  name: string;
}) {
  const group = useId();
  const option = (id: AvatarId | null, label: string, art: React.ReactNode) => {
    const checked = value === id;
    return (
      <label
        key={id ?? 'iniciales'}
        className={cn(
          'flex cursor-pointer flex-col items-center gap-1 rounded-2xl p-1.5 text-center text-[0.7rem] text-muted-foreground transition-colors',
          'has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring',
          checked ? 'bg-listening-soft text-foreground' : 'hover:bg-muted',
        )}
      >
        <input
          type="radio"
          name={group}
          className="sr-only"
          checked={checked}
          onChange={() => onChange(id)}
          aria-label={label}
        />
        <span className={cn('block size-12 rounded-full sm:size-14', checked && 'ring-2 ring-listening ring-offset-2 ring-offset-card')}>
          {art}
        </span>
        <span aria-hidden="true">{label}</span>
      </label>
    );
  };

  return (
    <div role="radiogroup" aria-label="Avatares" className="grid grid-cols-4 gap-1.5 sm:grid-cols-5">
      {option(null, 'Iniciales', <Avatar name={name} className="size-full" />)}
      {AVATAR_IDS.map((id) => option(id, AVATAR_LABELS[id], <AvatarArt id={id} className="size-full" />))}
    </div>
  );
}
