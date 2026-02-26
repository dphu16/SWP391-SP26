import apiClient from "../../../shared/api/apiClient";
import type { JobRequest, JobRequestInput } from "../types";

export const jobRequestService = {
    getAll: () => apiClient.get<JobRequest[]>("/api/job-requests"),

    getById: (id: string) => apiClient.get<JobRequest>(`/api/job-requests/${id}`),

    create: (data: JobRequestInput) => apiClient.post<JobRequest>("/api/job-requests", data),

    update: (id: string, data: JobRequestInput) => apiClient.put<JobRequest>(`/api/job-requests/${id}`, data),

    delete: (id: string) => apiClient.delete(`/api/job-requests/${id}`),
};
