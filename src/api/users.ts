import axios from 'axios';
import apiClient from './client';
import type {
  CompanionPreferenceType,
  CompanionPreferencesResponse,
  DiscoverUser,
  Page,
  Post,
  PublicAvailability,
  PublicUserProfile,
  User,
} from './types';

export type PublicAvailabilityView =
  | { kind: 'available'; value: PublicAvailability }
  | { kind: 'none' }
  | { kind: 'hidden' };

function absent(data: unknown): data is null | '' {
  return data == null || data === '';
}

export async function getPublicAvailability(userId: string): Promise<PublicAvailabilityView> {
  try {
    const response = await apiClient.get<PublicAvailability | null>(`/api/users/${userId}/availability`);
    if (absent(response.data)) return { kind: 'none' };
    return { kind: 'available', value: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return { kind: 'hidden' };
    throw error;
  }
}

export async function getCompanionPreferences(): Promise<CompanionPreferenceType[]> {
  const response = await apiClient.get<CompanionPreferencesResponse>('/api/users/me/companion-preferences');
  return response.data.types;
}

export async function replaceCompanionPreferences(types: CompanionPreferenceType[]): Promise<CompanionPreferenceType[]> {
  const response = await apiClient.patch<CompanionPreferencesResponse>('/api/users/me/companion-preferences', { types });
  return response.data.types;
}

export async function getPublicProfile(userId: string): Promise<PublicUserProfile> {
  const response = await apiClient.get<PublicUserProfile>(`/api/users/${userId}`);
  return response.data;
}

export async function getUserPosts(userId: string, page = 0, size = 20): Promise<Page<Post>> {
  const response = await apiClient.get<Page<Post>>(`/api/users/${userId}/posts`, {
    params: { page, size },
  });
  return response.data;
}

export async function discoverUsers(page = 0, size = 20): Promise<Page<DiscoverUser>> {
  const response = await apiClient.get<Page<DiscoverUser>>('/api/users/discover', {
    params: { page, size },
  });
  return response.data;
}

export async function uploadAvatar(file: File): Promise<User> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<User>('/api/users/me/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}