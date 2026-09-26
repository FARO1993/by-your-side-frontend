import { useEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MessageCircle } from 'lucide-react';
import { getMyAvailability } from '../api/availability';
import { getOrCreateConversation } from '../api/chat';
import { getStatusFeed } from '../api/statuses';
import type { Availability, CompanionIntent, Post, PublicUserProfile, Status } from '../api/types';
import { getPublicProfile, getUserPosts, uploadAvatar } from '../api/users';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
import { ResendVerificationForm } from '../components/auth/ResendVerificationForm';
import { Badge, Button, Card, EmptyState, ErrorState } from '../components/byourside/ui';
import { cn } from '../lib/cn';
import { moodToneToBadgeTone, STATUS_MOOD_UI } from '../lib/visual';

const AVAILABILITY_LABEL: Record<CompanionIntent, string> = {
  TALK: 'Hablar',
  DISTRACTION: 'Distraerme',
  WATCH_TOGETHER: 'Ver algo juntos',
  MUSIC: 'Escuchar música',
  LAUGH: 'Reírnos un rato',
  JUST_COMPANY: 'Solo compañía',
};

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    profile: PublicUserProfile;
    posts: Post[];
    latestStatus: Status | null;
  } | null>(null);
  const [failedUserId, setFailedUserId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{ userId: string; value: Availability | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'posts' | 'presence'>('posts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    Promise.all([getPublicProfile(userId), getUserPosts(userId), getStatusFeed().catch(() => [])])
      .then(([profileData, postsPage, statuses]) => {
        if (cancelled) return;
        setFailedUserId(null);
        setSnapshot({
          userId,
          profile: profileData,
          posts: postsPage.content,
          latestStatus: statuses.find((status) => status.user.id === profileData.id) ?? null,
        });
      })
      .catch(() => {
        if (!cancelled) setFailedUserId(userId);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const ready = snapshot?.userId === userId ? snapshot : null;
  const profile = ready?.profile ?? null;
  const posts = ready?.posts ?? [];
  const latestStatus = ready?.latestStatus ?? null;
  const isOwn = Boolean(profile && currentUser?.id === profile.id);
  const loading = !ready && failedUserId !== userId;
  const loadError = failedUserId === userId ? 'No se pudo cargar este perfil' : null;

  const ownProfileId = isOwn && profile ? profile.id : null;

  useEffect(() => {
    if (!ownProfileId) return undefined;
    let cancelled = false;
    getMyAvailability()
      .then((value) => {
        if (!cancelled) setAvailability({ userId: ownProfileId, value });
      })
      .catch(() => {
        if (!cancelled) setAvailability({ userId: ownProfileId, value: null });
      });
    return () => {
      cancelled = true;
    };
  }, [ownProfileId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (error || loadError || !profile) {
    return <ErrorState description={error ?? loadError ?? 'Perfil no encontrado'} />;
  }

  const profileId = profile.id;
  const displayName = profile.displayName?.trim() || profile.username;
  const bio = profile.bio?.trim() ? profile.bio.trim() : null;
  const moodBadge = latestStatus
    ? { label: STATUS_MOOD_UI[latestStatus.mood].label, tone: moodToneToBadgeTone(STATUS_MOOD_UI[latestStatus.mood].tone) }
    : null;
  const activeAvailability = isOwn && availability?.userId === profile.id ? availability.value : null;
  const availabilityLabel = activeAvailability ? AVAILABILITY_LABEL[activeAvailability.intent] : null;

  async function handleAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setSnapshot((prev) =>
        prev && prev.profile.id === profileId ? { ...prev, profile: { ...prev.profile, avatarUrl: updated.avatarUrl } } : prev,
      );
    } catch {
      setError('No se pudo subir la foto de perfil');
    } finally {
      setUploading(false);
    }
  }

  async function handleMessage() {
    const conversation = await getOrCreateConversation(profileId);
    navigate(`/messages/${conversation.id}`);
  }

  function openAvatarPicker() {
    fileInputRef.current?.click();
  }

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>, id: 'posts' | 'presence') {
    const order = ['posts', 'presence'] as const;
    const index = order.indexOf(id);
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? order[(index + 1) % order.length]
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? order[(index - 1 + order.length) % order.length]
          : null;
    if (!next) return;
    event.preventDefault();
    setTab(next);
    document.getElementById(`profile-tab-${next}`)?.focus();
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-presence-soft via-card to-listening-soft sm:h-20" />
        <div className="px-4 pb-5 sm:px-6">
          <div className="-mt-8 flex items-end gap-3">
            {isOwn ? (
              <button
                type="button"
                className="rounded-full"
                disabled={uploading}
                aria-label="Cambiar foto de perfil"
                onClick={openAvatarPicker}
              >
                <Avatar avatarUrl={profile.avatarUrl} name={displayName} size="lg" className="ring-4 ring-card" />
              </button>
            ) : (
              <Avatar avatarUrl={profile.avatarUrl} name={displayName} size="lg" className="ring-4 ring-card" />
            )}
            <div className="min-w-0 pb-1">
              <h1 className="truncate font-serif text-2xl">{displayName}</h1>
              <p className="truncate text-sm text-muted-foreground">@{profile.username}</p>
            </div>
          </div>

          <Badge tone={moodBadge?.tone ?? 'neutral'} className="mt-4 px-3 py-1 text-sm">
            {moodBadge?.label ?? 'Sin estado reciente'}
          </Badge>

          {bio ? <p className="mt-3 max-w-prose text-base leading-relaxed text-foreground">{bio}</p> : null}

          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" aria-hidden="true" />
            Se unió {new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>

          {isOwn && availabilityLabel ? (
            <div className="mt-4">
              <p className="text-xs text-muted-foreground">Disponible ahora</p>
              <Badge tone="listening" className="mt-1.5">
                {availabilityLabel}
              </Badge>
            </div>
          ) : null}

          <div className="mt-4 flex gap-2">
            {isOwn ? (
              <Button type="button" size="sm" variant="outline" disabled={uploading} onClick={openAvatarPicker}>
                {uploading ? 'Subiendo…' : 'Editar perfil'}
              </Button>
            ) : (
              <>
                <FollowButton
                  userId={profile.id}
                  initiallyFollowing={profile.followedByCurrentUser}
                  followingLabel="Acompañando"
                  followVariant="presence"
                  size="md"
                  fullWidth
                  className="min-w-0 flex-1"
                />
                <Button type="button" size="sm" variant="outline" className="shrink-0 self-center" onClick={handleMessage}>
                  <MessageCircle className="size-4" />
                  Mensajes
                </Button>
              </>
            )}
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{profile.followersCount}</span> te acompañan
            <span aria-hidden="true"> · </span>
            <span className="font-medium text-foreground">{profile.followingCount}</span> acompañás
          </p>
        </div>
      </Card>

      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />

      {isOwn && currentUser && !currentUser.emailVerified ? (
        <Card className="space-y-3 p-4">
          <div>
            <h2 className="font-serif text-lg">Verificá tu correo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu cuenta ya funciona. Si todavía no recibiste el email, podés pedir otro.
            </p>
          </div>
          <ResendVerificationForm initialEmail={currentUser.email} idPrefix="profile-resend" />
        </Card>
      ) : null}

      <div role="tablist" aria-label="Contenido del perfil" className="flex rounded-full bg-muted p-1">
        {(['posts', 'presence'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`profile-tab-${id}`}
            aria-controls={`profile-panel-${id}`}
            aria-selected={tab === id}
            tabIndex={tab === id ? 0 : -1}
            onClick={() => setTab(id)}
            onKeyDown={(event) => onTabKeyDown(event, id)}
            className={cn(
              'flex-1 rounded-full py-1.5 text-sm font-medium',
              tab === id ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
            )}
          >
            {id === 'posts' ? 'Publicaciones' : 'Presencia recibida'}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`profile-panel-${tab}`} aria-labelledby={`profile-tab-${tab}`}>
      {tab === 'posts' ? (
        posts.length === 0 ? (
          <EmptyState
            className="px-6 py-8"
            title={isOwn ? 'Todavía no publicaste nada' : 'Esta persona no tiene publicaciones visibles'}
          />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )
      ) : (
        <EmptyState
          className="px-6 py-8"
          title="La presencia que te dejaron vive acá"
          description="Cada vez que alguien esté de tu lado o te ofrezca escucha, vas a poder verlo en este espacio."
          action={
            <Button size="sm" variant="listening" onClick={() => navigate('/feed')}>
              Volver al inicio
            </Button>
          }
        />
      )}
      </div>

      {isOwn ? (
        <section className="flex flex-col items-center gap-2 pt-1">
          <h2 className="text-sm font-medium text-foreground">Cuenta y seguridad</h2>
          <Link to="/account/password" className="text-sm font-semibold text-listening-strong hover:underline">
            Cambiar contraseña
          </Link>
          <Button
            variant="ghost"
            onClick={() => {
              void logout();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </Button>
        </section>
      ) : null}
    </div>
  );
}

