import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Search } from 'lucide-react';
import { DISCOVER_PAGE_SIZE, discoverUsers } from '../api/users';
import type { DiscoverUser } from '../api/types';
import FollowButton from '../components/FollowButton';
import Avatar from '../components/Avatar';
import { Badge, Button, EmptyState, ErrorState, SectionTitle } from '../components/byourside/ui';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { moodToneToBadgeTone, STATUS_MOOD_UI } from '../lib/visual';

const SEARCH_DEBOUNCE_MS = 300;
const LOAD_ERROR = 'No pudimos traer personas para mostrarte. Probá de nuevo.';
const SEARCH_ERROR = 'No pudimos buscar personas.';
const MORE_ERROR = 'No pudimos cargar más personas.';
const INVALID_QUERY = 'Esa búsqueda no es válida.';

type DiscoverView = {
  query: string;
  people: DiscoverUser[];
  last: boolean;
  page: number;
};

export default function DiscoverPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = debouncedQuery.trim();
  const [view, setView] = useState<DiscoverView | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState(LOAD_ERROR);
  const [moreLoading, setMoreLoading] = useState(false);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    discoverUsers({ q: search || undefined, page: 0, size: DISCOVER_PAGE_SIZE, signal: controller.signal })
      .then((page) => {
        if (controller.signal.aborted) return;
        setView({
          query: search,
          people: dedupePeople(page.content),
          last: page.last,
          page: page.number,
        });
        setStatus('ready');
        setMoreError(null);
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isCanceled(error)) return;
        setStatus('error');
        setErrorMessage(discoverErrorMessage(error, search ? SEARCH_ERROR : LOAD_ERROR));
      });
    return () => controller.abort();
  }, [search, retryToken]);

  const current = view?.query === search ? view : null;
  const loading = current === null && status !== 'error';

  async function loadMore() {
    if (!current || current.last || moreLoading) return;
    const signal = abortRef.current?.signal;
    setMoreLoading(true);
    setMoreError(null);
    try {
      const page = await discoverUsers({
        q: search || undefined,
        page: current.page + 1,
        size: DISCOVER_PAGE_SIZE,
        signal,
      });
      if (signal?.aborted) return;
      setView((previous) => {
        if (!previous || previous.query !== search) return previous;
        return {
          query: search,
          people: dedupePeople([...previous.people, ...page.content]),
          last: page.last,
          page: page.number,
        };
      });
    } catch (error: unknown) {
      if (signal?.aborted || isCanceled(error)) return;
      setMoreError(discoverErrorMessage(error, MORE_ERROR));
    } finally {
      if (!signal?.aborted) setMoreLoading(false);
    }
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
        {loading ? <DiscoverSkeleton label={search ? 'Buscando personas' : 'Cargando personas'} /> : null}
        {status === 'error' && current === null ? (
          <ErrorState className="mt-3" description={errorMessage} onRetry={() => setRetryToken((currentToken) => currentToken + 1)} />
        ) : null}
        {current && current.people.length === 0 ? (
          <EmptyState
            className="mt-3 px-6 py-8"
            title={search ? 'No encontramos personas con esa búsqueda.' : 'Todavía no encontramos más personas para mostrarte.'}
            action={
              search ? (
                <Button type="button" size="sm" variant="outline" onClick={() => setQuery('')}>
                  Limpiar búsqueda
                </Button>
              ) : null
            }
          />
        ) : null}
        {current && current.people.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {current.people.map((person) => (
              <PersonRow key={person.id} person={person} />
            ))}
          </ul>
        ) : null}
        {current && !current.last ? (
          <div className="mt-4 flex flex-col items-center gap-2">
            <Button type="button" variant="outline" disabled={moreLoading} onClick={() => void loadMore()}>
              {moreLoading ? 'Cargando…' : 'Cargar más'}
            </Button>
            {moreError ? (
              <p role="alert" className="text-sm text-destructive">
                {moreError}
              </p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function PersonRow({ person }: { person: DiscoverUser }) {
  const displayName = person.displayName?.trim() || person.username;
  const bio = person.bio?.trim() ? person.bio.trim() : null;
  const mood = person.statusMood ? STATUS_MOOD_UI[person.statusMood] : null;

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
              {mood ? (
                <Badge tone={moodToneToBadgeTone(mood.tone)} className="mt-1 max-w-full whitespace-normal">
                  {mood.label}
                </Badge>
              ) : null}
              {person.available ? <span className="mt-1 block text-xs text-listening-strong">Disponible ahora</span> : null}
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

function DiscoverSkeleton({ label }: { label: string }) {
  return (
    <div role="status" aria-label={label} className="mt-3 space-y-3">
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

function dedupePeople(people: DiscoverUser[]): DiscoverUser[] {
  const seen = new Set<string>();
  return people.filter((person) => {
    if (seen.has(person.id)) return false;
    seen.add(person.id);
    return true;
  });
}

function isCanceled(error: unknown): boolean {
  return axios.isCancel(error) || (axios.isAxiosError(error) && error.code === 'ERR_CANCELED');
}

function discoverErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error) && error.response?.status === 400) return INVALID_QUERY;
  return fallback;
}
