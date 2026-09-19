import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import type { DiscoverUser } from '../api/types';
import { filterPeople, getDiscoverPeople, getTopics } from '../services/discoverService';
import type { DiscoverTopic } from '../mocks/discover';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import { Button, Card, EmptyState, ErrorState, PresenceGlyph, SectionTitle } from '../components/byourside/ui';
import { cn } from '../lib/cn';

export default function DiscoverPage() {
  const navigate = useNavigate();
  const [people, setPeople] = useState<DiscoverUser[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getDiscoverPeople()
      .then((page) => setPeople(page.content))
      .catch(() => setError('No se pudo cargar la lista de personas'))
      .finally(() => setLoading(false));
  }, []);

  const topics = getTopics(query);
  const visiblePeople = filterPeople(people, query);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl sm:text-3xl">Descubrir</h1>
        <p className="mt-1 text-sm text-muted-foreground">Personas y temas para acompañar, sin apuro.</p>
      </header>

      <div className="relative">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar personas o temas"
          className="min-h-12 w-full rounded-full border border-input bg-card pr-4 pl-11 text-[0.975rem] focus:border-presence focus-visible:outline-none"
        />
      </div>

      <section>
        <SectionTitle>Temas para acompañar</SectionTitle>
        <p className="mt-1 text-xs text-muted-foreground">Estos temas son una vista previa local hasta que exista el catálogo en el servidor.</p>
        {topics.length === 0 ? (
          <EmptyState title="No hay temas para esa búsqueda" />
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {topics.map((topic) => (
              <TopicCard key={topic.id} topic={topic} />
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionTitle>Personas que podrías acompañar</SectionTitle>
        {error ? <ErrorState className="mt-3" /> : null}
        {loading ? <div className="mt-3 skeleton h-40 rounded-2xl" /> : null}
        {!loading && !error && visiblePeople.length === 0 ? (
          <EmptyState className="mt-3" title="Ya acompañás a todo el mundo por acá" />
        ) : null}
        {!loading && visiblePeople.length > 0 ? (
          <Card className="mt-3 overflow-hidden">
            <ul className="divide-y divide-border/60">
              {visiblePeople.map((person) => {
                const name = person.displayName || person.username;
                return (
                  <li key={person.id} className="flex items-center justify-between gap-3 p-4">
                    <button
                      type="button"
                      className="flex min-w-0 items-center gap-3 text-left"
                      onClick={() => navigate(`/profile/${person.id}`)}
                    >
                      <Avatar avatarUrl={person.avatarUrl} name={name} size="md" />
                      <span>
                        <span className="block font-medium">{name}</span>
                        {person.bio ? (
                          <span className="block truncate text-sm text-muted-foreground">{person.bio}</span>
                        ) : (
                          <span className="block text-sm text-muted-foreground">Podría hacerte bien acompañar.</span>
                        )}
                      </span>
                    </button>
                    <FollowButton userId={person.id} initiallyFollowing={false} />
                  </li>
                );
              })}
            </ul>
          </Card>
        ) : null}
      </section>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => navigate('/feed')}>
          Volver al inicio
        </Button>
      </div>
    </div>
  );
}

function TopicCard({ topic }: { topic: DiscoverTopic }) {
  const presence = topic.tone === 'presence';
  return (
    <button
      type="button"
      className={cn(
        'flex flex-col items-start gap-2 rounded-2xl border p-4 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        presence ? 'border-presence/20 bg-presence-soft/40' : 'border-listening/20 bg-listening-soft/40',
      )}
    >
      <span
        className={cn(
          'flex size-9 items-center justify-center rounded-full',
          presence ? 'bg-presence-soft text-presence-strong' : 'bg-listening-soft text-listening-strong',
        )}
      >
        <PresenceGlyph className="h-3.5 w-5" />
      </span>
      <span className="font-serif text-base">{topic.label}</span>
      <span className="text-sm text-muted-foreground">{topic.description}</span>
      <span className="text-xs text-muted-foreground">{topic.posts} personas compartiendo</span>
    </button>
  );
}
