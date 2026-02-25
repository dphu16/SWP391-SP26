import axios from "axios";
import { getToken } from "./authService";

const apiClient = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Basic error handling
    return Promise.reject(error);
  }
);

export default apiClient;
