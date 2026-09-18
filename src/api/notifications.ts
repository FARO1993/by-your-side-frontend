import apiClient from './client';
import type { Page, Notification } from './types';

export async function getNotifications(page = 0, size = 20): Promise<Page<Notification>> {
  const response = await apiClient.get<Page<Notification>>('/api/notifications', {
    params: { page, size },
  });
  return response.data;
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiClient.get<{ count: number }>('/api/notifications/unread-count');
  return response.data.count;
}

export async function markAllAsRead(): Promise<void> {
  await apiClient.patch('/api/notifications/read-all');
}