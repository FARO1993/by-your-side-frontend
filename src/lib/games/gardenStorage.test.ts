import { afterEach, describe, expect, it, vi } from 'vitest';
import { createGarden, plantSeed } from './garden';
import { gardenKey, loadGarden, saveGarden } from './gardenStorage';

describe('gardenStorage', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('keeps one garden per person on this device', () => {
    const mine = plantSeed(createGarden(), 0, 'girasol').garden;
    saveGarden('u1', mine);
    expect(loadGarden('u1')).toEqual(mine);
    expect(loadGarden('u2')).toBeNull();
    expect(gardenKey('u1')).not.toBe(gardenKey('u2'));
  });

  it('never breaks when storage is unavailable', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(loadGarden('u1')).toBeNull();
    expect(() => saveGarden('u1', createGarden())).not.toThrow();
  });
});
