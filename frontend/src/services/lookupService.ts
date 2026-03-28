import apiClient from "./apiClient";

export interface LookupDepartment {
    id: string;
    name: string;
}

export interface LookupPosition {
    id: string;
    title: string;
    name?: string;        // alias kept for backward compat (some APIs may still use it)
    deptId?: string;
    deptName?: string;
    baseSalaryMin?: number;
    baseSalaryMax?: number;
}

export const getLookupDepartments = async (): Promise<LookupDepartment[]> => {
    const response = await apiClient.get<LookupDepartment[]>("/api/lookup/departments");
    return response.data;
};

export const getLookupPositions = async (): Promise<LookupPosition[]> => {
    const response = await apiClient.get<LookupPosition[]>("/api/lookup/positions");
    return response.data;
};

export const getLookupPositionsByDeptId = async (deptId: string): Promise<LookupPosition[]> => {
    const response = await apiClient.get<LookupPosition[]>(`/api/lookup/pos/${deptId}`);
    return response.data;
};
