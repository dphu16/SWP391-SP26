import React, { useState, useEffect, useCallback } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import {
    checkIn as apiCheckIn,
    checkOut as apiCheckOut,
    getTodayLog,
    getMySchedules,
    type AttendanceLogResponse,
    type WorkScheduleResponse,
} from "../../services/attendanceService";

// Backend status values from AttendanceLogService.evaluateAttendance()
type AttendanceStatus = "MISSING_PUNCH" | "LATE" | "EARLY_LEAVE" | "VALID" | null;

// Map backend status → display config
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    VALID: { label: "ON TIME", color: "#15803d", bg: "#dcfce7", icon: "✓" },
    LATE: { label: "LATE", color: "#dc2626", bg: "#fef2f2", icon: "⚠" },
    EARLY_LEAVE: { label: "EARLY LEAVE", color: "#b45309", bg: "#fef3c7", icon: "⚠" },
    MISSING_PUNCH: { label: "AWAITING CHECK-OUT", color: "#0369a1", bg: "#e0f2fe", icon: "⏳" },
};

const CheckInOut: React.FC = () => {
    const currentUser = useCurrentUser();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [status, setStatus] = useState<"pending" | "checked_in" | "checked_out">("pending");
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(null);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [workingHours, setWorkingHours] = useState<number>(0);
    const [todaySchedule, setTodaySchedule] = useState<WorkScheduleResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Live clock
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Format "HH:mm:ss" → keep full for comparison, display "HH:mm"
    const formatApiTime = (time: string | null): string | null => {
        if (!time) return null;
        const parts = time.split(":");
        return `${parts[0]}:${parts[1]}:${parts[2] ?? "00"}`;
    };

    const displayTime = (time: string | null): string => {
        if (!time) return "--:--";
        return time.substring(0, 5);
    };

    const formatWorkingHours = (hours: number): string => {
        if (hours <= 0) return "00h 00m";
        const h = Math.floor(hours);
        const m = Math.round((hours - h) * 60);
        return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m`;
    };

    // Calculate elapsed time for "checked_in" status (live counter)
    const getElapsedTime = useCallback((): string => {
        if (status !== "checked_in" || !checkInTime) return "00h 00m";
        const now = new Date();
        const [h, m, s] = checkInTime.split(":").map(Number);
        const checkInDate = new Date();
        checkInDate.setHours(h, m, s || 0, 0);
        const diffMs = now.getTime() - checkInDate.getTime();
        if (diffMs < 0) return "00h 00m";
        const totalMin = Math.floor(diffMs / 60000);
        const hours = Math.floor(totalMin / 60);
        const mins = totalMin % 60;
        return `${String(hours).padStart(2, "0")}h ${String(mins).padStart(2, "0")}m`;
    }, [status, checkInTime]);

    const [elapsedDisplay, setElapsedDisplay] = useState("00h 00m");

    useEffect(() => {
        if (status !== "checked_in") return;
        setElapsedDisplay(getElapsedTime());
        const timer = setInterval(() => setElapsedDisplay(getElapsedTime()), 30000);
        return () => clearInterval(timer);
    }, [status, getElapsedTime]);

    // Detect if check-in is late (after shift start + 5 min grace)
    const isCheckInLate = useCallback((): boolean => {
        if (!checkInTime || !todaySchedule?.shift?.startTime) return false;
        const shiftStart = todaySchedule.shift.startTime; // "HH:mm:ss"
        const [sh, sm] = shiftStart.split(":").map(Number);
        const [ch, cm, cs] = checkInTime.split(":").map(Number);
        const shiftMinutes = sh * 60 + sm + 5; // grace 5 minutes
        const checkMinutes = ch * 60 + cm + (cs || 0) / 60;
        return checkMinutes > shiftMinutes;
    }, [checkInTime, todaySchedule]);

    // Apply data from AttendanceLogResponse to local state
    const applyLogState = (log: AttendanceLogResponse) => {
        setCheckInTime(formatApiTime(log.checkIn));
        setCheckOutTime(formatApiTime(log.checkOut));
        setWorkingHours(log.workingHours ?? 0);
        setAttendanceStatus(log.status as AttendanceStatus);

        if (log.checkOut) {
            setStatus("checked_out");
        } else if (log.checkIn) {
            setStatus("checked_in");
        } else {
            setStatus("pending");
        }
    };

    useEffect(() => {
        const init = async () => {
            if (!currentUser?.employeeId) {
                setInitializing(false);
                return;
            }
            try {
                const todayLog = await getTodayLog(currentUser.employeeId);
                if (todayLog) {
                    applyLogState(todayLog);
                }

                const now = new Date();
                const schedules = await getMySchedules(
                    currentUser.employeeId,
                    now.getMonth() + 1,
                    now.getFullYear()
                );
                const todayStr = now.toISOString().split("T")[0];
                const todaySched = schedules.find((s) => s.date === todayStr);
                setTodaySchedule(todaySched ?? null);
            } catch (err) {
                console.error("Failed to initialize attendance:", err);
            } finally {
                setInitializing(false);
            }
        };
        init();
    }, [currentUser?.employeeId]);

    const formatTime = (date: Date) =>
        date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
        });

    const formatDate = (date: Date) =>
        date.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const handleCheckIn = async () => {
        if (!currentUser?.employeeId) {
            setError("Employee ID not found. Please contact your administrator.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await apiCheckIn(currentUser.employeeId);
            applyLogState(result);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (err instanceof Error ? err.message : "Unable to Check-in. Please try again.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        if (!currentUser?.employeeId) {
            setError("Employee ID not found. Please contact your administrator.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const result = await apiCheckOut(currentUser.employeeId);
            applyLogState(result);
        } catch (err: unknown) {
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (err instanceof Error ? err.message : "Unable to Check-out. Please try again.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    // Display work hours
    const displayWorkHours =
        status === "checked_in"
            ? elapsedDisplay
            : status === "checked_out"
                ? formatWorkingHours(workingHours)
                : "00h 00m";

    // ── FE-side time comparison (independent of backend single-status) ──
    // Backend uses else-if → only returns ONE status (LATE > EARLY_LEAVE > VALID).
    // So FE must check check-in and check-out INDEPENDENTLY against shift times.

    const isCheckOutEarly = useCallback((): boolean => {
        if (!checkOutTime || !todaySchedule?.shift?.endTime) return false;
        const [sh, sm] = todaySchedule.shift.endTime.split(":").map(Number);
        const [ch, cm, cs] = checkOutTime.split(":").map(Number);
        const shiftEndMinutes = sh * 60 + sm;
        const checkOutMinutes = ch * 60 + cm + (cs || 0) / 60;
        return checkOutMinutes < shiftEndMinutes;
    }, [checkOutTime, todaySchedule]);

    const getCheckInBadge = () => {
        if (!checkInTime) return null;

        // FE-side: always compare check-in time vs shift start + 5 min grace
        if (isCheckInLate()) {
            return { label: "LATE", color: "#dc2626", bg: "#fef2f2" };
        }

        return { label: "ON TIME", color: "#15803d", bg: "#dcfce7" };
    };

    const getCheckOutBadge = () => {
        if (!checkOutTime) return null;

        // FE-side: always compare check-out time vs shift end
        if (isCheckOutEarly()) {
            return { label: "EARLY LEAVE", color: "#b45309", bg: "#fef3c7" };
        }

        return { label: "ON TIME", color: "#15803d", bg: "#dcfce7" };
    };

    // Overall status badge for the summary
    const getOverallStatusBadge = () => {
        if (!attendanceStatus) return null;
        return STATUS_CONFIG[attendanceStatus] ?? null;
    };

    // No employee linked
    if (!initializing && !currentUser?.employeeId) {
        return (
            <div className="flex flex-col pb-10 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                    <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Time & Attendance</h1>
                </div>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 shadow-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#b45309]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#0f172a] mb-2">Employee Profile Not Linked</h3>
                    <p className="text-[#64748b] text-sm">Your account has not been assigned an Employee ID. Please contact your administrator.</p>
                </div>
            </div>
        );
    }

    const checkInBadge = getCheckInBadge();
    const checkOutBadge = getCheckOutBadge();
    const overallBadge = getOverallStatusBadge();

    return (
        <div className="flex flex-col pb-10 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Time & Attendance</h1>
            </div>

            {/* Error banner */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm font-medium flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-[#dc2626] hover:text-[#b91c1c]">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ── MAIN CLOCK PANEL ── */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#f0fdf4] rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#f0f9ff] rounded-full blur-3xl opacity-60"></div>

                    {initializing ? (
                        <div className="relative z-10 flex flex-col items-center gap-4 py-12">
                            <div className="w-12 h-12 border-4 border-[#e2e8f0] border-t-[#0d9488] rounded-full animate-spin"></div>
                            <p className="text-[#64748b] font-medium">Loading attendance data...</p>
                        </div>
                    ) : (
                        <>
                            <div className="relative z-10 text-center mb-10">
                                <p className="text-[#64748b] font-medium text-lg mb-2 uppercase tracking-wider">{formatDate(currentTime)}</p>
                                <h2 className="text-[72px] font-bold text-[#0f172a] leading-none tracking-tight font-mono">
                                    {formatTime(currentTime)}
                                </h2>

                                {/* Overall attendance status badge */}
                                {overallBadge && (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: overallBadge.bg }}>
                                        <span className="text-sm">{overallBadge.icon}</span>
                                        <span className="text-sm font-bold" style={{ color: overallBadge.color }}>
                                            {overallBadge.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="relative z-10 w-full max-w-md space-y-4">
                                {status === "pending" && (
                                    <>
                                        <button
                                            onClick={handleCheckIn}
                                            disabled={loading}
                                            className="w-full relative group overflow-hidden bg-[#0d9488] text-white py-5 rounded-2xl font-bold text-xl shadow-[0_8px_20px_rgb(13,148,136,0.25)] hover:shadow-[0_8px_25px_rgb(13,148,136,0.35)] transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                            <div className="flex items-center justify-center gap-3">
                                                {loading ? (
                                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                                    </svg>
                                                )}
                                                {loading ? "PROCESSING..." : "CHECK-IN NOW"}
                                            </div>
                                        </button>
                                        {/* Show shift time hint */}
                                        {todaySchedule && (
                                            <p className="text-center text-[#64748b] text-sm">
                                                Shift starts at <span className="font-bold text-[#0d9488]">{todaySchedule.shift.startTime.substring(0, 5)}</span>
                                                <span className="text-[#94a3b8]"> (5-min grace period)</span>
                                            </p>
                                        )}
                                    </>
                                )}

                                {status === "checked_in" && (
                                    <>
                                        <button
                                            onClick={handleCheckOut}
                                            disabled={loading}
                                            className="w-full relative group overflow-hidden bg-[#f59e0b] text-white py-5 rounded-2xl font-bold text-xl shadow-[0_8px_20px_rgb(245,158,11,0.25)] hover:shadow-[0_8px_25px_rgb(245,158,11,0.35)] transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                                        >
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                            <div className="flex items-center justify-center gap-3">
                                                {loading ? (
                                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                    </svg>
                                                )}
                                                {loading ? "PROCESSING..." : "CHECK-OUT"}
                                            </div>
                                        </button>
                                        {/* Show shift end time hint */}
                                        {todaySchedule && (
                                            <p className="text-center text-[#64748b] text-sm">
                                                Shift ends at <span className="font-bold text-[#f59e0b]">{todaySchedule.shift.endTime.substring(0, 5)}</span>
                                                <span className="text-[#94a3b8]"> — early check-out counts as early leave</span>
                                            </p>
                                        )}
                                    </>
                                )}

                                {status === "checked_out" && (
                                    <div className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] py-5 rounded-2xl font-bold text-xl text-center flex items-center justify-center gap-3 cursor-not-allowed">
                                        <svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        SHIFT COMPLETED
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── STATUS PANEL ── */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col space-y-6">
                    {/* Shift info */}
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-5">Today's Shift</h3>
                        {todaySchedule ? (
                            <div className="p-4 rounded-xl bg-[#ccfbf1] border border-[#99f6e4]">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2.5 py-1 bg-[#0d9488] text-white text-[10px] font-bold uppercase tracking-wider rounded-md">
                                        {todaySchedule.shift.name}
                                    </span>
                                    <span className="text-[#0f766e] font-bold text-sm">
                                        {todaySchedule.shift.startTime.substring(0, 5)} - {todaySchedule.shift.endTime.substring(0, 5)}
                                    </span>
                                </div>

                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]">
                                <p className="text-sm text-[#94a3b8] text-center">
                                    {initializing ? "Loading..." : "No shift scheduled for today"}
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="border-t border-[#f1f5f9]"></div>

                    {/* Status details */}
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-4">Status</h3>
                        <div className="space-y-4">
                            {/* Check In Stat */}
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${checkInBadge
                                    ? checkInBadge.label === "LATE"
                                        ? "bg-[#fef2f2] text-[#dc2626]"
                                        : "bg-[#dcfce7] text-[#15803d]"
                                    : "bg-[#f1f5f9] text-[#94a3b8]"
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-[#64748b] font-medium">Check-in</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-lg font-bold ${checkInTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>
                                            {displayTime(checkInTime)}
                                        </p>

                                    </div>
                                </div>
                                {checkInBadge && (
                                    <span
                                        className="ml-auto text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap"
                                        style={{ color: checkInBadge.color, backgroundColor: checkInBadge.bg }}
                                    >
                                        {checkInBadge.label}
                                    </span>
                                )}
                            </div>

                            {/* Check Out Stat */}
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${checkOutBadge
                                    ? checkOutBadge.label === "EARLY LEAVE"
                                        ? "bg-[#fef3c7] text-[#b45309]"
                                        : "bg-[#dcfce7] text-[#15803d]"
                                    : "bg-[#f1f5f9] text-[#94a3b8]"
                                    }`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-[#64748b] font-medium">Check-out</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className={`text-lg font-bold ${checkOutTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>
                                            {displayTime(checkOutTime)}
                                        </p>

                                    </div>
                                </div>
                                {checkOutBadge && (
                                    <span
                                        className="ml-auto text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap"
                                        style={{ color: checkOutBadge.color, backgroundColor: checkOutBadge.bg }}
                                    >
                                        {checkOutBadge.label}
                                    </span>
                                )}
                            </div>

                            {/* Total Time Stat */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#e0f2fe] text-[#0369a1]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[#64748b] font-medium">Total Hours</p>
                                    <p className="text-lg font-bold text-[#0f172a]">
                                        {displayWorkHours}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tailwind Keyframes for shimmer animation */}
            <style>
                {`
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
        `}
            </style>
        </div>
    );
};

export default CheckInOut;
