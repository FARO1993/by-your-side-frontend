import apiClient from './client';
import type { Availability, CompanionIntent } from './types';

export async function setAvailability(intent: CompanionIntent): Promise<Availability> {
  const response = await apiClient.post<Availability>('/api/availability', { intent });
  return response.data;
}

export async function cancelAvailability(): Promise<void> {
  await apiClient.delete('/api/availability');
}

export async function getMyAvailability(): Promise<Availability | null> {
  const response = await apiClient.get<Availability | null>('/api/availability/mine');
  return response.data;
}

export async function listAvailable(intent: CompanionIntent): Promise<Availability[]> {
  const response = await apiClient.get<Availability[]>('/api/availability', {
    params: { intent },
  });
  return response.data;
}