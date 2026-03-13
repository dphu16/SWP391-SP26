import apiClient from "./apiClient";

export interface PersonnelChangeRequestDTO {
  employeeId: string;
  changeType:
    | "DEPARTMENT_TRANSFER"
    | "TITLE_CHANGE"
    | "SALARY_CHANGE"
    | "DISCIPLINE"
    | "REWARD";
  reason: string;
  newDepartmentId?: string;
  newPositionId?: string;
  newTitle?: string;
  newSalary?: number;
  description?: string;
}

export interface PersonnelChangeResponseDTO {
  changeId: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  departmentName: string;
  changeType:
    | "DEPARTMENT_TRANSFER"
    | "TITLE_CHANGE"
    | "SALARY_CHANGE"
    | "DISCIPLINE"
    | "REWARD";
  status: "PENDING" | "MANAGER_APPROVED" | "HR_CONFIRMED" | "REJECTED";
  reason: string;
  oldValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  requestedBy: string;
  requestedByName?: string;
  managerApprovedBy?: string;
  managerApprovedByName?: string;
  managerApprovedDate?: string;
  hrConfirmedBy?: string;
  hrConfirmedByName?: string;
  hrConfirmedDate?: string;
  rejectReason?: string;
  createdAt: string;
}

export interface FieldCooldownDTO {
  fieldName: string;
  changedAt: string | null;
  cooldownUntil: string | null;
  locked: boolean;
}

export interface ContractResponseDTO {
  contractId: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  baseSalary: number;
  status: string;
}

const getEmployeeId = (): string => {
  const token = localStorage.getItem("token");
  if (!token) return "";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.employeeId || "";
  } catch {
    return "";
  }
};

export const personnelChangeService = {
  create: (dto: PersonnelChangeRequestDTO) =>
    apiClient.post<PersonnelChangeResponseDTO>("/api/personnel-changes", dto, {
      headers: { "X-Employee-Id": getEmployeeId() },
    }),

  getPending: () =>
    apiClient.get<PersonnelChangeResponseDTO[]>(
      "/api/personnel-changes/pending",
    ),

  managerApprove: (changeId: string) =>
    apiClient.put<PersonnelChangeResponseDTO>(
      `/api/personnel-changes/${changeId}/manager-approve`,
      {},
      { headers: { "X-Employee-Id": getEmployeeId() } },
    ),

  hrConfirm: (changeId: string) =>
    apiClient.put<PersonnelChangeResponseDTO>(
      `/api/personnel-changes/${changeId}/hr-confirm`,
      {},
      { headers: { "X-Employee-Id": getEmployeeId() } },
    ),

  reject: (changeId: string, reason: string) =>
    apiClient.put<PersonnelChangeResponseDTO>(
      `/api/personnel-changes/${changeId}/reject`,
      null,
      {
        params: { reason },
        headers: { "X-Employee-Id": getEmployeeId() },
      },
    ),

  getEmployeeHistory: (employeeId: string) =>
    apiClient.get<PersonnelChangeResponseDTO[]>(
      `/api/personnel-changes/employee/${employeeId}`,
    ),
};

export const employeeSelfUpdateService = {
  selfUpdate: (dto: { phone?: string; email?: string; address?: string }) =>
    apiClient.put("/api/employees/self-update", dto, {
      headers: { "X-Employee-Id": getEmployeeId() },
    }),

  getCooldowns: (employeeId: string) =>
    apiClient.get<FieldCooldownDTO[]>(`/api/employees/${employeeId}/cooldowns`),
};

export const contractService = {
  getByEmployee: (employeeId: string) =>
    apiClient.get<ContractResponseDTO[]>(
      `/api/employees/${employeeId}/contracts`,
    ),

  getExpiring: () =>
    apiClient.get<ContractResponseDTO[]>("/api/contracts/expiring"),
};
