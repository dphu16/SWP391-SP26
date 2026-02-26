import axios from "axios";
import { getToken, removeToken } from "./authService";
import { decodeJwt } from "../utils/jwtDecode";

const apiClient = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach token if valid ──
apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      const payload = decodeJwt(token);
      if (!payload) {
        // Token is expired/corrupt client-side → clean up
        removeToken();
      } else {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: handle 401 carefully ──
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only clear the token when the server explicitly says it's invalid.
      // Check if we still have a token that the server rejected — meaning
      // the token itself is bad (expired server-side, revoked, tampered).
      // Do NOT remove token for 403 (authorized but insufficient role).
      const token = getToken();
      if (token) {
        const payload = decodeJwt(token);
        if (!payload) {
          // Token is already expired/invalid client-side too → remove
          removeToken();
        }
        // If payload is still valid client-side but server says 401,
        // the server may be rejecting for a specific reason (e.g.
        // endpoint auth issue). Don't nuke a valid session.
        // Components should handle the error in their catch blocks.
      }
    }
    return Promise.reject(error);
  },
);

export default apiClient;