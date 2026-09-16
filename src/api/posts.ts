import apiClient from './client';
import type { Page, Post, CreatePostRequest } from './types';

export async function getFeed(page = 0, size = 20): Promise<Page<Post>> {
  const response = await apiClient.get<Page<Post>>('/api/posts/feed', {
    params: { page, size },
  });
  return response.data;
}

export async function createPost(data: CreatePostRequest): Promise<Post> {
  const response = await apiClient.post<Post>('/api/posts', data);
  return response.data;
}