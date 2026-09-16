import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { getComments, createComment } from '../api/comments';
import type { Comment, ApiErrorResponse } from '../api/types';

export default function CommentList({ postId }: { postId: string }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getComments(postId)
      .then(setComments)
      .catch(() => setError('No se pudieron cargar los comentarios'))
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
        setError(err.response?.data.message ?? 'Error al comentar');
      } else {
        setError('Error al comentar');
      }
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {loading && <p className="text-sm text-dusk">Cargando comentarios...</p>}

      {comments.map((comment) => (
        <div key={comment.id} className="text-sm">
          <strong className="text-ink">
            {comment.author.displayName || comment.author.username}
          </strong>
          <p className="text-dusk">{comment.content}</p>
        </div>
      ))}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí un comentario..."
          maxLength={500}
          required
          className="flex-1 rounded-md border border-mist bg-white px-3 py-1.5 text-sm text-ink placeholder:text-dusk/60 focus:border-horizon focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-calm px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-calm/90"
        >
          Comentar
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}