import { describe, expect, it } from 'vitest';
import { displayNameFieldError, emailFieldError, loginPasswordError } from './authValidation';

describe('auth field validation', () => {
  it('asks for an email and rejects a malformed one', () => {
    expect(emailFieldError('  ')).toBe('Ingresá tu correo electrónico.');
    expect(emailFieldError('no-es-correo')).toBe('Ese correo no parece válido.');
    expect(emailFieldError(' ana@example.com ')).toBeNull();
  });

  it('only requires a password on login', () => {
    expect(loginPasswordError('')).toBe('Ingresá tu contraseña.');
    expect(loginPasswordError('ab')).toBeNull();
  });

  it('asks how the person wants to be called', () => {
    expect(displayNameFieldError('   ')).toBe('Contanos cómo querés que te llamemos.');
    expect(displayNameFieldError('Ana')).toBeNull();
  });
});
