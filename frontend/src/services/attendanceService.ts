import apiClient from "./apiClient";

// ── Attendance Log (Check-in / Check-out) ──

export interface AttendanceLogShift {
    shiftId: string;
    name: string;
    startTime: string; // "HH:mm:ss"
    endTime: string;
    breakStart?: string;
    breakEnd?: string;
}

export interface AttendanceLogSchedule {
    scheduleId: string;
    shift: AttendanceLogShift;
}

export interface AttendanceLogResponse {
    logId: string;
    employeeId: string;
    date: string;          // "YYYY-MM-DD"
    checkIn: string | null;  // "HH:mm:ss"
    checkOut: string | null;
    status: string;        // VALID | LATE | EARLY_LEAVE | MISSING_PUNCH
    workingHours: number;
    otHours: number;
    workSchedule: AttendanceLogSchedule | null;
}

export interface AttendanceRequest {
    employeeId: string;
    type: "IN" | "OUT";
}

export const checkIn = async (employeeId: string): Promise<AttendanceLogResponse> => {
    const response = await apiClient.post(`/api/v1/attendance/check-in`, {
        employeeId,
        type: "IN",
    } as AttendanceRequest);
    return response.data;
};

export const checkOut = async (employeeId: string): Promise<AttendanceLogResponse> => {
    const response = await apiClient.post(`/api/v1/attendance/check-in`, {
        employeeId,
        type: "OUT",
    } as AttendanceRequest);
    return response.data;
};

export const getMyHistory = async (employeeId: string): Promise<AttendanceLogResponse[]> => {
    const response = await apiClient.get(`/api/v1/attendance/logs/my-history`, {
        params: { employeeId },
    });
    return response.data;
};

export const getTodayLog = async (employeeId: string): Promise<AttendanceLogResponse | null> => {
    const logs = await getMyHistory(employeeId);
    const now = new Date();
    // Use local timezone to extract the correct today string ('YYYY-MM-DD') instead of UTC
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return logs.find((log) => log.date === localToday) ?? null;
};

export interface ShiftResponse {
    id: string;
    name: string;
    startTime: string; // "HH:mm:ss"
    endTime: string; // "HH:mm:ss"
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

export const getAllShifts = async (): Promise<ShiftResponse[]> => {
    try {
        const response = await apiClient.get('/api/v1/attendance/work-schedules/shifts');
        return response.data;
    } catch (error) {
        console.error("Error fetching shifts:", error);
        throw error;
    }
};

export interface WorkScheduleRequest {
    employeeId: string;
    date: string; // "YYYY-MM-DD"
    shiftId: string;
}

export interface BulkScheduleRequest {
    employeeId: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
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

// ── Attendance Summary (BE endpoint: GET /api/v1/attendance/summary) ──

export interface AttendanceSummaryDTO {
    employeeId: string;
    employeeCode: string;
    fullName: string;
    departmentName: string;
    month: number;
    year: number;
    totalWorkingHours: number; // BigDecimal → number via JSON
    totalLateDays: number;
    totalEarlyLeaveDays: number;
    totalMissingPunchDays: number;
}

export interface AttendanceSummaryParams {
    month?: number;
    year?: number;
    departmentId?: string;
    employeeId?: string;
}

export const getAttendanceSummary = async (
    params: AttendanceSummaryParams
): Promise<AttendanceSummaryDTO[]> => {
    const response = await apiClient.get(`/api/v1/attendance/summary`, { params });
    return response.data;
};

// ── Department list (from AttendanceLogController: GET /api/v1/attendance) ──

export interface DepartmentOption {
    deptId: string;
    deptName: string;
}

export const getDepartments = async (): Promise<DepartmentOption[]> => {
    try {
        const response = await apiClient.get<DepartmentOption[]>(`/api/v1/attendance`);
        return response.data;
    } catch (error) {
        console.error("Error fetching departments:", error);
        return [];
    }
};

