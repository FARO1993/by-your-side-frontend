import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { createPost, getFeed } from '../api/posts';
import { getStatusFeed, setStatus } from '../api/statuses';
import type { Post, Status, StatusMood } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Composer } from '../components/byourside/composer';
import { EmptyState, ErrorState, SectionTitle } from '../components/byourside/ui';
import { PostCardSkeleton } from '../components/byourside/post-skeleton';
import PostCard from '../components/PostCard';
import StatusCard from '../components/StatusCard';
import SupportReminderCard from '../components/SupportReminderCard';
import { Logo } from '../components/byourside/logo';

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function load() {
    setLoading(true);
    setError(null);
    Promise.all([getFeed(), getStatusFeed()])
      .then(([postsPage, statusesData]) => {
        setPosts(postsPage.content);
        setStatuses(statusesData);
      })
      .catch(() => setError('No se pudo cargar el feed'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  async function handlePost(content: string) {
    setSubmitting(true);
    try {
      const post = await createPost({ content });
      setPosts((prev) => [post, ...prev]);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMood(mood: StatusMood) {
    const status = await setStatus(mood);
    setStatuses((prev) => [status, ...prev.filter((item) => item.user.id !== status.user.id)]);
  }

  const name = user?.displayName || user?.username || '';

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl text-balance sm:text-3xl">Hola, {name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Estamos acá, a tu ritmo.</p>
      </header>

      <SupportReminderCard />

      {user ? (
        <Composer
          authorName={name}
          avatarUrl={user.avatarUrl}
          onSubmit={handlePost}
          onMood={handleMood}
          submitting={submitting}
        />
      ) : null}

      <div className="flex items-end justify-between">
        <SectionTitle>Cerca tuyo</SectionTitle>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="size-3.5" />
          Actualizar
        </button>
      </div>

      {error ? <ErrorState description={error} onRetry={load} /> : null}
      {loading ? (
        <div className="space-y-4">
          <PostCardSkeleton />
          <PostCardSkeleton />
        </div>
      ) : null}

      {!loading && !error && statuses.length === 0 && posts.length === 0 ? (
        <EmptyState
          icon={<Logo />}
          title="Todavía está en calma por acá"
          description="Cuando alguien comparta, va a aparecer en este espacio. Podés ser la primera presencia."
        />
      ) : null}

      <div className="space-y-4">
        {statuses.map((status) => (
          <StatusCard key={status.id} status={status} />
        ))}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
