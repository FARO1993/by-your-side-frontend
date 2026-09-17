import { useEffect, useState } from 'react';
import { getFeed } from '../api/posts';
import { getStatusFeed } from '../api/statuses';
import type { Post, Status } from '../api/types';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import StatusPicker from '../components/StatusPicker';
import StatusCard from '../components/StatusCard';
import { useAuth } from '../context/AuthContext';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getFeed(), getStatusFeed()])
      .then(([postsPage, statusesData]) => {
        setPosts(postsPage.content);
        setStatuses(statusesData);
      })
      .catch(() => setError('No se pudo cargar el feed'))
      .finally(() => setLoading(false));
  }, []);

  function handlePostCreated(newPost: Post) {
    setPosts((prev) => [newPost, ...prev]);
  }

  function handleStatusSet(newStatus: Status) {
    // Reemplaza el estado anterior del usuario actual si ya tenia uno en la lista,
    // o lo agrega al principio si es el primero.
    setStatuses((prev) => [newStatus, ...prev.filter((s) => s.user.id !== newStatus.user.id)]);
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">
        Hola, {user?.displayName || user?.username} 👋
      </h1>

      <StatusPicker onSet={handleStatusSet} />

      {statuses.length > 0 && (
        <div className="mb-6">
          {statuses.map((status) => (
            <StatusCard key={status.id} status={status} />
          ))}
        </div>
      )}

      <CreatePostForm onCreated={handlePostCreated} />

      {loading && <p className="text-dusk">Cargando feed...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && posts.length === 0 && (
        <p className="text-dusk">Todavía no hay posts en tu feed. ¡Publicá algo o seguí a alguien!</p>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}