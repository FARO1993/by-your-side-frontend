import axios from 'axios';

export const FOLLOW_REQUEST_STALE = 'Esa solicitud ya no está pendiente.';

export function isStaleFollowRequest(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 409;
}
