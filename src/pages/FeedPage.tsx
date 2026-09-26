import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { setAvailability } from '../api/availability';
import { createPost, getFeed } from '../api/posts';
import { getStatusFeed, setStatus } from '../api/statuses';
import type { CompanionIntent, Post, Status, StatusMood } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Composer } from '../components/byourside/composer';
import { HomePresencePulse } from '../components/byourside/home-presence-pulse';
import { EmptyState, ErrorState, SectionTitle } from '../components/byourside/ui';
import { PostCardSkeleton } from '../components/byourside/post-skeleton';
import PostCard from '../components/PostCard';
import StatusCard from '../components/StatusCard';
import SupportReminderCard from '../components/SupportReminderCard';
import { Logo } from '../components/byourside/logo';
import { greetingName } from '../lib/greetingName';

export default function FeedPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const availabilityEpoch = useRef(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [availabilityPending, setAvailabilityPending] = useState(false);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);

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

  function resetPulse() {
    availabilityEpoch.current += 1;
    setAvailabilityPending(false);
    setAvailabilityMessage(null);
    setAvailabilityError(null);
  }

  function seekCompany(intent: CompanionIntent | null) {
    navigate('/companion', intent ? { state: { intent } } : undefined);
  }

  async function declareAvailability(intent: CompanionIntent | null) {
    if (!intent) {
      navigate('/companion');
      return;
    }
    const epoch = availabilityEpoch.current;
    setAvailabilityPending(true);
    setAvailabilityError(null);
    setAvailabilityMessage(null);
    try {
      await setAvailability(intent);
      if (epoch !== availabilityEpoch.current) return;
      setAvailabilityMessage(intent === 'TALK' ? 'Quedaste disponible para charlar.' : 'Quedaste disponible para distraernos.');
    } catch {
      if (epoch !== availabilityEpoch.current) return;
      setAvailabilityError('No pudimos guardar tu disponibilidad. Podés intentarlo en Modo compañía.');
    } finally {
      if (epoch === availabilityEpoch.current) setAvailabilityPending(false);
    }
  }

  const fullName = user?.displayName?.trim() || user?.username || '';
  const greeting = greetingName(user?.displayName, user?.username);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="truncate font-serif text-2xl sm:text-3xl" title={fullName ? `Hola, ${fullName}` : undefined}>
          {greeting ? `Hola, ${greeting}.` : 'Hola.'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Estamos acá, a tu ritmo.</p>
      </header>

      <SupportReminderCard />

      {user ? (
        <Composer
          authorName={fullName}
          avatarUrl={user.avatarUrl}
          onSubmit={handlePost}
          onMood={handleMood}
          submitting={submitting}
        />
      ) : null}

      <HomePresencePulse
        onSeekCompany={seekCompany}
        onDeclareAvailability={(intent) => void declareAvailability(intent)}
        onReset={resetPulse}
        availabilityPending={availabilityPending}
        availabilityMessage={availabilityMessage}
        availabilityError={availabilityError}
      />

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
