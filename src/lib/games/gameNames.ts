import type { GameRoom, GameType } from '../../api/gameRooms';
import type { UserSummary } from '../../api/types';

export const GAME_NAMES: Record<GameType, string> = {
  MEMORY: 'Memoria',
  PUZZLE: 'Puzzle',
  GARDEN: 'Jardín',
};

/** Juegos que ya tienen versión de a dos en el frontend. */
export const TOGETHER_GAMES: GameType[] = ['MEMORY', 'PUZZLE'];

export function personName(user: UserSummary): string {
  return user.displayName || user.username;
}

/** La otra persona de la sala, vista desde `myId`. */
export function partnerOf(room: GameRoom, myId: string | undefined): UserSummary {
  return room.host.id === myId ? room.guest : room.host;
}
