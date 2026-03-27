import apiClient from "./apiClient";

export interface LookupDepartment {
    id: string;
    name: string;
}

export interface LookupPosition {
    id: string;
    name: string;
    title?: string;
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
