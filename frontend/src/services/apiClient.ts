import axios from "axios";

const apiClient = axios.create({
  baseURL: "/",
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use(
  (config) => config,
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
