import { cn } from '../lib/cn';
import { isAvatarId } from '../lib/avatars';
import { AvatarArt } from './avatars/AvatarArt';

const tints = [
  'bg-presence-soft text-presence-strong',
  'bg-listening-soft text-listening-strong',
  'bg-muted text-muted-foreground',
] as const;

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase() || '?';
}

function tintFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) hash = (hash + name.charCodeAt(i) * (i + 1)) % 97;
  return tints[hash % tints.length];
}

export default function Avatar({
  avatarId,
  name,
  size = 'md',
  className,
}: {
  /** Uno de los avatares ilustrados; si no hay (o no se reconoce), iniciales. */
  avatarId?: string | null;
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClass = { sm: 'size-9 text-sm', md: 'size-11 text-base', lg: 'size-16 text-xl' }[size];
  const illustrated = isAvatarId(avatarId) ? avatarId : null;

  return (
    <div
      aria-hidden="true"
      className={cn(
        'overflow-hidden rounded-full font-medium ring-1 ring-foreground/[0.06]',
        sizeClass,
        !illustrated && tintFor(name),
        className,
      )}
    >
      {illustrated ? (
        <AvatarArt id={illustrated} className="size-full" />
      ) : (
        <span className="flex size-full items-center justify-center">{initialsFrom(name)}</span>
      )}
    </div>
  );
}
