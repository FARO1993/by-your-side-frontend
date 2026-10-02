import axios from 'axios';
import apiClient from './client';
import type { MoodHistoryEntry, Status, StatusMood, StatusReactionType } from './types';

export type UserStatusView = { kind: 'active'; status: Status } | { kind: 'none' } | { kind: 'hidden' };

function absent(data: unknown): data is null | '' {
  return data == null || data === '';
}

export async function getUserStatus(userId: string): Promise<UserStatusView> {
  try {
    const response = await apiClient.get<Status | null>(`/api/users/${userId}/status`);
    if (absent(response.data)) return { kind: 'none' };
    return { kind: 'active', status: response.data };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return { kind: 'hidden' };
    throw error;
  }
}

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
/**
 * Historial de ánimo propio (privado). null si el backend todavía no tiene el
 * endpoint (404): la vista se oculta sin mostrar error.
 */
export async function getMyMoodHistory(days = 30): Promise<MoodHistoryEntry[] | null> {
  try {
    const response = await apiClient.get<MoodHistoryEntry[]>('/api/statuses/mine/history', { params: { days } });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    throw error;
  }
}
