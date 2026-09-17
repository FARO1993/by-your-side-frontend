import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { discoverUsers } from '../api/users';
import type { DiscoverUser } from '../api/types';
import FollowButton from '../components/FollowButton';

export default function DiscoverPage() {
  const [users, setUsers] = useState<DiscoverUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    discoverUsers()
      .then((page) => setUsers(page.content))
      .catch(() => setError('No se pudo cargar la lista de personas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="text-dusk">Cargando...</p>;
  }

  return (
    <div>
      <h1 className="mb-6 font-serif text-2xl font-semibold text-ink">Descubrir personas</h1>

      {error && <p className="text-red-600">{error}</p>}

      {!error && users.length === 0 && (
        <p className="text-dusk">Ya seguís a todo el mundo por acá 🎉</p>
      )}

      <div className="flex flex-col gap-3">
        {users.map((discoverUser) => (
          <div
            key={discoverUser.id}
            className="flex items-center justify-between border-l-2 border-mist bg-white p-4"
          >
            <div>
              <Link
                to={`/profile/${discoverUser.id}`}
                className="font-medium text-ink hover:text-horizon"
              >
                {discoverUser.displayName || discoverUser.username}
              </Link>
              {discoverUser.bio && <p className="mt-1 text-sm text-dusk">{discoverUser.bio}</p>}
            </div>
            <FollowButton userId={discoverUser.id} initiallyFollowing={false} />
          </div>
        ))}
      </div>
    </div>
  );
}