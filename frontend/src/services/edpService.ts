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

export interface HrEmployee {
    empId: string;
    empName: string;
}

export const edpService = {
    getHr: () => apiClient.get<HrEmployee[]>("/api/edp/hr"),
    getDepartments: () => apiClient.get<Department[]>("/api/edp/dept"),
    getManagerDepartment: (managerId: string) => apiClient.get<Department>(`/api/edp/dept/manager/${managerId}`),
    getPositionsByDept: (deptId: string) => apiClient.get<Position[]>(`/api/edp/pos/${deptId}`),
};
