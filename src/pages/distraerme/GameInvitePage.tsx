import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getConversations } from '../../api/chat';
import { getFollowing } from '../../api/follows';
import { inviteToGame, type GameType } from '../../api/gameRooms';
import type { UserSummary } from '../../api/types';
import { readApiError } from '../../auth/apiError';
import Avatar from '../../components/Avatar';
import { GameShell } from '../../components/games/GameShell';
import { Button, Card } from '../../components/byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/cn';
import { friendlyError } from '../../lib/friendlyError';
import { GAME_NAMES, TOGETHER_GAMES, personName } from '../../lib/games/gameNames';

const GAME_ORDER: GameType[] = ['MEMORY', 'PUZZLE', 'GARDEN'];
const GAME_HINT: Record<GameType, string> = {
  MEMORY: 'Por turnos, buscando las parejas juntos.',
  PUZZLE: 'Armar el mismo paisaje entre los dos.',
  GARDEN: 'Un jardín que crece cuando lo cuidan juntos.',
};

function inviteError(error: unknown): string {
  const status = readApiError(error).status;
  if (status === 403) {
    return 'Por ahora podés invitar a quienes seguís, te siguen o con quienes ya charlaste.';
  }
  if (status === 429) {
    return 'Ya tenés varias invitaciones esperando respuesta. Cuando alguna se responda o venza, podés mandar otra.';
  }
  return friendlyError(error, 'No pudimos mandar la invitación. Probá de nuevo en un momento.');
}

export default function GameInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const preselected = searchParams.get('con');
  const [game, setGame] = useState<GameType>('MEMORY');
  const [people, setPeople] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sendingTo, setSendingTo] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    Promise.allSettled([getConversations(), getFollowing(user.id)]).then(([conversations, following]) => {
      if (cancelled) return;
      const list: UserSummary[] = [];
      const seen = new Set<string>();
      const add = (person: UserSummary) => {
        if (person.id === user.id || seen.has(person.id)) return;
        seen.add(person.id);
        list.push(person);
      };
      if (conversations.status === 'fulfilled') conversations.value.forEach((c) => add(c.otherUser));
      if (following.status === 'fulfilled') following.value.forEach(add);
      setPeople(list);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? people.filter((p) => p.username.toLowerCase().includes(q) || (p.displayName ?? '').toLowerCase().includes(q))
      : people;
    return preselected ? [...filtered].sort((a, b) => Number(b.id === preselected) - Number(a.id === preselected)) : filtered;
  }, [people, query, preselected]);

  async function invite(person: UserSummary) {
    setSendingTo(person.id);
    setError('');
    try {
      const room = await inviteToGame(person.id, game);
      navigate(`/distraerme/sala/${room.id}`);
    } catch (err) {
      setError(inviteError(err));
      setSendingTo(null);
    }
  }

  return (
    <GameShell
      title="Invitar a alguien"
      subtitle="A veces acompañar es hacer algo juntos, sin tener que saber qué decir."
      backTo="/distraerme"
    >
      <section aria-labelledby="invite-game" className="space-y-3">
        <h2 id="invite-game" className="font-serif text-lg">
          ¿A qué juegan?
        </h2>
        <div className="grid gap-2 sm:grid-cols-3">
          {GAME_ORDER.map((option) => {
            const ready = TOGETHER_GAMES.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={game === option}
                disabled={!ready}
                onClick={() => setGame(option)}
                className={cn(
                  'rounded-2xl bg-card p-3 text-left shadow-soft transition-shadow',
                  game === option ? 'ring-2 ring-listening' : 'hover:shadow-lift',
                  !ready && 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="block font-medium">{GAME_NAMES[option]}</span>
                <span className="block text-xs text-muted-foreground">{ready ? GAME_HINT[option] : 'Muy pronto de a dos'}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="invite-person" className="space-y-3">
        <h2 id="invite-person" className="font-serif text-lg">
          ¿Con quién?
        </h2>
        <label className="relative block">
          <span className="sr-only">Buscar persona</span>
          <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nombre"
            className="min-h-11 w-full rounded-full border border-border bg-card pr-4 pl-10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        {error ? (
          <p role="alert" className="rounded-2xl bg-presence-soft/70 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Buscando a tu gente…</p>
        ) : visible.length === 0 ? (
          <Card className="p-5 text-sm text-muted-foreground">
            {people.length === 0
              ? 'Todavía no hay nadie para invitar. Podés invitar a quienes seguís o con quienes ya charlaste.'
              : 'No encontramos a nadie con ese nombre.'}
          </Card>
        ) : (
          <ul className="space-y-2">
            {visible.map((person) => (
              <li key={person.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <Avatar avatarUrl={person.avatarUrl} name={personName(person)} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{personName(person)}</span>
                  <span className="block truncate text-xs text-muted-foreground">@{person.username}</span>
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="listening"
                  disabled={sendingTo !== null}
                  aria-label={`Invitar a ${personName(person)} a jugar ${GAME_NAMES[game]}`}
                  onClick={() => void invite(person)}
                >
                  {sendingTo === person.id ? 'Invitando…' : 'Invitar'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </GameShell>
  );
}
