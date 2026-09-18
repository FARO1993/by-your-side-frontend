import apiClient from './client';
import type { Page, Post, CreatePostRequest, SupportSummary } from './types';

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

export async function addSupport(postId: string): Promise<SupportSummary> {
  const response = await apiClient.post<SupportSummary>(`/api/posts/${postId}/support`);
  return response.data;
}

export async function removeSupport(postId: string): Promise<SupportSummary> {
  const response = await apiClient.delete<SupportSummary>(`/api/posts/${postId}/support`);
  return response.data;
}

export async function getPost(postId: string): Promise<Post> {
  const response = await apiClient.get<Post>(`/api/posts/${postId}`);
  return response.data;
}