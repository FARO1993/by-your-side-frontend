const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function emailFieldError(value: string): string | null {
  const email = value.trim();
  if (!email) return 'Ingresá tu correo electrónico.';
  if (!EMAIL_PATTERN.test(email)) return 'Ese correo no parece válido.';
  return null;
}

export function loginPasswordError(value: string): string | null {
  if (!value) return 'Ingresá tu contraseña.';
  return null;
}

export function displayNameFieldError(value: string): string | null {
  if (!value.trim()) return 'Contanos cómo querés que te llamemos.';
  return null;
}
