import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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
import { ResendVerificationForm } from '../components/auth/ResendVerificationForm';
import { Badge, Button, Card, EmptyState, ErrorState, TextArea, TextField } from '../components/byourside/ui';
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
        <div className="relative">
          <div className="h-24 bg-gradient-to-r from-presence-soft via-card to-listening-soft sm:h-28" />
          <button
            type="button"
            disabled={!isOwn || uploading}
            onClick={() => isOwn && fileInputRef.current?.click()}
            className="absolute -bottom-6 left-5 rounded-full sm:left-6"
            title={isOwn ? 'Cambiar foto de perfil' : undefined}
          >
            <Avatar
              avatarUrl={profile.avatarUrl}
              name={displayName}
              size="lg"
              className="ring-4 ring-card"
            />
          </button>
          <div className="absolute -bottom-6 right-5 flex gap-2 sm:right-6">
            {!isOwn ? (
              <>
                <Button size="sm" variant="outline" onClick={handleMessage}>
                  <MessageCircle className="size-4" />
                  Mensajes
                </Button>
                <FollowButton userId={profile.id} initiallyFollowing={profile.followedByCurrentUser} />
              </>
            ) : (
              <Button
                size="sm"
                variant="soft"
                onClick={() => {
                  setOverlayName(displayName);
                  setOverlayBio(bio ?? '');
                  setEditing((prev) => !prev);
                }}
              >
                <Settings className="size-4" />
                Editar perfil
              </Button>
            )}
          </div>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
        <div className="px-5 pt-8 pb-5 sm:px-6">
          <h1 className="font-serif text-2xl">{displayName}</h1>
          <Badge tone={moodBadge?.tone ?? 'neutral'} className="mt-2">
            {moodBadge?.label ?? 'Sin estado reciente'}
          </Badge>
          <p className="mt-1 text-sm text-muted-foreground">@{profile.username}</p>
          {bio ? <p className="mt-3 max-w-prose text-[0.95rem] leading-relaxed">{bio}</p> : null}
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="size-3.5" />
            Se unió {new Date(profile.createdAt).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
          </p>

          {isOwn && editing ? (
            <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border/60 bg-background p-4">
              <TextField
                label="Nombre a mostrar"
                value={overlayName}
                onChange={(event) => setOverlayName(event.target.value)}
                placeholder={profile.displayName ?? profile.username}
              />
              <TextArea
                label="Bio"
                value={overlayBio}
                onChange={(event) => setOverlayBio(event.target.value)}
                placeholder="Contá algo sobre vos"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                Estos cambios se guardan en este dispositivo hasta que el servidor los soporte de forma
                permanente.
              </p>
              <div className="flex justify-end gap-2">
                <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  variant="soft"
                  onClick={() => {
                    saveProfileOverlay(profileId, {
                      displayName: overlayName.trim() || undefined,
                      bio: overlayBio.trim() || undefined,
                    });
                    setEditing(false);
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex gap-8 border-t border-border/60 pt-4">
            <Stat value={profile.followersCount} label="te acompañan" />
            <Stat value={profile.followingCount} label="acompañás" />
            <Stat value={received} label="presencia recibida" />
          </div>
        </div>
      </Card>

      {isOwn && currentUser && !currentUser.emailVerified ? (
        <Card className="space-y-4 p-5">
          <div>
            <h2 className="font-serif text-lg">Verificá tu correo</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Tu cuenta ya funciona. Si todavía no recibiste el email, podés pedir otro.
            </p>
          </div>
          <ResendVerificationForm initialEmail={currentUser.email} idPrefix="profile-resend" />
        </Card>
      ) : null}

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
          title="La presencia que te dejaron vive acá"
          description="Cada vez que alguien esté de tu lado o te ofrezca escucha, vas a poder verlo en este espacio."
          action={
            <Button size="sm" variant="listening" onClick={() => navigate('/feed')}>
              Ir al inicio
            </Button>
          }
        />
      )}

      {isOwn ? (
        <div className="flex flex-col items-center gap-3">
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