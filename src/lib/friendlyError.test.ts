import { AxiosError } from 'axios';
import { describe, expect, it } from 'vitest';
import { OFFLINE_MESSAGE } from '../auth/apiError';
import { friendlyError } from './friendlyError';

function httpError(status: number, message = 'You cannot do that') {
  const error = new AxiosError('fail');
  error.response = { status, data: { message }, statusText: '', headers: {}, config: {} as never };
  return error;
}

describe('friendlyError', () => {
  it('never shows the raw backend message', () => {
    expect(friendlyError(httpError(400, 'displayName cannot be blank'), 'Fallback')).toBe('Fallback');
    expect(friendlyError(httpError(403), 'Fallback')).toBe('Fallback');
  });

  it('explains connection, rate limit and missing content in Spanish', () => {
    expect(friendlyError(new AxiosError('net'), 'Fallback')).toBe(OFFLINE_MESSAGE);
    expect(friendlyError(httpError(429), 'Fallback')).toMatch(/Esperá un momento/);
    expect(friendlyError(httpError(404), 'Fallback')).toBe('Esto ya no está disponible.');
  });

  it('uses the fallback for non-HTTP errors', () => {
    expect(friendlyError(new Error('boom'), 'Fallback')).toBe('Fallback');
  });
});
