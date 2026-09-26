import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { DiscoverUser } from '../api/types';
import { filterPeople, getDiscoverPeople } from '../services/discoverService';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import { EmptyState, ErrorState, SectionTitle } from '../components/byourside/ui';

const LOAD_ERROR = 'No se pudo cargar la lista de personas.';

export default function DiscoverPage() {
  const [people, setPeople] = useState<DiscoverUser[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [requestId, setRequestId] = useState(0);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getDiscoverPeople()
      .then((page) => {
        if (cancelled) return;
        setPeople(page.content);
        setFailed(false);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  const loading = people === null && !failed;
  const visiblePeople = people ? filterPeople(people, query) : [];

  function retry() {
    setPeople(null);
    setFailed(false);
    setRequestId((current) => current + 1);
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="font-serif text-2xl sm:text-3xl">Descubrir</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personas con quienes podés conectar, sin apuro.</p>
      </header>

      <div className="relative">
        <label htmlFor="discover-search" className="sr-only">
          Buscar personas
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <input
          id="discover-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar personas"
          className="min-h-12 w-full rounded-full border border-input bg-card pr-4 pl-11 text-[0.975rem] focus:border-listening focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening"
        />
      </div>

      <section>
        <SectionTitle>Personas por acá</SectionTitle>
        {loading ? <DiscoverSkeleton /> : null}
        {failed ? (
          <ErrorState className="mt-3" description={LOAD_ERROR} onRetry={retry} />
        ) : null}
        {!loading && !failed && people && people.length === 0 ? (
          <EmptyState className="mt-3 px-6 py-8" title="No hay personas para mostrar por ahora." />
        ) : null}
        {!loading && !failed && people && people.length > 0 && visiblePeople.length === 0 ? (
          <EmptyState className="mt-3 px-6 py-8" title="No encontramos a nadie con ese nombre en esta lista." />
        ) : null}
        {!loading && !failed && visiblePeople.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {visiblePeople.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function PersonRow({ person }: { person: DiscoverUser }) {
  const displayName = person.displayName?.trim() || person.username;
  const bio = person.bio?.trim() ? person.bio.trim() : null;

  return (
    <li className="rounded-2xl bg-card p-4 shadow-soft [&_button]:w-full md:[&_button]:w-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <Link
          to={`/profile/${person.id}`}
          className="min-w-0 flex-1 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-listening"
        >
          <span className="flex items-start gap-3">
            <Avatar avatarUrl={person.avatarUrl} name={displayName} size="md" className="shrink-0" />
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{displayName}</span>
              <span className="block truncate text-sm text-muted-foreground">@{person.username}</span>
            </span>
          </span>
          {bio ? <span className="mt-3 line-clamp-2 text-sm leading-relaxed text-foreground/80">{bio}</span> : null}
        </Link>
        <FollowButton
          userId={person.id}
          initiallyFollowing={person.followState === 'FOLLOWING'}
          requested={person.followState === 'REQUESTED'}
          className="w-full items-stretch md:w-auto md:shrink-0 md:items-end"
        />
      </div>
    </li>
  );
}

function DiscoverSkeleton() {
  return (
    <div role="status" aria-label="Cargando personas" className="mt-3 space-y-3">
      {[0, 1, 2].map((item) => (
        <div key={item} className="rounded-2xl bg-card p-4 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="skeleton size-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2 pt-1">
              <div className="skeleton h-4 w-2/5 rounded-full" />
              <div className="skeleton h-3 w-1/4 rounded-full" />
            </div>
          </div>
          <div className="skeleton mt-3 h-3 w-4/5 rounded-full" />
          <div className="skeleton mt-3 h-9 w-full rounded-full md:w-36" />
        </div>
      ))}
    </div>
  );
}
