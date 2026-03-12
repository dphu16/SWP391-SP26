import apiClient from "./apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApprovalRequestResponse {
  requestId: string;
  employeeId: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  createdAt: string;
}

export interface ApprovalRequestEntry {
  requestId: string;
  employeeName: string;
  deptName: string;
  requestType: "APPROVAL" | "LEAVE" | "OT" | "SHIFT_CHANGE";
  status: "PENDING" | "APPROVED" | "REJECTED";
  reason: string | null;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
}

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Send an approval request for a newly created employee.
 * POST /api/employees/{employeeId}/approval-request
 */
export const sendApprovalRequest = async (
  employeeId: string,
): Promise<ApprovalRequestResponse> => {
  const response = await apiClient.post<ApprovalRequestResponse>(
    `/api/employees/${employeeId}/approval-request`,
  );
  return response.data;
};

/**
 * Fetch all requests (Manager view). Filters APPROVAL type on the frontend.
 * GET /api/v1/requests/all
 */
export const getApprovalRequests = async (): Promise<ApprovalRequestEntry[]> => {
  const response = await apiClient.get<ApprovalRequestEntry[]>(
    `/api/v1/requests/all`,
  );
  // Filter only APPROVAL-type requests
  return response.data.filter((r) => r.requestType === "APPROVAL");
};

/**
 * Process an approval request (approve or reject).
 * PUT /api/employees/approval-requests/{requestId}
 */
export const processApprovalRequest = async (
  requestId: string,
  action: "APPROVED" | "REJECTED",
  reason?: string,
): Promise<ApprovalRequestResponse> => {
  const response = await apiClient.put<ApprovalRequestResponse>(
    `/api/employees/approval-requests/${requestId}`,
    { action, reason },
  );
  return response.data;
};
