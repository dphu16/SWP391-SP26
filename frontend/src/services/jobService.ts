import apiClient from "./apiClient";
import type { Job, JobInput } from "../components/ui/types";

export const jobService = {
    getAll: () => apiClient.get<Job[]>("/api/jobs"),
    getById: (id: string) => apiClient.get<Job>(`/api/jobs/${id}`),
    create: (data: JobInput) => apiClient.post<Job>("/api/jobs", data),
    update: (id: string, data: Partial<JobInput>) => apiClient.put<Job>(`/api/jobs/${id}`, data),
    updateStatus: (id: string, status: string) => apiClient.patch<Job>(`/api/jobs/${id}/status`, null, { params: { status } }),
    delete: (id: string) => apiClient.delete(`/api/jobs/${id}`),
};
