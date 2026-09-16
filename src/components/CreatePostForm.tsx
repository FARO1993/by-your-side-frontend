import { useState, type FormEvent } from 'react';
import axios from 'axios';
import { createPost } from '../api/posts';
import type { Post, ApiErrorResponse } from '../api/types';

export default function CreatePostForm({ onCreated }: { onCreated: (post: Post) => void }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const post = await createPost({ content });
      setContent('');
      onCreated(post);
    } catch (err) {
      if (axios.isAxiosError<ApiErrorResponse>(err)) {
        setError(err.response?.data.message ?? 'Error al crear el post');
      } else {
        setError('Error al crear el post');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué querés compartir hoy?"
        maxLength={2000}
        required
      />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Publicando...' : 'Publicar'}
      </button>
    </form>
  );
}