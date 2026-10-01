import type { PostResponseType } from '../api/types';

export type PostResponseFamily = 'presence' | 'listening';

export interface PostResponseChoice {
  type: PostResponseType;
  label: string;
  family: PostResponseFamily;
}

export const POST_RESPONSES: PostResponseChoice[] = [
  { type: 'WITH_YOU', label: 'Estoy con vos', family: 'presence' },
  { type: 'NOT_ALONE', label: 'No estás solo/a', family: 'presence' },
  { type: 'HUG', label: 'Te abrazo', family: 'presence' },
  { type: 'READING', label: 'Te leo', family: 'listening' },
  { type: 'TELL_ME_MORE', label: 'Contame más', family: 'listening' },
  { type: 'LISTENING', label: 'Estoy escuchando', family: 'listening' },
];

const PRESENCE = new Set<PostResponseType>(['WITH_YOU', 'NOT_ALONE', 'HUG']);

export function isPresenceResponse(type: PostResponseType): boolean {
  return PRESENCE.has(type);
}

export function isListeningResponse(type: PostResponseType): boolean {
  return !isPresenceResponse(type);
}

export function postResponseLabel(type: PostResponseType): string {
  return POST_RESPONSES.find((choice) => choice.type === type)?.label ?? type;
}

export interface PostResponseState {
  presenceCount: number;
  listeningCount: number;
  currentUserResponseType: PostResponseType | null;
}

function familyOf(type: PostResponseType | null): PostResponseFamily | null {
  if (!type) return null;
  return isPresenceResponse(type) ? 'presence' : 'listening';
}

function atLeastZero(count: number): number {
  return Math.max(0, count);
}

export function nextPostResponseState(current: PostResponseState, next: PostResponseType | null): PostResponseState {
  const from = familyOf(current.currentUserResponseType);
  const to = familyOf(next);
  let presenceCount = current.presenceCount;
  let listeningCount = current.listeningCount;

  if (from !== to) {
    if (from === 'presence') presenceCount = atLeastZero(presenceCount - 1);
    if (from === 'listening') listeningCount = atLeastZero(listeningCount - 1);
    if (to === 'presence') presenceCount += 1;
    if (to === 'listening') listeningCount += 1;
  }

  return {
    presenceCount,
    listeningCount,
    currentUserResponseType: next,
  };
}
