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
