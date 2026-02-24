import apiClient from "./apiClient";

export interface ShiftResponse {
    id: string;
    name: string;
    startTime: string; // "HH:mm:ss"
    endTime: string;   // "HH:mm:ss"
}

export interface WorkScheduleResponse {
    id: string;
    date: string; // "YYYY-MM-DD"
    shift: ShiftResponse;
}

export const getMySchedules = async (
    employeeId: string,
    month?: number,
    year?: number
): Promise<WorkScheduleResponse[]> => {
    try {
        const response = await apiClient.get(`/api/v1/attendance/work-schedules/my-schedule`, {
            params: { employeeId, month, year },
        });
        return response.data;
    } catch (error) {
        console.error("Error fetching my schedules:", error);
        throw error;
    }
};

export const getAllSchedules = async (): Promise<WorkScheduleResponse[]> => {
    try {
        const response = await apiClient.get(`/api/v1/attendance/work-schedules`);
        return response.data;
    } catch (error) {
        console.error("Error fetching all schedules:", error);
        throw error;
    }
};

export interface WorkScheduleRequest {
    employeeId: string;
    date: string;       // "YYYY-MM-DD"
    shiftId: string;
}

export interface BulkScheduleRequest {
    employeeId: string;
    startDate: string;  // "YYYY-MM-DD"
    endDate: string;    // "YYYY-MM-DD"
    shiftId: string;
}

export const createSchedule = async (req: WorkScheduleRequest): Promise<WorkScheduleResponse> => {
    const response = await apiClient.post(`/api/v1/attendance/work-schedules`, req);
    return response.data;
};

export const createBulkSchedules = async (req: BulkScheduleRequest): Promise<WorkScheduleResponse[]> => {
    const response = await apiClient.post(`/api/v1/attendance/work-schedules/bulk`, req);
    return response.data;
};

export const cloneScheduleFromPreviousMonth = async (
    employeeId: string,
    targetMonth: number,
    targetYear: number
): Promise<WorkScheduleResponse[]> => {
    const response = await apiClient.post(`/api/v1/attendance/work-schedules/clone`, null, {
        params: { employeeId, targetMonth, targetYear },
    });
    return response.data;
};
