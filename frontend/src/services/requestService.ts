import apiClient from "./apiClient";

export interface RequestRecord {
    requestId: string;
    employeeId: string;
    requestType: "LEAVE" | "OT" | "SHIFT_CHANGE";
    reason: string;
    startDate: string;
    endDate: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    managerComment: string | null;
    createdAt: string;
}

export const getMyRequests = async (employeeId: string): Promise<RequestRecord[]> => {
    const response = await apiClient.get(`/api/v1/requests/my-requests`, {
        params: { employeeId },
    });
    return response.data;
};

export interface RequestResponseDTO {
    requestId: string;
    employeeName: string;
    deptName: string;
    requestType: "LEAVE" | "OT" | "SHIFT_CHANGE";
    status: "PENDING" | "APPROVED" | "REJECTED";
    reason: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

export const getAllRequestsForReview = async (): Promise<RequestResponseDTO[]> => {
    const response = await apiClient.get(`/api/v1/requests/all`);
    return response.data;
};

export const approveRequest = async (id: string, managerComment?: string): Promise<RequestRecord> => {
    const response = await apiClient.put(`/api/v1/requests/${id}/approve`, { managerComment });
    return response.data;
};

export const rejectRequest = async (id: string, managerComment?: string): Promise<RequestRecord> => {
    const response = await apiClient.put(`/api/v1/requests/${id}/reject`, { managerComment });
    return response.data;
};

export interface CreateRequestDTO {
    employeeId: string;
    requestType: "LEAVE" | "OT" | "SHIFT_CHANGE";
    reason: string;
    startDate: string;
    endDate?: string;
}

export const createRequest = async (dto: CreateRequestDTO): Promise<RequestRecord> => {
    const response = await apiClient.post(`/api/v1/requests`, dto);
    return response.data;
};

export const updateRequest = async (id: string, dto: CreateRequestDTO): Promise<RequestRecord> => {
    const response = await apiClient.put(`/api/v1/requests/${id}`, dto);
    return response.data;
};

export const deleteRequest = async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/requests/${id}`);
};
