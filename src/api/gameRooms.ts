import apiClient from './client';
import type { UserSummary } from './types';

/** Juegos que se pueden jugar de a dos (ver backend GameType). */
export type GameType = 'MEMORY' | 'PUZZLE' | 'GARDEN';
export type GameRoomStatus = 'INVITED' | 'ACTIVE' | 'ENDED';
export type GameRoomEndReason = 'DECLINED' | 'CANCELLED' | 'LEFT' | 'EXPIRED' | 'UNAVAILABLE';

export interface GameRoom {
  id: string;
  game: GameType;
  status: GameRoomStatus;
  endReason: GameRoomEndReason | null;
  host: UserSummary;
  guest: UserSummary;
  seed: number;
  eventCount: number;
  createdAt: string;
  startedAt: string | null;
  endedAt: string | null;
  expiresAt: string | null;
}

export interface GameEvent<P = unknown> {
  roomId: string;
  seq: number;
  actorId: string;
  type: string;
  payload: P;
  createdAt: string;
}

/** Lo que llega por /user/queue/game-rooms. */
export interface GameRoomMessage {
  kind: 'INVITATION' | 'ROOM' | 'EVENT';
  room: GameRoom | null;
  event: GameEvent | null;
}

export const GAME_ROOMS_QUEUE = '/user/queue/game-rooms';

export async function inviteToGame(guestId: string, game: GameType): Promise<GameRoom> {
  const response = await apiClient.post<GameRoom>('/api/game-rooms', { guestId, game });
  return response.data;
}

export async function getOpenGameRooms(): Promise<GameRoom[]> {
  const response = await apiClient.get<GameRoom[]>('/api/game-rooms');
  return response.data;
}

export async function getGameRoom(roomId: string): Promise<GameRoom> {
  const response = await apiClient.get<GameRoom>(`/api/game-rooms/${roomId}`);
  return response.data;
}

export async function acceptGameRoom(roomId: string): Promise<GameRoom> {
  const response = await apiClient.post<GameRoom>(`/api/game-rooms/${roomId}/accept`);
  return response.data;
}

export async function declineGameRoom(roomId: string): Promise<GameRoom> {
  const response = await apiClient.post<GameRoom>(`/api/game-rooms/${roomId}/decline`);
  return response.data;
}

export async function leaveGameRoom(roomId: string): Promise<GameRoom> {
  const response = await apiClient.post<GameRoom>(`/api/game-rooms/${roomId}/leave`);
  return response.data;
}

export async function getGameEvents(roomId: string, after = 0): Promise<GameEvent[]> {
  const response = await apiClient.get<GameEvent[]>(`/api/game-rooms/${roomId}/events`, { params: { after } });
  return response.data;
}

export async function sendGameEvent(roomId: string, type: string, payload: unknown): Promise<GameEvent> {
  const response = await apiClient.post<GameEvent>(`/api/game-rooms/${roomId}/events`, { type, payload });
  return response.data;
}
