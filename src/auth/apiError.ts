import axios from 'axios';
import type { ApiErrorResponse } from '../api/types';

export interface ApiFailure {
  status: number | null;
  message: string | null;
  fieldErrors: Record<string, string> | null;
  offline: boolean;
}

export function readApiError(error: unknown): ApiFailure {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return { status: null, message: null, fieldErrors: null, offline: false };
  }

  if (!error.response) {
    return { status: null, message: null, fieldErrors: null, offline: true };
  }

  return {
    status: error.response.status,
    message: error.response.data?.message ?? null,
    fieldErrors: error.response.data?.fieldErrors ?? null,
    offline: false,
  };
}

export const OFFLINE_MESSAGE = 'No pudimos conectar. Revisá tu conexión e intentá de nuevo.';
export const UNEXPECTED_MESSAGE = 'Ocurrió un error inesperado. Intentá de nuevo.';

export function loginErrorMessage(error: unknown): string {
  const api = readApiError(error);
  if (api.offline) return OFFLINE_MESSAGE;
  if (api.status === 401) return 'El correo o la contraseña no son correctos.';
  if (api.status === 400) return 'Revisá los datos e intentá de nuevo.';
  return 'No pudimos iniciar sesión. Intentá de nuevo.';
}

export function registerErrorMessage(error: unknown): string {
  const api = readApiError(error);
  if (api.offline) return OFFLINE_MESSAGE;
  if (api.status === 409) return 'Ya existe una cuenta con ese correo.';
  if (api.status === 400) {
    return api.fieldErrors?.password ?? api.fieldErrors?.email ?? 'Revisá los datos e intentá de nuevo.';
  }
  return 'No pudimos crear la cuenta. Intentá de nuevo.';
}

export type VerifyFailure = 'invalid' | 'expired' | 'used' | 'superseded' | 'error';

export function classifyVerifyError(error: unknown): VerifyFailure {
  const api = readApiError(error);
  if (api.offline || api.status == null) return 'error';
  if (api.status === 409) return 'used';
  const message = api.message ?? '';
  if (message.includes('expired')) return 'expired';
  if (message.includes('no longer valid')) return 'superseded';
  if (api.status === 400) return 'invalid';
  return 'error';
}

export type ResetFailure = 'invalid' | 'expired' | 'used' | 'superseded' | 'error';

export function classifyResetError(error: unknown): ResetFailure {
  const api = readApiError(error);
  if (api.offline || api.status == null) return 'error';
  if (api.status === 409) return 'used';
  const message = api.message ?? '';
  if (message.includes('expired')) return 'expired';
  if (message.includes('no longer valid')) return 'superseded';
  if (api.status === 400) return 'invalid';
  return 'error';
}

export function changePasswordFieldError(error: unknown): { current?: string; next?: string; form?: string } {
  const api = readApiError(error);
  if (api.offline) return { form: OFFLINE_MESSAGE };
  if (api.status === 400) {
    const message = api.message ?? '';
    if (message.includes('Current password is incorrect')) {
      return { current: 'La contraseña actual no es correcta.' };
    }
    if (message.includes('must be different')) {
      return { next: 'La nueva contraseña tiene que ser distinta de la actual.' };
    }
    if (api.fieldErrors?.newPassword || api.fieldErrors?.currentPassword) {
      return {
        current: api.fieldErrors.currentPassword,
        next: api.fieldErrors.newPassword ?? 'La contraseña tiene que tener al menos 8 caracteres.',
      };
    }
    return { form: 'No pudimos actualizar la contraseña. Revisá los datos.' };
  }
  if (api.status === 401) return { form: 'Tu sesión ya no es válida. Iniciá sesión nuevamente.' };
  return { form: UNEXPECTED_MESSAGE };
}
