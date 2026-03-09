import apiClient from "./apiClient";

export interface OffboardingRequestPayload {
  type: string;
  reason: string;
  expectedLastDay?: string;
}

export interface HRConfirmPayload {
  officialLastDay: string;
}

export interface CancelOffboardingPayload {
  cancelReason: string;
}

export interface OffboardingResponse {
  offboardingId: string;
  employeeId: string;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  positionTitle: string;
  avatarUrl?: string;
  type: "RESIGNATION" | "TERMINATED" | "CONTRACT_EXPIRED";
  status:
    | "PENDING"
    | "MANAGER_APPROVED"
    | "HR_CONFIRMED"
    | "CANCELLED"
    | "COMPLETED";
  reason: string;
  requestDate: string;
  expectedLastDay?: string;
  officialLastDay?: string;
  requestedBy?: string;
  requestedByName?: string;
  approvedByManager?: string;
  approvedByManagerName?: string;
  managerApprovedDate?: string;
  confirmedByHr?: string;
  confirmedByHrName?: string;
  hrConfirmedDate?: string;
  cancelReason?: string;
  cancelledBy?: string;
  cancelledByName?: string;
  cancelledDate?: string;
}

export const offboardingService = {
  // BRD 3.1: Nhân viên tự tạo yêu cầu nghỉ việc
  createResignation: (employeeId: string, data: OffboardingRequestPayload) =>
    apiClient.post<OffboardingResponse>(
      `/api/offboarding/resign/${employeeId}`,
      data
    ),

  // BRD 3.1: Quản lý đề xuất sa thải / hết HĐ
  createManagerProposal: (
    employeeId: string,
    data: OffboardingRequestPayload
  ) =>
    apiClient.post<OffboardingResponse>(
      `/api/offboarding/propose/${employeeId}`,
      data
    ),

  // BRD 3.1: Quản lý duyệt
  managerApprove: (offboardingId: string) =>
    apiClient.put<OffboardingResponse>(
      `/api/offboarding/${offboardingId}/manager-approve`
    ),

  // BRD 3.1 + 3.4: HR xác nhận
  hrConfirm: (offboardingId: string, data: HRConfirmPayload) =>
    apiClient.put<OffboardingResponse>(
      `/api/offboarding/${offboardingId}/hr-confirm`,
      data
    ),

  // BRD 3.2: Hủy yêu cầu
  cancel: (offboardingId: string, data: CancelOffboardingPayload) =>
    apiClient.put<OffboardingResponse>(
      `/api/offboarding/${offboardingId}/cancel`,
      data
    ),

  // Query
  getActiveRequests: () =>
    apiClient.get<OffboardingResponse[]>("/api/offboarding/active"),

  getPendingRequests: () =>
    apiClient.get<OffboardingResponse[]>("/api/offboarding/pending"),

  getById: (offboardingId: string) =>
    apiClient.get<OffboardingResponse>(`/api/offboarding/${offboardingId}`),

  // Legacy
  getInactiveEmployees: () =>
    apiClient.get("/api/employees/inactive"),

  terminateEmployee: (id: string) =>
    apiClient.put(`/api/employees/${id}/terminate`),

  activateEmployee: (id: string) =>
    apiClient.put(`/api/employees/${id}/activate`),
};
