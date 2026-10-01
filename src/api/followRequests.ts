import apiClient from './client';
import type { UserSummary } from './types';

export interface FollowRequest {
  requestId: string;
  otherUser: UserSummary;
  createdAt: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
}

export async function acceptFollowRequest(requestId: string): Promise<FollowRequest> {
  const response = await apiClient.post<FollowRequest>(`/api/follow-requests/${requestId}/accept`);
  return response.data;
}

export async function rejectFollowRequest(requestId: string): Promise<FollowRequest> {
  const response = await apiClient.post<FollowRequest>(`/api/follow-requests/${requestId}/reject`);
  return response.data;
}

export async function cancelFollowRequest(requestId: string): Promise<void> {
  await apiClient.delete(`/api/follow-requests/${requestId}`);
}

export async function listIncomingFollowRequests(): Promise<FollowRequest[]> {
  const response = await apiClient.get<FollowRequest[]>('/api/follow-requests/incoming');
  return response.data;
}

export async function listOutgoingFollowRequests(): Promise<FollowRequest[]> {
  const response = await apiClient.get<FollowRequest[]>('/api/follow-requests/outgoing');
  return response.data;
}
