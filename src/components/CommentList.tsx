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
    <div>
      {loading && <p>Cargando comentarios...</p>}

      {comments.map((comment) => (
        <div key={comment.id}>
          <strong>{comment.author.displayName || comment.author.username}</strong>
          <p>{comment.content}</p>
        </div>
      ))}

      <form onSubmit={handleSubmit}>
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escribí un comentario..."
          maxLength={500}
          required
        />
        <button type="submit">Comentar</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}