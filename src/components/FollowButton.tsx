import { useState } from 'react';
import { followUser, unfollowUser } from '../api/follows';

export default function FollowButton({
  userId,
  initiallyFollowing,
}: {
  userId: string;
  initiallyFollowing: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [submitting, setSubmitting] = useState(false);

  async function handleClick() {
    setSubmitting(true);
    try {
      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch {
      // Silencioso a proposito: ver nota en la version anterior de este archivo.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={submitting}
      className={
        isFollowing
          ? 'rounded-md border border-mist px-3 py-1 text-sm font-medium text-dusk transition-colors hover:border-dusk disabled:opacity-60'
          : 'rounded-md bg-horizon px-3 py-1 text-sm font-medium text-white transition-colors hover:bg-horizon/90 disabled:opacity-60'
      }
    >
      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
    </button>
  );
}