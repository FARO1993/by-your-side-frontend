import apiClient from './client';
import type { CompanionCandidate, CompanionNeed, CompanionOffering, NeedType, OfferingType } from './types';

function absent<T>(data: T | null | ''): data is null | '' {
  return data == null || data === '';
}

export async function getMyNeed(): Promise<CompanionNeed | null> {
  const response = await apiClient.get<CompanionNeed | null>('/api/companion/need/mine');
  return absent(response.data) ? null : response.data;
}

export async function setNeed(type: NeedType): Promise<CompanionNeed> {
  const response = await apiClient.put<CompanionNeed>('/api/companion/need', { type });
  return response.data;
}

export async function cancelNeed(): Promise<void> {
  await apiClient.delete('/api/companion/need');
}

export async function getMyOffering(): Promise<CompanionOffering | null> {
  const response = await apiClient.get<CompanionOffering | null>('/api/companion/offering/mine');
  return absent(response.data) ? null : response.data;
}

export async function setOffering(type: OfferingType): Promise<CompanionOffering> {
  const response = await apiClient.put<CompanionOffering>('/api/companion/offering', { type });
  return response.data;
}

export async function cancelOffering(): Promise<void> {
  await apiClient.delete('/api/companion/offering');
}

export async function listOfferingsByType(type: OfferingType): Promise<CompanionCandidate[]> {
  const response = await apiClient.get<CompanionCandidate[]>('/api/companion/offering', {
    params: { type },
  });
  return response.data ?? [];
}

export async function listCompatibleOfferings(): Promise<CompanionCandidate[]> {
  const response = await apiClient.get<CompanionCandidate[]>('/api/companion/offering/compatible');
  return response.data ?? [];
}
