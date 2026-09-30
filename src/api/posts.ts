import apiClient from './client';
import type { Page, Post, CreatePostRequest, PostResponseSummary, PostResponseType } from './types';

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

export async function setPostResponse(postId: string, type: PostResponseType): Promise<PostResponseSummary> {
  const response = await apiClient.put<PostResponseSummary>(`/api/posts/${postId}/response`, { type });
  return response.data;
}

export async function deletePostResponse(postId: string): Promise<PostResponseSummary> {
  const response = await apiClient.delete<PostResponseSummary>(`/api/posts/${postId}/response`);
  return response.data;
}

export async function getPost(postId: string): Promise<Post> {
  const response = await apiClient.get<Post>(`/api/posts/${postId}`);
  return response.data;
}