import apiClient from "./apiClient";
import type { Employee } from "../types";

export interface AttendanceEmployeeDTO {
    id: string;
    employeeId: string;
    employeeCode: string;
    fullName: string;
    positionTitle: string;
    position: string;
    deptName: string;
}

export const searchEmployees = async (query: string): Promise<AttendanceEmployeeDTO[]> => {
    const response = await apiClient.get<{ content: AttendanceEmployeeDTO[] }>(
        `/api/employees/search?q=${encodeURIComponent(query)}`
    );
    return response.data?.content || [];
};

export const employeeService = {
    getEmployeeDetail: (id: string) => apiClient.get<Employee>(`/api/employee/${id}/view-detail`),
};
