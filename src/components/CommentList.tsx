import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDraft } from '../hooks/useDraft';
import { draftKey } from '../lib/drafts';
import { friendlyError } from '../lib/friendlyError';
import { getComments, createComment } from '../api/comments';
import type { Comment } from '../api/types';
import { timeAgo } from '../lib/timeAgo';
import Avatar from './Avatar';
import { DraftNotice } from './byourside/draft-notice';
import { CrisisNotice } from './safety/CrisisNotice';
import { Button } from './byourside/ui';

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const { user } = useAuth();
  const { text: content, setText: setContent, discard, restored } = useDraft(draftKey(user?.id, `comment:${postId}`));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getComments(postId)
      .then(setComments)
      .catch(() => setError('No pudimos traer las respuestas. Probá de nuevo en un rato.'))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    try {
      const comment = await createComment(postId, { content });
      setContent('');
      setComments((prev) => [...prev, comment]);
    } catch (err) {
      setError(friendlyError(err, 'No pudimos enviar tu respuesta. Tu texto sigue acá, podés intentar de nuevo.'));
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? (
        <div role="status" aria-label="Cargando respuestas" className="space-y-3">
          {[0, 1].map((index) => (
            <div key={index} aria-hidden="true" className="flex gap-3">
              <div className="size-9 shrink-0 rounded-full skeleton" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-1/4 rounded-full skeleton" />
                <div className="h-3 w-3/4 rounded-full skeleton" />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      {comments.map((comment) => {
        const name = comment.author.displayName || comment.author.username;
        return (
          <div key={comment.id} className="flex gap-3">
            <Avatar avatarUrl={comment.author.avatarUrl} name={name} size="sm" />
            <div className="min-w-0 flex-1 rounded-xl bg-muted/60 px-3 py-2">
              <div className="flex items-baseline justify-between gap-2">
                <strong className="text-sm text-foreground">{name}</strong>
                <time className="text-[0.7rem] text-muted-foreground">{timeAgo(comment.createdAt)}</time>
              </div>
              <p className="text-sm leading-relaxed text-foreground/80">{comment.content}</p>
            </div>
          </div>
        );
      })}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <input
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Escribí una respuesta…"
          maxLength={500}
          required
          className="min-h-11 flex-1 rounded-xl border border-input bg-card px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-presence focus-visible:outline-none"
        />
        <Button type="submit" size="sm" variant="listening">
          Responder
        </Button>
      </form>
      <CrisisNotice text={content} />
      {restored ? <DraftNotice restored hasText={content.trim() !== ''} onDiscard={discard} /> : null}
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
