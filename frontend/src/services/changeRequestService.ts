import apiClient from "./apiClient";
import type { RequestType } from "../types";

export interface ChangeRequestCreateDTO {
  type: RequestType;
  reason?: string;
  citizenId?: string;
  taxCode?: string;
  newPositionId?: string;
  newDepartmentId?: string;
}

export interface ChangeRequestResponseDTO {
  id: string;
  type: RequestType;
  reason?: string;
  requestData?: Record<string, unknown>;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

/** Mock employee ID (Auth removed) */
export function getCurrentEmployeeId(): string | null {
  return "admin-001";
}


/** POST /api/employee-requests — tạo request mới */
export async function createChangeRequest(
  dto: ChangeRequestCreateDTO
): Promise<ChangeRequestResponseDTO> {
  const res = await apiClient.post<ChangeRequestResponseDTO>(
    "/api/employee-requests",
    dto
  );
  return res.data;
}

/** GET /api/employee-requests — danh sách request của mình */
export async function getMyRequests(): Promise<ChangeRequestResponseDTO[]> {
  const res = await apiClient.get<ChangeRequestResponseDTO[]>(
    "/api/employee-requests"
  );
  return res.data;
}

/** GET /api/employee-requests/:id */
export async function getRequestDetail(id: string): Promise<ChangeRequestResponseDTO> {
  const res = await apiClient.get<ChangeRequestResponseDTO>(
    `/api/employee-requests/${id}`
  );
  return res.data;
}

/** PATCH /api/employee-requests/:id/approve — HR only */
export async function approveRequest(id: string): Promise<ChangeRequestResponseDTO> {
  const res = await apiClient.patch<ChangeRequestResponseDTO>(
    `/api/employee-requests/${id}/approve`
  );
  return res.data;
}

/** PATCH /api/employee-requests/:id/reject — HR only */
export async function rejectRequest(id: string): Promise<ChangeRequestResponseDTO> {
  const res = await apiClient.patch<ChangeRequestResponseDTO>(
    `/api/employee-requests/${id}/reject`
  );
  return res.data;
}
