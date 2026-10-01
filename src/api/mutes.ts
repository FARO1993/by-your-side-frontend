import apiClient from './client';

export async function muteUser(userId: string): Promise<void> {
  await apiClient.post(`/api/users/${userId}/mute`);
}

export async function unmuteUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/users/${userId}/mute`);
}
