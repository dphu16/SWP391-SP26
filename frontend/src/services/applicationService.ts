import apiClient from "./apiClient";
import type { Application } from "../types";

export const applicationService = {
    // Tạm giả định backend cung cấp endpoint /api/applications/job/{jobId}
    getByJobId: (jobId: string) => apiClient.get<Application[]>(`/api/applications/job/${jobId}`),

    // Status can be updated via PUT /api/applications/{id}/status 
    updateStatus: (id: string, status: string) => apiClient.put<Application>(`/api/applications/${id}/status`, null, { params: { status } }),
};
