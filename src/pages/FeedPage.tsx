import { useEffect, useState } from 'react';
import { getFeed } from '../api/posts';
import type { Post } from '../api/types';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getFeed()
      .then((page) => setPosts(page.content))
      .catch(() => setError('No se pudo cargar el feed'))
      .finally(() => setLoading(false));
  }, []);

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => [newPost, ...prev]);
  }

  return (
    <div>
      <h1>Hola, {user?.displayName || user?.username} 👋</h1>

      <CreatePostForm onCreated={handlePostCreated} />

      {loading && <p>Cargando feed...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p>Todavía no hay posts en tu feed. ¡Publicá algo o seguí a alguien!</p>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}