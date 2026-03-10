import apiClient from "./apiClient";
import type { Application } from "../types";

export const applicationService = {
    getByJobId: (jobId: string, status?: string) => apiClient.get<Application[]>(`/api/app/job/${jobId}`, status ? { params: { status } } : undefined),

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

    getById: (id: string) => apiClient.get<Application>(`/api/app/${id}`),

    reviewCV: (data: { applicationId: string; reviewerId: string; result: "PASSED" | "FAILED"; comment: string }) =>
        apiClient.post<{ id: string; appId: string; reviewerId: string; reviewerName: string; comment: string; result: string }>(`/api/cvReview`, { appId: data.applicationId, reviewerId: data.reviewerId, comment: data.comment, result: data.result }),

    getCVReview: (applicationId: string) =>
        apiClient.get<{ id: string; appId: string; reviewerId: string; reviewerName: string; comment: string; result: string }>(`/api/cvReview/${applicationId}`),

    setDateLimit: (data: { applicationId: string; startTime: string; endTime: string }) =>
        apiClient.post(`/api/app/date-limit`, { id: data.applicationId, start: data.startTime, end: data.endTime }),

    scheduleInterview: (data: { appId: string; interviewerId: string; scheduleTime: string }) =>
        apiClient.post<{ id: string; appId: string; interviewerId: string; interviewerName: string; scheduleTime: string; status: string; feedback: string | null; score: number | null; }>(`/api/interview`, {
            appId: data.appId,
            interviewerId: data.interviewerId,
            scheduleTime: data.scheduleTime,
            status: "SCHEDULED"
        }),

    getInterview: (appId: string) =>
        apiClient.get<{ id: string; appId: string; interviewerId: string; interviewerName: string; scheduleTime: string; status: string; feedback: string | null; score: number | null; }>(`/api/interview/${appId}`),

    getInterviewByHr: (hrId: string) =>
        apiClient.get<{ id: string; appId: string; interviewerId: string; interviewerName: string; scheduleTime: string; status: string; feedback: string | null; score: number | null; }[]>(`/api/interview/list/${hrId}`),

    updateInterviewResult: (id: string, data: { appId: string; interviewerId: string; scheduleTime: string; feedback: string; score: number; status: string }) =>
        apiClient.patch<{ id: string; appId: string; interviewerId: string; interviewerName: string; scheduleTime: string; status: string; feedback: string | null; score: number | null; }>(`/api/interview/${id}/result`, data),

    nextStage: (ids: string[]) =>
        apiClient.post(`/api/app/list/next-stage`, ids),

    lastStage: (id: string) =>
        apiClient.put(`/api/app/last-stage/${id}`),
};
