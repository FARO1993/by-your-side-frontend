export const PASSWORD_MIN_LENGTH = 8;

export function passwordLengthError(password: string): string | null {
  if (!password) return 'Ingresá una contraseña.';
  if (password.length < PASSWORD_MIN_LENGTH) return 'Usá al menos 8 caracteres.';
  return null;
}

export function confirmPasswordError(password: string, confirmation: string): string | null {
  if (!confirmation) return 'Confirmá la contraseña.';
  if (password !== confirmation) return 'Las contraseñas no coinciden.';
  return null;
}
