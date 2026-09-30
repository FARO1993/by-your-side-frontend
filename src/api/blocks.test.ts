import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  post: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { blockUser, unblockUser } from './blocks';

describe('blocks', () => {
  beforeEach(() => {
    client.post.mockReset();
    client.delete.mockReset();
    client.post.mockResolvedValue({ data: undefined });
    client.delete.mockResolvedValue({ data: undefined });
  });

  it('blocks and unblocks on the user path', async () => {
    await blockUser('user-1');
    await unblockUser('user-1');
    expect(client.post).toHaveBeenCalledWith('/api/users/user-1/block');
    expect(client.delete).toHaveBeenCalledWith('/api/users/user-1/block');
  });
});
