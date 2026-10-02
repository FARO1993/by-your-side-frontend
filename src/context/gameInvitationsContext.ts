import { createContext, useContext } from 'react';
import type { GameRoom } from '../api/gameRooms';

export interface GameInvitationsValue {
  /** Invitaciones recibidas que siguen pendientes. */
  invitations: GameRoom[];
  /** Salas abiertas propias (invitaciones enviadas y partidas activas). */
  openRooms: GameRoom[];
  refresh: () => void;
}

export const GameInvitationsContext = createContext<GameInvitationsValue | null>(null);

const EMPTY: GameInvitationsValue = { invitations: [], openRooms: [], refresh: () => {} };

/** Fuera del provider (por ejemplo, en tests de una página suelta) no hay salas. */
export function useGameInvitations(): GameInvitationsValue {
  return useContext(GameInvitationsContext) ?? EMPTY;
}
