import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProfile, getUserPosts, uploadAvatar } from '../api/users';
import type { PublicUserProfile, Post } from '../api/types';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getOrCreateConversation } from '../api/chat';
import { PencilIcon } from '../components/Icons';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    Promise.all([getPublicProfile(userId), getUserPosts(userId)])
      .then(([profileData, postsPage]) => {
        setProfile(profileData);
        setPosts(postsPage.content);
      })
      .catch(() => setError('No se pudo cargar este perfil'))
      .finally(() => setLoading(false));
  }, [userId]);

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const updatedUser = await uploadAvatar(file);
      setProfile((prev) => (prev ? { ...prev, avatarUrl: updatedUser.avatarUrl } : prev));
    } catch {
      setError('No se pudo subir la foto de perfil');
    } finally {
      setUploading(false);
    }
  }

  async function handleMessage() {
      if (!profile) return;
      const conversation = await getOrCreateConversation(profile.id);
      navigate(`/messages/${conversation.id}`);
  }


  if (loading) {
    return <p className="text-dusk">Cargando perfil...</p>;
  }

  if (error || !profile) {
    return <p className="text-red-600">{error ?? 'Perfil no encontrado'}</p>;
  }

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div>
            <div className="mb-6 border-b border-mist pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="rounded-full ring-2 ring-horizon/30 ring-offset-2 ring-offset-paper">
                <Avatar avatarUrl={profile.avatarUrl} name={profile.displayName || profile.username} size="lg" />
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-horizon text-white transition-transform active:scale-90 disabled:opacity-60"
                  title="Cambiar foto de perfil"
                >
                {uploading ? '...' : <PencilIcon className="h-3.5 w-3.5" />}
              </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <h1 className="font-serif text-2xl font-semibold text-ink">
                {profile.displayName || profile.username}
              </h1>
              <p className="text-sm text-dusk">@{profile.username}</p>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="flex gap-2 sm:flex-shrink-0">
              <button
                onClick={handleMessage}
                className="flex-1 rounded-md border border-mist px-3 py-1.5 text-sm font-medium text-dusk transition-colors hover:border-horizon sm:flex-initial"
              >
                Mensaje
              </button>
              <FollowButton userId={profile.id} initiallyFollowing={profile.followedByCurrentUser} />
            </div>
          )}
        </div>

        {profile.bio && <p className="mt-4 text-ink">{profile.bio}</p>}

        <div className="mt-3 flex gap-4 text-sm text-dusk">
          <span>
            <strong className="text-ink">{profile.followersCount}</strong> seguidores
          </span>
          <span>
            <strong className="text-ink">{profile.followingCount}</strong> siguiendo
          </span>
        </div>
      </div>

      {posts.length === 0 ? (
        <p className="text-dusk">
          {isOwnProfile ? 'Todavía no publicaste nada.' : 'Esta persona no tiene posts visibles.'}
        </p>
      ) : (
        posts.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
}