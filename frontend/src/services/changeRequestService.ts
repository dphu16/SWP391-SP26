import apiClient from "./apiClient";

export interface ChangeRequestCreateDTO {
  citizenId?: string;
  taxCode?: string;
}

export interface ChangeRequestResponseDTO {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
}

export async function createChangeRequest(
  employeeId: string,
  dto: ChangeRequestCreateDTO
): Promise<ChangeRequestResponseDTO> {
  const res = await apiClient.post<ChangeRequestResponseDTO>(
    "/api/employee-change-requests",
    dto,
    { headers: { "X-Employee-Id": employeeId } }
  );
  return res.data;
}
