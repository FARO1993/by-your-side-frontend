import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { discoverUsers } from './users';

const page = {
  content: [
    {
      id: 'ana',
      username: 'ana',
      displayName: 'Ana',
      bio: null,
      avatarUrl: null,
      profileVisibility: 'PUBLIC',
      followState: 'NONE',
      available: true,
      statusMood: 'NEED_TO_TALK',
    },
  ],
  totalElements: 1,
  totalPages: 1,
  number: 0,
  size: 20,
  last: true,
};

describe('discoverUsers', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.get.mockResolvedValue({ data: page });
  });

  it('browses without q when the query is absent or blank', async () => {
    await discoverUsers({ page: 0, size: 20 });
    expect(client.get).toHaveBeenCalledWith('/api/users/discover', {
      params: { page: 0, size: 20 },
      signal: undefined,
    });

    await discoverUsers({ q: '   ', page: 2, size: 20 });
    expect(client.get).toHaveBeenLastCalledWith('/api/users/discover', {
      params: { page: 2, size: 20 },
      signal: undefined,
    });
  });

  it('sends a trimmed q with page and size', async () => {
    const signal = new AbortController().signal;
    await discoverUsers({ q: ' fac ', page: 1, size: 20, signal });
    expect(client.get).toHaveBeenCalledWith('/api/users/discover', {
      params: { page: 1, size: 20, q: 'fac' },
      signal,
    });
  });

  it('returns the page, including available and statusMood', async () => {
    await expect(discoverUsers()).resolves.toEqual(page);
    expect(page.content[0].available).toBe(true);
    expect(page.content[0].statusMood).toBe('NEED_TO_TALK');
  });

  it('rejects a failed request', async () => {
    client.get.mockRejectedValueOnce(new AxiosError('down'));
    await expect(discoverUsers({ q: 'ana' })).rejects.toBeInstanceOf(AxiosError);
  });
});
