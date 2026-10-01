import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  patch: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import { updateProfile } from './users';

describe('profile update', () => {
  beforeEach(() => {
    client.patch.mockReset();
  });

  it('patches the current user and returns the saved profile', async () => {
    const saved = { id: 'me', displayName: 'Ana', bio: null };
    client.patch.mockResolvedValue({ data: saved });
    await expect(updateProfile({ displayName: 'Ana', bio: '', profileVisibility: 'PRIVATE' })).resolves.toEqual(saved);
    expect(client.patch).toHaveBeenCalledWith('/api/users/me', { displayName: 'Ana', bio: '', profileVisibility: 'PRIVATE' });
  });
});
