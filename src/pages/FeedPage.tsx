import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { setNeed, setOffering, cancelNeed, cancelOffering, getMyNeed, getMyOffering } from '../api/companion';
import { createPost, getFeed } from '../api/posts';
import { getStatusFeed, setStatus } from '../api/statuses';
import type { CompanionNeed, CompanionOffering, NeedType, OfferingType, Post, Status, StatusMood } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { Composer } from '../components/byourside/composer';
import { draftKey } from '../lib/drafts';
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
  const [activeNeed, setActiveNeed] = useState<CompanionNeed | null>(null);
  const [activeOffering, setActiveOffering] = useState<CompanionOffering | null>(null);
  const [needPending, setNeedPending] = useState(false);
  const [offeringPending, setOfferingPending] = useState(false);
  const [needError, setNeedError] = useState<string | null>(null);
  const [offeringError, setOfferingError] = useState<string | null>(null);

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

  useEffect(() => {
    let cancelled = false;
    getMyNeed()
      .then((value) => {
        if (!cancelled) setActiveNeed(value);
      })
      .catch(() => {
        if (!cancelled) setNeedError('No pudimos ver si ya estás buscando compañía.');
      });
    getMyOffering()
      .then((value) => {
        if (!cancelled) setActiveOffering(value);
      })
      .catch(() => {
        if (!cancelled) setOfferingError('No pudimos ver si ya estás disponible.');
      });
    return () => {
      cancelled = true;
    };
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
    setNeedPending(false);
    setOfferingPending(false);
    setNeedError(null);
    setOfferingError(null);
  }

  async function seekCompany(type: NeedType) {
    const epoch = availabilityEpoch.current;
    setNeedPending(true);
    setNeedError(null);
    try {
      const saved = await setNeed(type);
      if (epoch !== availabilityEpoch.current) return;
      setActiveNeed(saved);
      navigate('/companion');
    } catch {
      if (epoch !== availabilityEpoch.current) return;
      setNeedError('No pudimos guardar lo que necesitás. Podés intentarlo en Modo compañía.');
      throw new Error('need');
    } finally {
      if (epoch === availabilityEpoch.current) setNeedPending(false);
    }
  }

  async function declareAvailability(type: OfferingType) {
    const epoch = availabilityEpoch.current;
    setOfferingPending(true);
    setOfferingError(null);
    try {
      const saved = await setOffering(type);
      if (epoch !== availabilityEpoch.current) return;
      setActiveOffering(saved);
    } catch {
      if (epoch !== availabilityEpoch.current) return;
      setOfferingError('No pudimos guardar tu disponibilidad. Podés intentarlo en Modo compañía.');
      throw new Error('offering');
    } finally {
      if (epoch === availabilityEpoch.current) setOfferingPending(false);
    }
  }

  async function clearNeed() {
    const previous = activeNeed;
    setNeedPending(true);
    setNeedError(null);
    try {
      await cancelNeed();
      setActiveNeed(null);
    } catch {
      setActiveNeed(previous);
      setNeedError('No pudimos cancelar la búsqueda.');
    } finally {
      setNeedPending(false);
    }
  }

  async function clearOffering() {
    const previous = activeOffering;
    setOfferingPending(true);
    setOfferingError(null);
    try {
      await cancelOffering();
      setActiveOffering(null);
    } catch {
      setActiveOffering(previous);
      setOfferingError('No pudimos cancelar tu disponibilidad.');
    } finally {
      setOfferingPending(false);
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
          draftKey={draftKey(user.id, 'feed-composer')}
        />
      ) : null}

      <HomePresencePulse
        onSeekCompany={seekCompany}
        onDeclareAvailability={declareAvailability}
        onCancelNeed={clearNeed}
        onCancelOffering={clearOffering}
        onReset={resetPulse}
        activeNeed={activeNeed}
        activeOffering={activeOffering}
        needPending={needPending}
        offeringPending={offeringPending}
        needError={needError}
        offeringError={offeringError}
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
