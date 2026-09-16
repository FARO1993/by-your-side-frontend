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