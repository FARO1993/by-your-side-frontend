import { describe, expect, it } from 'vitest';
import { profileUpdatePayload } from './profile';

describe('profile update payload', () => {
  it('trims the display name without collapsing internal spaces', () => {
    expect(profileUpdatePayload({ displayName: '  Ana  Luz  ', bio: 'hola' })).toEqual({
      ok: true,
      body: { displayName: 'Ana  Luz', bio: 'hola' },
    });
  });

  it('refuses a blank display name', () => {
    expect(profileUpdatePayload({ displayName: '   ', bio: 'hola' })).toEqual({
      ok: false,
      message: 'El nombre no puede quedar vacío.',
    });
  });

  it('trims the bio and sends an empty string when it is blank', () => {
    expect(profileUpdatePayload({ displayName: 'Ana', bio: '  escuchar  ' })).toEqual({
      ok: true,
      body: { displayName: 'Ana', bio: 'escuchar' },
    });
    expect(profileUpdatePayload({ displayName: 'Ana', bio: '   ' })).toEqual({
      ok: true,
      body: { displayName: 'Ana', bio: '' },
    });
  });
});
