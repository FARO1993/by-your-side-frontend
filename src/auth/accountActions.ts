import { changePassword, resetPassword } from '../api/auth';
import { clearLocalSession } from './session';

export async function applyPasswordChange(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<void> {
  await changePassword(payload);
  clearLocalSession('password-changed');
}

export async function applyPasswordReset(payload: { token: string; newPassword: string }): Promise<void> {
  await resetPassword(payload);
  clearLocalSession('password-reset');
}
