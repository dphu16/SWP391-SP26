import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import {
  getToken,
  getRefreshToken,
  saveToken,
  saveRefreshToken,
  removeToken,
  refreshAccessToken,
} from "./authService";

const apiClient = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

// ── Refresh-lock: prevent multiple concurrent refresh calls ──
let isRefreshing = false;
let failedQueue: {
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}[] = [];

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

// ── Request interceptor: attach access token ──
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: auto-refresh on 401 ──
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 and only retry once
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh on auth endpoints themselves (prevents infinite loops)
    const url = originalRequest.url || "";
    if (url.includes("/api/auth/")) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      // No refresh token available → force logout
      removeToken();
      window.location.href = "/login";
      return Promise.reject(error);
    }

    // If already refreshing, queue this request until the refresh completes
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const data = await refreshAccessToken(refreshToken);

      // Save the new access token
      saveToken(data.accessToken);

      // If the server returned a new refresh token, persist it with
      // the same strategy (localStorage vs sessionStorage).
      if (data.refreshToken) {
        const isPersistent =
          localStorage.getItem("remember_me") === "true";
        saveRefreshToken(data.refreshToken, isPersistent);
      }

      const newAccessToken = data.accessToken;

      // Resolve all queued requests with the new token
      processQueue(null, newAccessToken);

      // Retry the original request with the new token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return apiClient(originalRequest);
    } catch (refreshError) {
      // Refresh failed → clear everything and redirect to login
      processQueue(refreshError, null);
      removeToken();
      window.location.href = "/login";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default apiClient;
