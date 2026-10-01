import apiClient from './client';
import type { AuthResponse, LoginCredentials, RegisterData, User } from './types';

export async function register(data: RegisterData): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
  return response.data;
}

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
  return response.data;
}

export async function getCurrentUser(): Promise<User> {
  const response = await apiClient.get<User>('/api/users/me');
  return response.data;
}

export async function verifyEmail(token: string): Promise<{ emailVerified: boolean; emailVerifiedAt: string | null }> {
  const response = await apiClient.post<{ emailVerified: boolean; emailVerifiedAt: string | null }>(
    '/api/auth/verify-email',
    { token },
  );
  return response.data;
}

export async function resendVerification(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/api/auth/resend-verification', { email });
  return response.data;
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/api/auth/forgot-password', { email });
  return response.data;
}

export async function resetPassword(payload: { token: string; newPassword: string }): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/api/auth/reset-password', {
    token: payload.token,
    newPassword: payload.newPassword,
  });
  return response.data;
}

export async function changePassword(payload: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ message: string }> {
  const response = await apiClient.post<{ message: string }>('/api/auth/change-password', {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
  });
  return response.data;
}
