/**
 * Si ya le ofrecimos a la persona elegir avatar (al entrar por primera vez).
 * Vive en este dispositivo; elegir o decir "ahora no" lo marca. Siempre se
 * puede cambiar después desde el perfil.
 */
const key = (userId: string) => `byyourside.avatarAsked.v1.${userId}`;

export const avatarPrompt = {
  wasAsked(userId: string): boolean {
    try {
      return localStorage.getItem(key(userId)) === 'true';
    } catch {
      return true; // Sin almacenamiento, no insistimos.
    }
  },
  markAsked(userId: string): void {
    try {
      localStorage.setItem(key(userId), 'true');
    } catch {
      // Sin almacenamiento: no pasa nada.
    }
  },
};
