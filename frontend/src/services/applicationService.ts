import apiClient from "./apiClient";
import type { Application } from "../types";

export const applicationService = {
    getByJobId: (jobId: string) => apiClient.get<Application[]>(`/api/app/job/${jobId}`),

    // Status can be updated via PUT /api/applications/{id}/status 
    updateStatus: (id: string, status: string) => apiClient.put<Application>(`/api/applications/${id}/status`, null, { params: { status } }),

    // Upload CV
    applyJob: (formData: FormData) => apiClient.post(`/api/app`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    }),

    updateApplication: (id: string, formData: FormData) => apiClient.put(`/api/app/${id}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    }),

    deleteApplication: (id: string) => apiClient.delete(`/api/app/${id}`),
};
