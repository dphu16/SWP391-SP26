import apiClient from "./apiClient";

export interface Department {
    deptId: string;
    deptName: string;
    description: string;
}

export interface Position {
    posId: string;
    posName: string;
}

export const departmentService = {
    getAll: () => apiClient.get<Department[]>("/api/departments"),
    getManagerDepartment: (managerId: string) => apiClient.get<Department>(`/api/departments/${managerId}/manager`),
    getPositionsByDept: async (deptId: string) => {
        const res = await apiClient.get<any[]>(`/api/lookup/pos/${deptId}`);
        return {
            ...res,
            data: res.data.map((p: any) => ({
                posId: p.id,
                posName: p.title
            }))
        };
    },
};
