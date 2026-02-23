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

export const getMySchedules = async (employeeId: string): Promise<WorkScheduleResponse[]> => {
    try {
        const response = await apiClient.get(`/api/v1/attendance/work-schedules/my-schedule`, {
            params: { employeeId },
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
