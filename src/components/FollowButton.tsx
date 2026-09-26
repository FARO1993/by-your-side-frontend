import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { followUser, unfollowUser } from '../api/follows';
import { cn } from '../lib/cn';
import { Button } from './byourside/ui';

export default function FollowButton({
  userId,
  initiallyFollowing,
  followingLabel = 'Acompañás',
  followVariant = 'soft',
  size = 'sm',
  fullWidth = false,
  className,
}: {
  userId: string;
  initiallyFollowing: boolean;
  followingLabel?: string;
  followVariant?: 'soft' | 'presence';
  size?: 'sm' | 'md';
  fullWidth?: boolean;
  className?: string;
}) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setSubmitting(true);
    setError(null);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch {
      setError('No se pudo completar la acción.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('inline-flex flex-col gap-1', fullWidth ? 'w-full items-stretch' : 'items-end', className)}>
      <Button
        type="button"
        size={size}
        fullWidth={fullWidth}
        variant={isFollowing ? 'outline' : followVariant}
        loading={submitting}
        aria-pressed={isFollowing}
        onClick={handleClick}
      >
        {isFollowing ? <Check className="size-4" /> : <UserPlus className="size-4" />}
        {isFollowing ? followingLabel : 'Acompañar'}
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
