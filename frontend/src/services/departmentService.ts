import apiClient from "./apiClient";

export interface Department {
    deptId: string;
    deptName: string;
    description: string;
}

export const departmentService = {
    getAll: () => apiClient.get<Department[]>("/api/departments"),
};
