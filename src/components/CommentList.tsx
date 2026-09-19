import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { getComments, createComment } from '../api/comments';
import type { Comment, ApiErrorResponse } from '../api/types';
import { timeAgo } from '../lib/timeAgo';
import Avatar from './Avatar';
import { Button } from './byourside/ui';

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getComments(postId)
      .then(setComments)
      .catch(() => setError('No se pudieron cargar las respuestas'))
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
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al responder');
      } else {
        setError('Error al responder');
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading ? <p className="text-sm text-muted-foreground">Cargando respuestas…</p> : null}
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
      {error ? <p className="text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}
