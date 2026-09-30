import { describe, expect, it } from 'vitest';
import { isListeningResponse, isPresenceResponse, nextPostResponseState, type PostResponseState } from './postResponse';

const empty: PostResponseState = { presenceCount: 0, listeningCount: 0, currentUserResponseType: null };

describe('post response families', () => {
  it('groups presence and listening without overlap', () => {
    expect(isPresenceResponse('WITH_YOU')).toBe(true);
    expect(isPresenceResponse('NOT_ALONE')).toBe(true);
    expect(isPresenceResponse('HUG')).toBe(true);
    expect(isListeningResponse('READING')).toBe(true);
    expect(isListeningResponse('TELL_ME_MORE')).toBe(true);
    expect(isListeningResponse('LISTENING')).toBe(true);
    expect(isPresenceResponse('LISTENING')).toBe(false);
  });
});

describe('post response count transitions', () => {
  it('adds presence from none', () => {
    expect(nextPostResponseState(empty, 'WITH_YOU')).toEqual({
      presenceCount: 1,
      listeningCount: 0,
      currentUserResponseType: 'WITH_YOU',
    });
  });

  it('adds listening from none', () => {
    expect(nextPostResponseState(empty, 'READING')).toEqual({
      presenceCount: 0,
      listeningCount: 1,
      currentUserResponseType: 'READING',
    });
  });

  it('keeps counts when presence changes to another presence', () => {
    expect(nextPostResponseState({ presenceCount: 3, listeningCount: 1, currentUserResponseType: 'WITH_YOU' }, 'HUG')).toEqual({
      presenceCount: 3,
      listeningCount: 1,
      currentUserResponseType: 'HUG',
    });
  });

  it('keeps counts when listening changes to another listening', () => {
    expect(nextPostResponseState({ presenceCount: 1, listeningCount: 2, currentUserResponseType: 'READING' }, 'LISTENING')).toEqual({
      presenceCount: 1,
      listeningCount: 2,
      currentUserResponseType: 'LISTENING',
    });
  });

  it('moves a response from presence to listening', () => {
    expect(nextPostResponseState({ presenceCount: 2, listeningCount: 1, currentUserResponseType: 'WITH_YOU' }, 'LISTENING')).toEqual({
      presenceCount: 1,
      listeningCount: 2,
      currentUserResponseType: 'LISTENING',
    });
  });

  it('moves a response from listening to presence', () => {
    expect(nextPostResponseState({ presenceCount: 1, listeningCount: 2, currentUserResponseType: 'LISTENING' }, 'HUG')).toEqual({
      presenceCount: 2,
      listeningCount: 1,
      currentUserResponseType: 'HUG',
    });
  });

  it('removes presence without going below zero', () => {
    expect(nextPostResponseState({ presenceCount: 1, listeningCount: 0, currentUserResponseType: 'WITH_YOU' }, null)).toEqual(empty);
    expect(nextPostResponseState({ presenceCount: 0, listeningCount: 0, currentUserResponseType: 'WITH_YOU' }, null).presenceCount).toBe(0);
  });

  it('removes listening without going below zero', () => {
    expect(nextPostResponseState({ presenceCount: 0, listeningCount: 1, currentUserResponseType: 'READING' }, null)).toEqual(empty);
    expect(nextPostResponseState({ presenceCount: 0, listeningCount: 0, currentUserResponseType: 'READING' }, null).listeningCount).toBe(0);
  });
});
