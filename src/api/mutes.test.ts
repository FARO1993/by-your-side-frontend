import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { muteUser, unmuteUser } from './mutes';

describe('mutes', () => {
  beforeEach(() => {
    client.post.mockReset();
    client.delete.mockReset();
    client.post.mockResolvedValue({ data: undefined });
    client.delete.mockResolvedValue({ data: undefined });
  });

  it('mutes and unmutes on the user path', async () => {
    await muteUser('user-1');
    await unmuteUser('user-1');
    expect(client.post).toHaveBeenCalledWith('/api/users/user-1/mute');
    expect(client.delete).toHaveBeenCalledWith('/api/users/user-1/mute');
  });
});
