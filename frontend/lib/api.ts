import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { config } from '@/lib/config';
import { ACCESS_TOKEN_KEY, clearAuthSession, getAccessToken } from '@/lib/auth-session';
import { disconnectWebSocket } from '@/lib/ws-client';

export const api = axios.create({
  baseURL: config.apiBaseUrl,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((requestConfig) => {
  const token = getAccessToken();
  if (token) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

type RetryConfig = InternalAxiosRequestConfig & { _retry?: boolean };

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryConfig | undefined;
    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      const res = await axios.post(
        `${config.apiBaseUrl}/api/auth/refresh`,
        {},
        { withCredentials: true },
      );
      const accessToken = res.data.data.accessToken as string;
      window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      original.headers.Authorization = `Bearer ${accessToken}`;
      return api(original);
    } catch {
      disconnectWebSocket();
      clearAuthSession();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  },
);
