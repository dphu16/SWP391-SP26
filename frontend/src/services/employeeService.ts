import apiClient from "./apiClient";
import type { Employee } from "../types";

export const employeeService = {
    getEmployeeDetail: (id: string) => apiClient.get<Employee>(`/api/employee/${id}/view-detail`),
};
