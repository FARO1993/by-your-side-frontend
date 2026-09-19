import { useState } from 'react';
import { Link } from 'react-router-dom';
import { reactToStatus, removeStatusReaction } from '../api/statuses';
import type { Status, StatusReactionType } from '../api/types';
import { cn } from '../lib/cn';
import { MOOD_TONE_STYLES, STATUS_MOOD_UI, STATUS_RESPONSE_OPTIONS } from '../lib/visual';
import Avatar from './Avatar';
import { ResponseActions } from './byourside/response-actions';

const reactionTypeById: Record<string, StatusReactionType> = {
  'with-you': 'WITH_YOU',
  'not-alone': 'NOT_ALONE',
  reading: 'HERE_READING',
  'tell-more': 'WANT_TO_TALK',
};

const idByReactionType: Partial<Record<StatusReactionType, string>> = {
  WITH_YOU: 'with-you',
  NOT_ALONE: 'not-alone',
  HERE_READING: 'reading',
  WANT_TO_TALK: 'tell-more',
};

export default function StatusCard({ status: initialStatus }: { status: Status }) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string | null>(null);
  const mood = STATUS_MOOD_UI[status.mood];
  const name = status.user.displayName || status.user.username;
  const selected = status.reactedByCurrentUser ? (idByReactionType[status.reactedByCurrentUser] ?? null) : null;

  async function handleSelect(optionId: string) {
    const type = reactionTypeById[optionId];
    if (!type) return;
    const previous = status;
    try {
      setError(null);
      const updated =
        status.reactedByCurrentUser === type ? await removeStatusReaction(status.id) : await reactToStatus(status.id, type);
      setStatus(updated);
    } catch {
      setStatus(previous);
      setError('No pudimos guardar tu respuesta. Probá de nuevo en un momento.');
    }
  }

  return (
    <article className="animate-soft-rise overflow-hidden rounded-2xl bg-card p-5 shadow-soft sm:p-6">
      <Link to={`/profile/${status.user.id}`} className="flex items-center gap-3">
        <Avatar avatarUrl={status.user.avatarUrl} name={name} size="md" />
        <div>
          <p className="font-serif text-base font-semibold">{name}</p>
          <span
            className={cn(
              'mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
              MOOD_TONE_STYLES[mood.tone].chip,
            )}
          >
            <span className={cn('size-1.5 rounded-full', MOOD_TONE_STYLES[mood.tone].dot)} />
            {mood.label}
          </span>
        </div>
      </Link>

      <ResponseActions
        options={STATUS_RESPONSE_OPTIONS}
        selectedId={selected}
        onSelect={handleSelect}
        showConfirmation={false}
      />
      {error ? (
        <p role="alert" className="mt-2 text-xs font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {status.reactionCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">
          {status.reactionCount === 1 ? '1 persona respondió' : `${status.reactionCount} personas respondieron`}
        </p>
      ) : null}
    </article>
  );
}
