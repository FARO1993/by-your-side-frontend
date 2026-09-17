import apiClient from './client';
import type { PublicUserProfile, Page, Post } from './types';

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