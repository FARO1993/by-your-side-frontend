import { describe, expect, it, vi } from 'vitest';
import apiClient from './client';
import { createReport } from './reports';

describe('createReport', () => {
  it('posts to /api/reports, trimming the description and omitting it when blank', async () => {
    const post = vi.spyOn(apiClient, 'post').mockResolvedValue({ data: {} });

    await createReport({ targetType: 'USER', targetId: 'u2', reason: 'HARASSMENT', description: '  me insulta  ' });
    expect(post).toHaveBeenLastCalledWith('/api/reports', {
      targetType: 'USER',
      targetId: 'u2',
      reason: 'HARASSMENT',
      description: 'me insulta',
    });

    await createReport({ targetType: 'USER', targetId: 'u2', reason: 'SPAM', description: '   ' });
    expect(post).toHaveBeenLastCalledWith('/api/reports', {
      targetType: 'USER',
      targetId: 'u2',
      reason: 'SPAM',
      description: undefined,
    });
    post.mockRestore();
  });
});
