import apiClient from './client';
import type { Comment, CreateCommentRequest } from './types';

export async function getComments(postId: string): Promise<Comment[]> {
  const response = await apiClient.get<Comment[]>(`/api/posts/${postId}/comments`);
  return response.data;
}

export async function createComment(postId: string, data: CreateCommentRequest): Promise<Comment> {
  const response = await apiClient.post<Comment>(`/api/posts/${postId}/comments`, data);
  return response.data;
}