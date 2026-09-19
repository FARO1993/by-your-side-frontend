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
    <form onSubmit={handleSubmit} className="mb-8 rounded-lg border border-mist bg-white p-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="¿Qué querés compartir hoy?"
        maxLength={2000}
        required
        rows={3}
        className="w-full resize-none text-ink placeholder:text-dusk/60 focus:outline-none"
      />
      <div className="flex items-center justify-between">
        {error ? <p className="text-sm text-red-600">{error}</p> : <span />}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-horizon px-4 py-2 text-sm font-medium text-white transition-all duration-150 hover:bg-horizon/90 active:scale-95 disabled:opacity-60"
        >
          {submitting ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}