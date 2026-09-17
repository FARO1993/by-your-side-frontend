import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reactToStatus, removeStatusReaction } from '../api/statuses';
import type { Status, StatusReactionType } from '../api/types';
import Avatar from './Avatar';

const moodLabels: Record<Status['mood'], { label: string; emoji: string }> = {
  WELL: { label: 'está bien', emoji: '🟢' },
  NEED_DISTRACTION: { label: 'necesita distraerse', emoji: '🟡' },
  DIFFICULT_DAY: { label: 'está teniendo un día difícil', emoji: '🟠' },
  NEED_TO_TALK: { label: 'necesita hablar con alguien', emoji: '🔴' },
  HERE_FOR_SOMEONE: { label: 'está acá para quien lo necesite', emoji: '💜' },
};

const reactions: { type: StatusReactionType; label: string }[] = [
  { type: 'WITH_YOU', label: 'Estoy con vos' },
  { type: 'WANT_TO_TALK', label: '¿Querés hablar?' },
  { type: 'HERE_READING', label: 'Te leo' },
  { type: 'NOT_ALONE', label: 'No estás solo/a' },
];

export default function StatusCard({ status: initialStatus }: { status: Status }) {
  const [status, setStatusState] = useState(initialStatus);

  async function handleReact(type: StatusReactionType) {
    try {
      const updated =
        status.reactedByCurrentUser === type
          ? await removeStatusReaction(status.id)
          : await reactToStatus(status.id, type);
      setStatusState(updated);
    } catch {
      // Silencioso, mismo criterio que el resto de la app.
    }
  }

  const mood = moodLabels[status.mood];

  return (
    <div className="mb-3 border-l-2 border-calm bg-white p-3">
      <Link to={`/profile/${status.user.id}`} className="flex items-center gap-2">
        <Avatar avatarUrl={status.user.avatarUrl} name={status.user.displayName || status.user.username} size="sm" />
        <span className="text-sm text-ink">
          <strong>{status.user.displayName || status.user.username}</strong> {mood.emoji} {mood.label}
        </span>
      </Link>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {reactions.map((r) => (
          <button
            key={r.type}
            onClick={() => handleReact(r.type)}
            className={
              status.reactedByCurrentUser === r.type
                ? 'rounded-full bg-calm px-2.5 py-1 text-xs font-medium text-white'
                : 'rounded-full border border-mist px-2.5 py-1 text-xs text-dusk transition-colors hover:border-calm'
            }
          >
            {r.label}
          </button>
        ))}
      </div>

      {status.reactionCount > 0 && (
        <p className="mt-1.5 text-xs text-dusk">
          {status.reactionCount === 1 ? '1 persona respondió' : `${status.reactionCount} personas respondieron`}
        </p>
      )}
    </div>
  );
}