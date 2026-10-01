import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { authStorage } from '../auth/authStorage';
import { isPublicAuthRequest } from '../auth/publicAuth';
import { invalidateSession, isRefreshSuspended, refreshSession } from '../auth/session';

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (isPublicAuthRequest(config.url)) {
    return config;
  }

  const token = authStorage.getAccessToken();
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig | undefined;
    const status = error.response?.status;

    if (!config || status !== 401 || isPublicAuthRequest(config.url) || isRefreshSuspended()) {
      return Promise.reject(error);
    }

    if (config._retry) {
      invalidateSession();
      return Promise.reject(error);
    }

    if (!authStorage.getRefreshToken()) {
      invalidateSession();
      return Promise.reject(error);
    }

    config._retry = true;
    const nextToken = await refreshSession();
    if (!nextToken) {
      return Promise.reject(error);
    }

    config.headers.set('Authorization', `Bearer ${nextToken}`);
    return apiClient(config);
  },
);

export default apiClient;
