import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPublicProfile, getUserPosts, uploadAvatar } from '../api/users';
import type { PublicUserProfile, Post } from '../api/types';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar avatarUrl={profile.avatarUrl} name={profile.displayName || profile.username} size="lg" />
              {isOwnProfile && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-horizon text-xs text-white disabled:opacity-60"
                  title="Cambiar foto de perfil"
                >
                  {uploading ? '...' : '✎'}
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
            <FollowButton userId={profile.id} initiallyFollowing={profile.followedByCurrentUser} />
          )}
        </div>

        {profile.bio && <p className="mt-3 text-ink">{profile.bio}</p>}

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