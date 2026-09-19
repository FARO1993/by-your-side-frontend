import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MessageCircle, Settings } from 'lucide-react';
import { getPublicProfile, getUserPosts, uploadAvatar } from '../api/users';
import { getOrCreateConversation } from '../api/chat';
import { getStatusFeed } from '../api/statuses';
import type { Post, PublicUserProfile, Status } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { getProfileOverlay, mockReceivedPresence, saveProfileOverlay } from '../mocks/profile';
import Avatar from '../components/Avatar';
import FollowButton from '../components/FollowButton';
import PostCard from '../components/PostCard';
import { Badge, Button, Card, EmptyState, ErrorState } from '../components/byourside/ui';
import { cn } from '../lib/cn';
import { moodToneToBadgeTone, STATUS_MOOD_UI } from '../lib/visual';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [latestStatus, setLatestStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [tab, setTab] = useState<'posts' | 'presence'>('posts');
  const [editing, setEditing] = useState(false);
  const [overlayName, setOverlayName] = useState('');
  const [overlayBio, setOverlayBio] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([getPublicProfile(userId), getUserPosts(userId), getStatusFeed().catch(() => [])])
      .then(([profileData, postsPage, statuses]) => {
        setProfile(profileData);
        setPosts(postsPage.content);
        setLatestStatus(statuses.find((status) => status.user.id === profileData.id) ?? null);
        const overlay = getProfileOverlay(profileData.id);
        setOverlayName(overlay.displayName ?? '');
        setOverlayBio(overlay.bio ?? '');
      })
      .catch(() => setError('No se pudo cargar este perfil'))
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-28 rounded-2xl" />
        <div className="skeleton h-40 rounded-2xl" />
      </div>
    );
  }

  if (error || !profile) {
    return <ErrorState description={error ?? 'Perfil no encontrado'} />;
  }

  const profileId = profile.id;
  const isOwn = currentUser?.id === profileId;
  const overlay = getProfileOverlay(profile.id);
  const displayName = overlay.displayName || profile.displayName || profile.username;
  const bio = overlay.bio ?? profile.bio;
  const received = overlay.receivedPresence ?? mockReceivedPresence(profile.followersCount);
  const moodBadge = latestStatus
    ? { label: STATUS_MOOD_UI[latestStatus.mood].label, tone: moodToneToBadgeTone(STATUS_MOOD_UI[latestStatus.mood].tone) }
    : null;

  async function handleAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const updated = await uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: updated.avatarUrl } : prev));
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

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-presence-soft via-card to-listening-soft sm:h-28" />
        <div className="px-5 pt-0 pb-5 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <button
              type="button"
              disabled={!isOwn || uploading}
              onClick={() => isOwn && fileInputRef.current?.click()}
              className="-mt-10 rounded-full"
              title={isOwn ? 'Cambiar foto de perfil' : undefined}
            >
              <Avatar
                avatarUrl={profile.avatarUrl}
                name={displayName}
                size="lg"
                className="ring-4 ring-card"
              />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
            <div className="mb-1 flex flex-wrap justify-end gap-2">
              {!isOwn ? (
                <>
                  <Button size="sm" variant="outline" onClick={handleMessage}>
                    <MessageCircle className="size-4" />
                    Mensajes
                  </Button>
                  <FollowButton userId={profile.id} initiallyFollowing={profile.followedByCurrentUser} />
                </>
              ) : (
                <Button size="sm" variant="soft" onClick={() => setEditing((prev) => !prev)}>
                  <Settings className="size-4" />
                  Editar perfil
                </Button>
              )}
            </div>
          </div>

          <h1 className="mt-4 font-serif text-2xl">{displayName}</h1>
          <Badge tone={moodBadge?.tone ?? 'neutral'} className="mt-2">
            {moodBadge?.label ?? 'Sin estado reciente'}
          </Badge>
          <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
          {bio ? <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed">{bio}</p> : null}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Se unió {new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>

          {editing && isOwn ? (
            <div className="mt-4 space-y-3 rounded-2xl bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                Nombre y bio se guardan localmente hasta que exista edición en el servidor. La foto sí se
                sube de verdad.
              </p>
              <input
                value={overlayName}
                onChange={(event) => setOverlayName(event.target.value)}
                placeholder="Nombre"
                className="min-h-11 w-full rounded-xl border border-input bg-card px-3.5 text-sm"
              />
              <textarea
                value={overlayBio}
                onChange={(event) => setOverlayBio(event.target.value)}
                placeholder="Bio"
                className="min-h-24 w-full rounded-xl border border-input bg-card p-3 text-sm"
              />
              <Button
                size="sm"
                onClick={() => {
                  saveProfileOverlay(profile.id, { displayName: overlayName, bio: overlayBio });
                  setEditing(false);
                }}
              >
                Guardar
              </Button>
            </div>
          ) : null}

          <div className="mt-4 flex gap-8 border-t border-border/60 pt-4">
            <Stat value={profile.followersCount} label="te acompañan" />
            <Stat value={profile.followingCount} label="acompañás" />
            <Stat value={received} label="presencia recibida" />
          </div>
        </div>
      </Card>

      <div role="tablist" className="flex rounded-full bg-muted p-1">
        {(['posts', 'presence'] as const).map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={cn(
              'flex-1 rounded-full py-2 text-sm font-medium',
              tab === id ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground',
            )}
          >
            {id === 'posts' ? 'Publicaciones' : 'Presencia recibida'}
          </button>
        ))}
      </div>

      {tab === 'posts' ? (
        posts.length === 0 ? (
          <EmptyState
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
          title="Todavía no hay un detalle de presencia"
          description="Este resumen se va a completar cuando el servidor exponga el agregado. El número de arriba es una aproximación local."
        />
      )}

      {isOwn ? (
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Cerrar sesión
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-serif text-xl">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
