import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GAME_ROOMS_QUEUE,
  acceptGameRoom,
  declineGameRoom,
  getGameEvents,
  getGameRoom,
  leaveGameRoom,
  sendGameEvent,
  type GameEvent,
  type GameRoom,
  type GameRoomMessage,
} from '../api/gameRooms';
import { subscribeToUserQueue } from '../api/socket';
import { useSocketStatus } from './useSocketStatus';

const PAGE = 1000;

/** Suma jugadas nuevas sin duplicar y en orden de seq. */
export function mergeEvents(current: GameEvent[], incoming: GameEvent[]): GameEvent[] {
  if (incoming.length === 0) return current;
  const bySeq = new Map(current.map((event) => [event.seq, event]));
  incoming.forEach((event) => bySeq.set(event.seq, event));
  return [...bySeq.values()].sort((a, b) => a.seq - b.seq);
}

async function fetchAllAfter(roomId: string, after: number): Promise<GameEvent[]> {
  const all: GameEvent[] = [];
  let cursor = after;
  for (;;) {
    const page = await getGameEvents(roomId, cursor);
    all.push(...page);
    if (page.length < PAGE) return all;
    cursor = page[page.length - 1].seq;
  }
}

/**
 * Una sala de juego compartida (montar con `key={roomId}` si el id puede cambiar): estado de la sala + jugadas en orden.
 * Las jugadas llegan por WebSocket; si falta alguna (hueco en seq) o hubo
 * una reconexión, se piden las que faltan por REST.
 */
export function useGameRoom(roomId: string | undefined) {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [events, setEvents] = useState<GameEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const lastSeq = useRef(0);
  const socketStatus = useSocketStatus();

  const applyEvents = useCallback((incoming: GameEvent[]) => {
    setEvents((current) => {
      const merged = mergeEvents(current, incoming);
      lastSeq.current = merged.length ? merged[merged.length - 1].seq : 0;
      return merged;
    });
  }, []);

  const catchUp = useCallback(async () => {
    if (!roomId) return;
    try {
      const [fresh, missing] = await Promise.all([getGameRoom(roomId), fetchAllAfter(roomId, lastSeq.current)]);
      setRoom(fresh);
      applyEvents(missing);
    } catch {
      // Se reintenta en la próxima jugada o reconexión.
    }
  }, [roomId, applyEvents]);

  // Carga inicial.
  useEffect(() => {
    if (!roomId) return undefined;
    let cancelled = false;
    Promise.all([getGameRoom(roomId), fetchAllAfter(roomId, 0)])
      .then(([loadedRoom, loadedEvents]) => {
        if (cancelled) return;
        setRoom(loadedRoom);
        applyEvents(loadedEvents);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [roomId, applyEvents]);

  // Tiempo real.
  useEffect(() => {
    if (!roomId) return undefined;
    return subscribeToUserQueue<GameRoomMessage>(GAME_ROOMS_QUEUE, (message) => {
      if (message.room?.id === roomId) setRoom(message.room);
      const event = message.event;
      if (event?.roomId === roomId) {
        if (event.seq > lastSeq.current + 1) void catchUp();
        applyEvents([event]);
      }
    });
  }, [roomId, applyEvents, catchUp]);

  // Al reconectar, recuperar lo que se haya perdido.
  const wasConnected = useRef(socketStatus === 'connected');
  useEffect(() => {
    if (socketStatus === 'connected' && !wasConnected.current) void catchUp();
    wasConnected.current = socketStatus === 'connected';
  }, [socketStatus, catchUp]);

  const send = useCallback(
    async (type: string, payload: unknown) => {
      if (!roomId) return;
      const event = await sendGameEvent(roomId, type, payload);
      applyEvents([event]);
    },
    [roomId, applyEvents],
  );

  const accept = useCallback(async () => {
    if (roomId) setRoom(await acceptGameRoom(roomId));
  }, [roomId]);

  const decline = useCallback(async () => {
    if (roomId) setRoom(await declineGameRoom(roomId));
  }, [roomId]);

  const leave = useCallback(async () => {
    if (roomId) setRoom(await leaveGameRoom(roomId));
  }, [roomId]);

  return { room, events, loading, error, send, accept, decline, leave, socketStatus };
}
