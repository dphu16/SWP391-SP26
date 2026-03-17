import apiClient from "./apiClient";

export type MeasurementType = 'NUMERIC' | 'PERCENTAGE' | 'BOOLEAN' | 'RATING';

export interface KpiLibrary {
    libId: string;
    name: string;
    description: string;
    category: string;
    defaultWeight: number;
    measurementType?: MeasurementType;
    departmentId?: string;
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
    rating?: string;
    status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PENDING';
    createdAt?: string;
    cycle?: { cycleId: string; cycleName: string };
    employee?: { employeeId: string; fullName: string };
}

export interface UpdateReviewScoreRequest {
    kpiScore: number;
    attitudeScore: number;
    rating?: string;
}

export interface TeamStats {
    totalMembers: number;
    submittedMembers: number;
    averageScore: number | null;
}

export interface GlobalStats {
    orgAverageScore: number;
    totalKpiTargetValue: number;
    scoreDistribution?: number[];
}

export interface DepartmentLeaderboardItem {
    departmentName: string;
    averageScore: number;
}

export interface PlanTrainingRequest {
    employeeId: string;
    reviewId: string;
    courseName: string;
    courseUrl: string;
    deadline: string;
    reason: string;
}

export const kpiService = {
    getGlobalStats: async (): Promise<GlobalStats> => {
        try {
            const res = await apiClient.get<GlobalStats>("/api/manager/hr/stats");
            return res.data;
        } catch {
            return { orgAverageScore: 0, totalKpiTargetValue: 0 };
        }
    },

    getTeamStats: async (): Promise<TeamStats> => {
        try {
            const res = await apiClient.get<TeamStats>("/api/manager/team-stats");
            return res.data;
        } catch {
            return { totalMembers: 0, submittedMembers: 0, averageScore: null };
        }
    },
    
    getDepartmentLeaderboard: async (): Promise<DepartmentLeaderboardItem[]> => {
        try {
            const res = await apiClient.get<DepartmentLeaderboardItem[]>("/api/manager/hr/leaderboard");
            return res.data || [];
        } catch {
            return [];
        }
    },

    getAllKpiLibraries: async (departmentId?: string): Promise<KpiLibrary[]> => {
        try {
            const response = await apiClient.get<KpiLibrary[]>("/api/kpi-libraries", {
                params: { departmentId }
            });
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
            const response = await apiClient.get<any[]>("/api/lookup/departments");
            return response.data.map(d => ({
                id: d.id,
                name: d.name
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

    getGoalsByEmployeeAndCycle: async (employeeId: string, cycleId: string): Promise<any[]> => {
        try {
            const response = await apiClient.get<any[]>(`/api/employees/${employeeId}/cycles/${cycleId}/goals`);
            return response.data;
        } catch (error) {
            console.error("Error fetching goals for employee in cycle", error);
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

    getReviewsByCycle: async (cycleId: string): Promise<PerformanceReview[]> => {
        try {
            const response = await apiClient.get<PerformanceReview[]>(`/api/performance-cycles/${cycleId}/reviews`);
            return response.data;
        } catch (error) {
            console.error('Error fetching reviews by cycle', error);
            return [];
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
        try {
            const review = await kpiService.getActiveReview(employeeId);
            if (review) {
                const res = await apiClient.get(`/api/mentor/review/${review.reviewId}/assessment`);
                return res.data?.averageScore || 0;
            }
            return 0;
        } catch {
            return 0;
        }
    },

    getMentorAssessment: async (reviewId: string): Promise<any> => {
        try {
            const res = await apiClient.get(`/api/mentor/review/${reviewId}/assessment`);
            return res.data;
        } catch {
            return null;
        }
    },

    // Mentor specific actions
    getMentees: async (mentorId: string): Promise<any[]> => {
        const response = await apiClient.get(`/api/mentor/mentees/${mentorId}`);
        return response.data;
    },

    getGoalEvidences: async (goalId: string): Promise<any[]> => {
        const response = await apiClient.get(`/api/mentor/goal/${goalId}/evidences`);
        return response.data;
    },

    updateEvidenceStatus: async (evidenceId: string, status: 'APPROVED' | 'REJECTED', comment?: string): Promise<any> => {
        const response = await apiClient.patch(`/api/mentor/evidence/${evidenceId}/status`, { status, comment });
        return response.data;
    },

    submitMentorAssessment: async (mentorId: string, data: { employeeId: string, cycleId: string, teamworkScore: number, communicationScore: number, technicalScore: number, adaptabilityScore: number }): Promise<any> => {
        const response = await apiClient.post(`/api/mentor/assess/${mentorId}`, data);
        return response.data;
    },


    // Employee actions
    acknowledgeGoal: async (goalId: string): Promise<any> => {
        const response = await apiClient.patch(`/api/employee-goals/${goalId}`, { status: 'ACTIVE' });
        return response.data;
    },

    updateGoalProgress: async (goalId: string, data: { actualValue: number, comment?: string, imageUrl?: string }): Promise<any> => {
        const response = await apiClient.patch(`/api/employee-goals/${goalId}/progress`, data);
        return response.data;
    },

    updateEmployeeGoalStatus: async (goalId: string, status: string, comment?: string): Promise<any> => {
        const response = await apiClient.patch(`/api/employee-goals/${goalId}`, { status, comment });
        return response.data;
    },

    uploadFile: async (file: File): Promise<string> => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await apiClient.post("/api/files/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return response.data; // This is the public URL string
    },

    planTraining: async (data: PlanTrainingRequest): Promise<any> => {
        const response = await apiClient.post('/api/training-participants/plan', data);
        return response.data;
    },

    getTrainingForEmployee: async (employeeId: string): Promise<any[]> => {
        try {
            const response = await apiClient.get(`/api/training-participants/employee/${employeeId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching training for employee", error);
            return [];
        }
    },

    submitTrainingCertificate: async (participantId: string, certificateUrl: string): Promise<any> => {
        const response = await apiClient.put(`/api/training-participants/${participantId}/submit-certificate`, { certificateUrl });
        return response.data;
    },

    getAllTrainings: async (): Promise<any[]> => {
        const response = await apiClient.get('/api/training-participants');
        return response.data;
    },

    confirmTrainingCertificate: async (participantId: string): Promise<any> => {
        const response = await apiClient.put(`/api/training-participants/${participantId}/confirm-certificate`);
        return response.data;
    },
    rejectTrainingCertificate: async (participantId: string): Promise<any> => {
        const response = await apiClient.put(`/api/training-participants/${participantId}/reject-certificate`);
        return response.data;
    },

    downloadFile: async (fileUrl: string, fileName: string) => {
        const response = await apiClient.get(fileUrl, {
            responseType: 'blob',
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};
