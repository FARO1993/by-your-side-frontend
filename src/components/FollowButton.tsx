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
      // Silencioso a proposito: si falla (ej. ya lo segu is, race condition),
      // no rompemos la UI. El estado real se puede resincronizar en el
      // proximo refresh del feed.
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <button onClick={handleClick} disabled={submitting}>
      {isFollowing ? 'Dejar de seguir' : 'Seguir'}
    </button>
  );
}