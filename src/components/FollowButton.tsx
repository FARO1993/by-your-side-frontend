import { useState } from 'react';
import { Check, UserPlus } from 'lucide-react';
import { followUser, unfollowUser } from '../api/follows';
import { Button } from './byourside/ui';

export default function FollowButton({
  userId,
  initiallyFollowing,
}: {
  userId: string;
  initiallyFollowing: boolean;
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
    <div className="inline-flex flex-col items-end gap-1">
      <Button
        type="button"
        size="sm"
        variant={isFollowing ? 'outline' : 'soft'}
        loading={submitting}
        aria-pressed={isFollowing}
        onClick={handleClick}
      >
        {isFollowing ? <Check className="size-4" /> : <UserPlus className="size-4" />}
        {isFollowing ? 'Acompañás' : 'Acompañar'}
      </Button>
      {error ? (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
