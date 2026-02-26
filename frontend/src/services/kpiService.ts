import apiClient from "./apiClient";

export interface KpiLibrary {
 libId: string;
 name: string;
 description: string;
 category: string;
 defaultWeight: number;
}

export interface Department {
 deptId: string;
 deptName: string;
 description: string;
}

export interface KpiDetailDto {
 kpiLibraryId: string;
 weight: number;
}

export interface AssignKpiRequest {
 departmentId: string;
 structureName?: string;
 details: KpiDetailDto[];
}

export const kpiService = {
 getAllKpiLibraries: async (): Promise<KpiLibrary[]> => {
 try {
 // Use local default fallback in development if no backend running, or actually call API
 const response = await apiClient.get<KpiLibrary[]>("/api/kpi-libraries");
 return response.data;
 } catch (error) {
 console.error("Error fetching KPI Libraries", error);
 return [];
 }
 },

 createKpiLibrary: async (data: Omit<KpiLibrary, 'libId'>): Promise<KpiLibrary> => {
 const response = await apiClient.post<KpiLibrary>("/api/kpi-libraries", data);
 return response.data;
 },

 getAllDepartments: async (): Promise<Department[]> => {
 try {
 const response = await apiClient.get<Department[]>("/api/departments");
 return response.data;
 } catch (error) {
 console.error("Error fetching Departments", error);
 return [];
 }
 },

 getKpisByDepartment: async (departmentId: string): Promise<KpiDetailDto[]> => {
 try {
 const response = await apiClient.get<KpiDetailDto[]>(`/api/kpi-structures/department/${departmentId}`);
 return response.data;
 } catch (error) {
 console.error("Error fetching KPIs for Department", error);
 return [];
 }
 },

 assignKpisToDepartment: async (data: AssignKpiRequest): Promise<any> => {
 const response = await apiClient.post("/api/kpi-structures/assign", data);
 return response.data;
 },

 getAllEmployees: async (): Promise<any[]> => {
 try {
 const response = await apiClient.get<any[]>("/api/employees");
 return response.data;
 } catch (error) {
 console.error("Error fetching Employees", error);
 return [];
 }
 },

 getGoalsByEmployee: async (employeeId: string): Promise<any[]> => {
 try {
 const response = await apiClient.get<any[]>(`/api/employees/${employeeId}/goals`);
 return response.data;
 } catch (error) {
 console.error("Error fetching goals for employee", error);
 return [];
 }
 },

 assignEmployeeGoal: async (data: { employeeId: string, cycleId: string, kpiLibraryId: string, targetValue: number, title: string, weight: number }): Promise<any> => {
 const response = await apiClient.post("/api/employee-goals", data);
 return response.data;
 }
};
