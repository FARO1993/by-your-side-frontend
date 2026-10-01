import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { getFollowers, removeFollower, unfollowUser } from './follows';

describe('follower management', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.delete.mockReset();
  });

  it('lists followers and removes one without another relation call', async () => {
    client.get.mockResolvedValue({ data: [] });
    client.delete.mockResolvedValue({ data: undefined });
    await getFollowers('me');
    await removeFollower('user-1');
    await unfollowUser('user-1');
    expect(client.get).toHaveBeenCalledWith('/api/follows/me/followers');
    expect(client.delete).toHaveBeenNthCalledWith(1, '/api/follows/followers/user-1');
    expect(client.delete).toHaveBeenNthCalledWith(2, '/api/follows/user-1');
  });
});
