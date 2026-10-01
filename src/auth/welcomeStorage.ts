/**
 * Marca temporal de bienvenida, por usuario.
 * El backend no expone un campo de onboarding: esto vive solo en el cliente
 * hasta que exista un contrato para persistirlo en la cuenta.
 */

const SEEN_PREFIX = 'byyourside.welcomeSeen.';
const PENDING_PREFIX = 'byyourside.welcomePending.';
const ARM_KEY = 'byyourside.welcomePending.arm';

function seenKey(userId: string): string {
  return `${SEEN_PREFIX}${userId}`;
}

function pendingKey(userId: string): string {
  return `${PENDING_PREFIX}${userId}`;
}

export const welcomeStorage = {
  armForNextAuthenticatedUser(): void {
    sessionStorage.setItem(ARM_KEY, 'true');
  },

  consumeArm(userId: string): void {
    if (sessionStorage.getItem(ARM_KEY) !== 'true') return;
    sessionStorage.removeItem(ARM_KEY);
    if (localStorage.getItem(seenKey(userId)) === 'true') return;
    localStorage.setItem(pendingKey(userId), 'true');
  },

  markSeen(userId: string): void {
    localStorage.setItem(seenKey(userId), 'true');
    localStorage.removeItem(pendingKey(userId));
    sessionStorage.removeItem(ARM_KEY);
  },

  shouldShow(userId: string): boolean {
    return localStorage.getItem(pendingKey(userId)) === 'true'
      && localStorage.getItem(seenKey(userId)) !== 'true';
  },

  hasSeen(userId: string): boolean {
    return localStorage.getItem(seenKey(userId)) === 'true';
  },
};
