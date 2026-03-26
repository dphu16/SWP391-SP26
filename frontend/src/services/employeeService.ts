import apiClient from "./apiClient";
import type { Employee } from "../types";

export interface AttendanceEmployeeDTO {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    position: string;
    deptName: string;
}

export const searchEmployees = async (query: string): Promise<AttendanceEmployeeDTO[]> => {
    const response = await apiClient.get<AttendanceEmployeeDTO[]>(
        `/api/employees/search?q=${encodeURIComponent(query)}`
    );
    return response.data || [];
};

export const employeeService = {
    getEmployeeDetail: (id: string) => apiClient.get<Employee>(`/api/employee/${id}/view-detail`),
};
