import apiClient from './client';
import type { PublicUserProfile, Page, Post, DiscoverUser, User } from './types';

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