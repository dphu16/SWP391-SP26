import apiClient from "./apiClient";
import type { Employee } from "../types";

export const employeeService = {
    getHrUsers: () => apiClient.get<Employee[]>("/api/employees/user/hr"),
};
