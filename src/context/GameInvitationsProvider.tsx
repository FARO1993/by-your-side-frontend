import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Gamepad2 } from 'lucide-react';
import {
  GAME_ROOMS_QUEUE,
  acceptGameRoom,
  declineGameRoom,
  getOpenGameRooms,
  type GameRoom,
  type GameRoomMessage,
} from '../api/gameRooms';
import { subscribeToUserQueue } from '../api/socket';
import Avatar from '../components/Avatar';
import { Button } from '../components/byourside/ui';
import { GAME_NAMES, personName } from '../lib/games/gameNames';
import { useAuth } from './AuthContext';
import { GameInvitationsContext } from './gameInvitationsContext';

const REFRESH_MS = 60_000;

function upsert(rooms: GameRoom[], room: GameRoom): GameRoom[] {
  const rest = rooms.filter((item) => item.id !== room.id);
  return room.status === 'ENDED' ? rest : [room, ...rest];
}

/**
 * Invitaciones a jugar: escucha /user/queue/game-rooms en toda la app y
 * muestra una tarjeta amable ("Facu te invitó a jugar Memoria") con
 * "Jugar" o "Ahora no". Decir que no nunca le muestra un motivo a nadie.
 */
export function GameInvitationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [rooms, setRooms] = useState<GameRoom[]>([]);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const refresh = useCallback(() => {
    getOpenGameRooms()
      .then(setRooms)
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    const timer = window.setInterval(refresh, REFRESH_MS);
    const unsubscribe = subscribeToUserQueue<GameRoomMessage>(GAME_ROOMS_QUEUE, (message) => {
      if (message.room) setRooms((current) => upsert(current, message.room as GameRoom));
    });
    return () => {
      window.clearInterval(timer);
      unsubscribe();
    };
  }, [refresh]);

  const invitations = useMemo(
    () => rooms.filter((room) => room.status === 'INVITED' && room.guest.id === user?.id),
    [rooms, user?.id],
  );
  const value = useMemo(() => ({ invitations, openRooms: rooms, refresh }), [invitations, rooms, refresh]);

  const current = invitations[0];
  // Dentro de una partida no se tapa el tablero: la invitación sigue en "Partidas abiertas".
  const onRoomPage = location.pathname.startsWith('/distraerme/sala/');

  async function respond(accept: boolean) {
    if (!current) return;
    setBusy(true);
    setNotice('');
    try {
      if (accept) {
        const room = await acceptGameRoom(current.id);
        setRooms((list) => upsert(list, room));
        navigate(`/distraerme/sala/${room.id}`);
      } else {
        const room = await declineGameRoom(current.id);
        setRooms((list) => upsert(list, room));
      }
    } catch {
      setNotice('Esa invitación ya no está disponible.');
      setRooms((list) => list.filter((room) => room.id !== current.id));
      refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <GameInvitationsContext.Provider value={value}>
      {children}
      {(current && !onRoomPage) || notice ? (
        <div className="fixed inset-x-4 bottom-20 z-40 mx-auto max-w-sm md:right-6 md:bottom-6 md:left-auto md:mx-0">
          <div role="region" aria-label="Invitación a jugar" className="rounded-2xl bg-card p-4 shadow-lift animate-soft-rise">
            {current && !onRoomPage ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar avatarUrl={current.host.avatarUrl} name={personName(current.host)} size="sm" />
                  <p className="text-sm">
                    <span className="font-medium">{personName(current.host)}</span> te invitó a jugar{' '}
                    <span className="font-medium">{GAME_NAMES[current.game]}</span>.
                  </p>
                  <Gamepad2 className="ml-auto size-5 shrink-0 text-listening-strong" aria-hidden="true" />
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void respond(false)}>
                    Ahora no
                  </Button>
                  <Button type="button" size="sm" variant="listening" disabled={busy} onClick={() => void respond(true)}>
                    Jugar
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground" role="status">
                  {notice}
                </p>
                <Button type="button" size="sm" variant="outline" onClick={() => setNotice('')}>
                  Cerrar
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </GameInvitationsContext.Provider>
  );
}
