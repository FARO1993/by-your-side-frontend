import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPost } from '../api/posts';
import type { Post } from '../api/types';
import PostCard from '../components/PostCard';

export default function PostPage() {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    getPost(postId)
      .then(setPost)
      .catch(() => setError('No se pudo cargar este post'))
      .finally(() => setLoading(false));
  }, [postId]);

  if (loading) {
    return <p className="text-dusk">Cargando...</p>;
  }

  if (error || !post) {
    return (
      <div>
        <p className="text-red-600">{error ?? 'Post no encontrado'}</p>
        <Link to="/feed" className="mt-2 inline-block text-sm text-horizon hover:underline">
          Volver al feed
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/feed" className="mb-4 inline-block text-sm text-dusk hover:text-ink">
        ← Volver al feed
      </Link>
      <PostCard post={post} />
    </div>
  );
}