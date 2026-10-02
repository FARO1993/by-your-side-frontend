import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogOut, MessageCircle } from 'lucide-react';
import { getOrCreateConversation } from '../../api/chat';
import type { GameRoom } from '../../api/gameRooms';
import { readApiError } from '../../auth/apiError';
import Avatar from '../../components/Avatar';
import { GameShell } from '../../components/games/GameShell';
import { MemoryTogetherBoard } from '../../components/games/together/MemoryTogetherBoard';
import { Button, Card } from '../../components/byourside/ui';
import { useAuth } from '../../context/AuthContext';
import { useGameRoom } from '../../hooks/useGameRoom';
import { friendlyError } from '../../lib/friendlyError';
import { GAME_NAMES, partnerOf, personName } from '../../lib/games/gameNames';

function endedText(room: GameRoom, isHost: boolean, partnerName: string): { title: string; body: string } {
  switch (room.endReason) {
    case 'LEFT':
      return { title: 'La partida terminó', body: `${partnerName} salió de la partida. Gracias por este rato juntos.` };
    case 'DECLINED':
      return isHost
        ? { title: 'Ahora no puede', body: `${partnerName} no puede jugar en este momento. Quizás en otro rato.` }
        : { title: 'Invitación respondida', body: 'Le dijiste que ahora no. Está bien.' };
    case 'CANCELLED':
      return isHost
        ? { title: 'Invitación cancelada', body: 'Cancelaste la invitación.' }
        : { title: 'Invitación cancelada', body: `${partnerName} canceló la invitación.` };
    case 'EXPIRED':
      return room.startedAt
        ? { title: 'La partida se cerró', body: 'Pasó mucho tiempo sin jugadas y se cerró sola.' }
        : { title: 'La invitación venció', body: 'Nadie respondió a tiempo. Se puede volver a invitar cuando quieran.' };
    default:
      return { title: 'La partida terminó', body: 'Esta partida ya no está disponible.' };
  }
}

export default function GameRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  // Una sala nueva arranca de cero (estado, jugadas, timers).
  return <GameRoomView key={roomId} roomId={roomId} />;
}

function GameRoomView({ roomId }: { roomId: string | undefined }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, events, loading, error, send, accept, decline, leave } = useGameRoom(roomId);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function run(action: () => Promise<void>, after?: () => void) {
    setBusy(true);
    setActionError('');
    try {
      await action();
      after?.();
    } catch (err) {
      setActionError(friendlyError(err, 'No pudimos hacerlo ahora. Probá de nuevo.'));
    } finally {
      setBusy(false);
    }
  }

  const leaveAndGo = () => void run(leave, () => navigate('/distraerme'));

  async function openChat(partnerId: string) {
    await run(async () => {
      const conversation = await getOrCreateConversation(partnerId);
      navigate(`/messages/${conversation.id}`);
    });
  }

  if (loading) {
    return (
      <GameShell title="Jugar acompañado" subtitle="Preparando la partida…" backTo="/distraerme">
        <p className="text-sm text-muted-foreground">Un momento…</p>
      </GameShell>
    );
  }

  if (error || !room || !user) {
    const missing = readApiError(error).status === 404;
    return (
      <GameShell title="Jugar acompañado" subtitle="" backTo="/distraerme">
        <Card className="p-5 text-sm">
          {missing ? 'Esta partida ya no está disponible.' : friendlyError(error, 'No pudimos abrir la partida.')}
          <div className="mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/distraerme')}>
              Volver a Distraerme
            </Button>
          </div>
        </Card>
      </GameShell>
    );
  }

  const isHost = room.host.id === user.id;
  const partner = partnerOf(room, user.id);
  const partnerName = personName(partner);
  const gameName = GAME_NAMES[room.game];

  const partnerChip = (
    <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <Avatar avatarUrl={partner.avatarUrl} name={partnerName} size="sm" />
      <span>
        Con <span className="font-medium text-foreground">{partnerName}</span>
      </span>
    </p>
  );

  return (
    <GameShell
      title={`${gameName} juntos`}
      subtitle="Sin apuro y sin ganadores. Pueden salir cuando quieran."
      backTo="/distraerme"
      actions={
        room.status === 'ACTIVE' ? (
          <>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void openChat(partner.id)}>
              <MessageCircle className="size-4" aria-hidden="true" />
              Charla
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={busy} onClick={leaveAndGo}>
              <LogOut className="size-4" aria-hidden="true" />
              Salir
            </Button>
          </>
        ) : null
      }
    >
      {actionError ? (
        <p role="alert" className="rounded-2xl bg-presence-soft/70 px-4 py-3 text-sm">
          {actionError}
        </p>
      ) : null}

      {room.status === 'INVITED' && isHost ? (
        <Card className="space-y-3 p-5">
          {partnerChip}
          <p className="font-serif text-xl">Esperando a {partnerName}…</p>
          <p className="text-sm text-muted-foreground">
            Le llegó la invitación a jugar {gameName}. Si ahora no puede, no pasa nada.
          </p>
          <Button type="button" variant="outline" disabled={busy} onClick={leaveAndGo}>
            Cancelar invitación
          </Button>
        </Card>
      ) : null}

      {room.status === 'INVITED' && !isHost ? (
        <Card className="space-y-3 p-5">
          {partnerChip}
          <p className="font-serif text-xl">
            {partnerName} te invitó a jugar {gameName}
          </p>
          <p className="text-sm text-muted-foreground">Si no tenés ganas ahora, podés decir que no: no se le muestra ningún motivo.</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="listening" disabled={busy} onClick={() => void run(accept)}>
              Jugar
            </Button>
            <Button type="button" variant="outline" disabled={busy} onClick={() => void run(decline, () => navigate('/distraerme'))}>
              Ahora no
            </Button>
          </div>
        </Card>
      ) : null}

      {room.status === 'ACTIVE' ? (
        <div className="space-y-4">
          {partnerChip}
          {room.game === 'MEMORY' ? (
            <MemoryTogetherBoard room={room} events={events} myId={user.id} send={send} onLeave={leaveAndGo} />
          ) : (
            <Card className="p-5 text-sm text-muted-foreground">Este juego todavía no tiene versión de a dos.</Card>
          )}
        </div>
      ) : null}

      {room.status === 'ENDED' ? (
        <Card className="space-y-3 p-5 text-center animate-soft-rise">
          {(() => {
            const text = endedText(room, isHost, partnerName);
            return (
              <>
                <p className="font-serif text-xl">{text.title}</p>
                <p className="text-sm text-muted-foreground">{text.body}</p>
              </>
            );
          })()}
          <div className="flex flex-wrap justify-center gap-2">
            {isHost && (room.endReason === 'DECLINED' || room.endReason === 'EXPIRED') ? (
              <Button type="button" variant="outline" onClick={() => navigate(`/distraerme/invitar?con=${partner.id}`)}>
                Invitar de nuevo más tarde
              </Button>
            ) : null}
            <Button type="button" variant="listening" onClick={() => navigate('/distraerme')}>
              Volver a Distraerme
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            <Link to="/distraerme?jugar=solo" className="underline-offset-2 hover:underline">
              O jugar un rato solo/a
            </Link>
          </p>
        </Card>
      ) : null}
    </GameShell>
  );
}
