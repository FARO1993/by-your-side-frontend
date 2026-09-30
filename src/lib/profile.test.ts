import { describe, expect, it } from 'vitest';
import { profileUpdatePayload } from './profile';

describe('profile update payload', () => {
  it('trims the display name without collapsing internal spaces', () => {
    expect(profileUpdatePayload({ displayName: '  Ana  Luz  ', bio: 'hola', profileVisibility: 'PUBLIC' })).toEqual({
      ok: true,
      body: { displayName: 'Ana  Luz', bio: 'hola', profileVisibility: 'PUBLIC' },
    });
  });

  it('refuses a blank display name', () => {
    expect(profileUpdatePayload({ displayName: '   ', bio: 'hola', profileVisibility: 'PRIVATE' })).toEqual({
      ok: false,
      message: 'El nombre no puede quedar vacío.',
    });
  });

  it('trims the bio and sends an empty string when it is blank', () => {
    expect(profileUpdatePayload({ displayName: 'Ana', bio: '  escuchar  ', profileVisibility: 'PUBLIC' })).toEqual({
      ok: true,
      body: { displayName: 'Ana', bio: 'escuchar', profileVisibility: 'PUBLIC' },
    });
    expect(profileUpdatePayload({ displayName: 'Ana', bio: '   ', profileVisibility: 'PRIVATE' })).toEqual({
      ok: true,
      body: { displayName: 'Ana', bio: '', profileVisibility: 'PRIVATE' },
    });
  });
});
