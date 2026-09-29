import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { getCompanionPreferences, getPublicAvailability, replaceCompanionPreferences } from './users';

function httpError(status: number) {
  const error = new AxiosError('no');
  error.response = { status, data: null, statusText: 'Error', headers: {}, config: {} as never };
  return error;
}

describe('public availability and companion preferences', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.patch.mockReset();
  });

  it('returns an availability object, absence, or a hidden profile', async () => {
    const value = { available: true, offeringType: 'TALK', expiresAt: '2026-09-20T18:00:00.000Z' };
    client.get.mockResolvedValueOnce({ data: value });
    await expect(getPublicAvailability('user-1')).resolves.toEqual({ kind: 'available', value });

    client.get.mockResolvedValueOnce({ data: null });
    await expect(getPublicAvailability('user-1')).resolves.toEqual({ kind: 'none' });

    client.get.mockResolvedValueOnce({ data: '' });
    await expect(getPublicAvailability('user-1')).resolves.toEqual({ kind: 'none' });

    client.get.mockRejectedValueOnce(httpError(404));
    await expect(getPublicAvailability('user-1')).resolves.toEqual({ kind: 'hidden' });

    client.get.mockRejectedValueOnce(httpError(500));
    await expect(getPublicAvailability('user-1')).rejects.toBeInstanceOf(AxiosError);
    expect(client.get).toHaveBeenCalledWith('/api/users/user-1/availability');
  });

  it('reads preferences and replaces the full set, including an empty one', async () => {
    client.get.mockResolvedValueOnce({ data: { types: [] } });
    await expect(getCompanionPreferences()).resolves.toEqual([]);
    expect(client.get).toHaveBeenCalledWith('/api/users/me/companion-preferences');

    client.patch.mockResolvedValueOnce({ data: { types: ['LISTEN', 'DISTRACT'] } });
    await expect(replaceCompanionPreferences(['LISTEN', 'DISTRACT'])).resolves.toEqual(['LISTEN', 'DISTRACT']);
    expect(client.patch).toHaveBeenCalledWith('/api/users/me/companion-preferences', { types: ['LISTEN', 'DISTRACT'] });

    client.patch.mockResolvedValueOnce({ data: { types: [] } });
    await expect(replaceCompanionPreferences([])).resolves.toEqual([]);
  });
});
