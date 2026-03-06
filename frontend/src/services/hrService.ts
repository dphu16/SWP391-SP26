import apiClient from "./apiClient";

export interface EmployeeNameDto {
    id: string;
    fullName?: string;
}

export const hrService = {
    getEmployeeNames: () => apiClient.get<EmployeeNameDto[]>("/api/hr/name"),
};
