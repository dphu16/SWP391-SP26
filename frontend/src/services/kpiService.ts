import apiClient from "./apiClient";

export interface KpiLibrary {
    libId: string;
    name: string;
    description: string;
    category: string;
    defaultWeight: number;
}

export interface Department {
    id: string;
    name: string;
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

export interface PerformanceCycle {
    cycleId: string;
    cycleName: string;
    startDate: string;
    endDate: string;
    status: 'ACTIVE' | 'CLOSED';
    createdAt?: string;
}

export interface CreateCycleRequest {
    cycleName: string;
    startDate: string;
    endDate: string;
}

export interface PerformanceReview {
    reviewId: string;
    kpiScore: number | null;
    attitudeScore: number | null;
    overallScore: number | null;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PENDING';
    createdAt?: string;
    cycle?: { cycleId: string; cycleName: string };
    employee?: { employeeId: string; fullName: string };
}

export interface UpdateReviewScoreRequest {
    kpiScore: number;
    attitudeScore: number;
}

export interface TeamStats {
    totalMembers: number;
    submittedMembers: number;
    averageScore: number | null;
}

export const kpiService = {
    getTeamStats: async (): Promise<TeamStats> => {
        try {
            const res = await apiClient.get<TeamStats>("/api/manager/team-stats");
            return res.data;
        } catch {
            return { totalMembers: 0, submittedMembers: 0, averageScore: null };
        }
    },

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
            const response = await apiClient.get<any[]>("/api/departments");
            return response.data.map(d => ({
                id: d.deptId,
                name: d.deptName
            }));
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

    saveDraftKpiStructure: async (data: AssignKpiRequest): Promise<any> => {
        const response = await apiClient.post("/api/kpi-structures/assign/draft", data);
        return response.data;
    },

    getAllEmployees: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get<any>("/api/hr/employees", {
                params: { page: 0, size: 50, sort: 'fullName' }
            });
            return response.data.content || [];
        } catch (error) {
            console.error("Error fetching Employees", error);
            return [];
        }
    },

    getMyTeam: async (): Promise<any[]> => {
        try {
            const response = await apiClient.get<any[]>("/api/manager/my-team");
            return response.data || [];
        } catch (error) {
            console.error("Error fetching My Team", error);
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
    },

    getPerformanceCycles: async (): Promise<PerformanceCycle[]> => {
        try {
            const response = await apiClient.get<PerformanceCycle[]>("/api/performance-cycles");
            return response.data;
        } catch (error) {
            console.error("Error fetching Performance Cycles", error);
            return [];
        }
    },

    createPerformanceCycle: async (data: CreateCycleRequest): Promise<PerformanceCycle> => {
        const response = await apiClient.post<PerformanceCycle>("/api/performance-cycles", data);
        return response.data;
    },

    updatePerformanceCycle: async (cycleId: string, data: CreateCycleRequest): Promise<PerformanceCycle> => {
        const response = await apiClient.put<PerformanceCycle>(`/api/performance-cycles/${cycleId}`, data);
        return response.data;
    },

    updateCycleStatus: async (cycleId: string, status: string): Promise<PerformanceCycle> => {
        const response = await apiClient.patch<PerformanceCycle>(`/api/performance-cycles/${cycleId}`, { status });
        return response.data;
    },

    // Performance Reviews
    getActiveReview: async (employeeId: string): Promise<PerformanceReview | null> => {
        try {
            const response = await apiClient.get<PerformanceReview>(`/api/employees/${employeeId}/review-active`);
            return response.data;
        } catch (error) {
            console.error('Error fetching active review', error);
            return null;
        }
    },

    updateReviewScore: async (reviewId: string, data: UpdateReviewScoreRequest): Promise<PerformanceReview> => {
        const response = await apiClient.put<PerformanceReview>(`/api/performance-reviews/${reviewId}`, data);
        return response.data;
    },

    finalizeReview: async (reviewId: string): Promise<PerformanceReview> => {
        const response = await apiClient.patch<PerformanceReview>(`/api/performance-reviews/${reviewId}/finalize`);
        return response.data;
    },

    getMentorAttitudeScore: async (employeeId: string): Promise<number> => {
        // TODO: Replace with actual backend endpoint for Mentor evaluations when available
        return new Promise(resolve => {
            setTimeout(() => {
                // Return a pseudo-random but consistent mock score between 80-98 based on ID
                const charCodeSum = Array.from(employeeId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const score = 80 + (charCodeSum % 19);
                resolve(score);
            }, 300);
        });
    },
};
