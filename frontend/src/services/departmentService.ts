import apiClient from "./apiClient";

export interface Department {
    deptId: string;
    deptName: string;
}

export interface Position {
    posId: string;
    posName: string;
}

export const departmentService = {
    getAll: async () => {
        const res = await apiClient.get<any[]>("/api/lookup/departments");
        return {
            ...res,
            data: res.data.map((d: any) => ({
                deptId: d.id,
                deptName: d.name
            }))
        };
    },
    getManagerDepartment: async (managerId: string) => {
        const res = await apiClient.get<any>(`/api/lookup/departments/${managerId}`);
        return {
            ...res,
            data: {
                deptId: res.data.id,
                deptName: res.data.name
            }
        };
    },
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