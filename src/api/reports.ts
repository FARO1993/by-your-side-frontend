import apiClient from './client';
import type { CreateReportRequest } from './types';

export async function createReport(request: CreateReportRequest): Promise<void> {
  const description = request.description?.trim();
  await apiClient.post('/api/reports', { ...request, description: description ? description : undefined });
}
