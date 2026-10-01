import apiClient from './client';

export async function blockUser(userId: string): Promise<void> {
  await apiClient.post(`/api/users/${userId}/block`);
}

export async function unblockUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/users/${userId}/block`);
}
