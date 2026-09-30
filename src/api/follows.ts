import apiClient from './client';
import type { FollowResponse, UserSummary } from './types';

export async function followUser(userId: string): Promise<FollowResponse> {
  const response = await apiClient.post<FollowResponse>(`/api/follows/${userId}`);
  return response.data;
}

export async function unfollowUser(userId: string): Promise<void> {
  await apiClient.delete(`/api/follows/${userId}`);
}

export async function getFollowing(userId: string): Promise<UserSummary[]> {
  const response = await apiClient.get<UserSummary[]>(`/api/follows/${userId}/following`);
  return response.data;
}

export async function getFollowers(userId: string): Promise<UserSummary[]> {
  const response = await apiClient.get<UserSummary[]>(`/api/follows/${userId}/followers`);
  return response.data;
}

export async function removeFollower(userId: string): Promise<void> {
  await apiClient.delete(`/api/follows/followers/${userId}`);
}