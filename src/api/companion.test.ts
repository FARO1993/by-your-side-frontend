import { AxiosError } from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const client = vi.hoisted(() => ({
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('./client', () => ({
  default: client,
}));

import {
  cancelNeed,
  cancelOffering,
  getMyNeed,
  getMyOffering,
  listCompatibleOfferings,
  listOfferingsByType,
  setNeed,
  setOffering,
} from './companion';

describe('companion api', () => {
  beforeEach(() => {
    client.get.mockReset();
    client.put.mockReset();
    client.delete.mockReset();
  });

  it('treats an empty need or offering body as absence', async () => {
    client.get.mockResolvedValueOnce({ data: null });
    await expect(getMyNeed()).resolves.toBeNull();
    client.get.mockResolvedValueOnce({ data: '' });
    await expect(getMyOffering()).resolves.toBeNull();
  });

  it('puts a need and an offering, and deletes them', async () => {
    const savedNeed = { id: 'n', type: 'TALK', createdAt: 'a', expiresAt: 'b' };
    const savedOffering = { id: 'o', type: 'LISTEN', createdAt: 'a', expiresAt: 'b' };
    client.put.mockResolvedValueOnce({ data: savedNeed });
    await expect(setNeed('TALK')).resolves.toEqual(savedNeed);
    expect(client.put).toHaveBeenCalledWith('/api/companion/need', { type: 'TALK' });

    client.put.mockResolvedValueOnce({ data: savedOffering });
    await expect(setOffering('LISTEN')).resolves.toEqual(savedOffering);
    expect(client.put).toHaveBeenCalledWith('/api/companion/offering', { type: 'LISTEN' });

    client.delete.mockResolvedValue({ data: '' });
    await cancelNeed();
    await cancelOffering();
    expect(client.delete).toHaveBeenCalledWith('/api/companion/need');
    expect(client.delete).toHaveBeenCalledWith('/api/companion/offering');
  });

  it('loads compatible candidates and offerings by type', async () => {
    client.get.mockResolvedValueOnce({ data: [] });
    await expect(listCompatibleOfferings()).resolves.toEqual([]);
    expect(client.get).toHaveBeenCalledWith('/api/companion/offering/compatible');

    client.get.mockResolvedValueOnce({ data: null });
    await expect(listOfferingsByType('DISTRACT')).resolves.toEqual([]);
    expect(client.get).toHaveBeenCalledWith('/api/companion/offering', { params: { type: 'DISTRACT' } });
  });

  it('does not turn a failed read into an empty need', async () => {
    client.get.mockRejectedValueOnce(new AxiosError('down'));
    await expect(getMyNeed()).rejects.toBeInstanceOf(AxiosError);
  });
});
