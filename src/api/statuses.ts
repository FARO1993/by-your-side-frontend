import apiClient from './client';
import type { Status, StatusMood, StatusReactionType } from './types';

export async function setStatus(mood: StatusMood): Promise<Status> {
  const response = await apiClient.post<Status>('/api/statuses', { mood });
  return response.data;
}

export async function getStatusFeed(): Promise<Status[]> {
  const response = await apiClient.get<Status[]>('/api/statuses/feed');
  return response.data;
}

export async function reactToStatus(statusId: string, type: StatusReactionType): Promise<Status> {
  const response = await apiClient.post<Status>(`/api/statuses/${statusId}/react`, { type });
  return response.data;
}

export async function removeStatusReaction(statusId: string): Promise<Status> {
  const response = await apiClient.delete<Status>(`/api/statuses/${statusId}/react`);
  return response.data;
}