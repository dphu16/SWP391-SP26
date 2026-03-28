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

// ============================================================================
// KHU VỰC 1: CẤU HÌNH & KIỂU DỮ LIỆU (CONFIG & TYPES)
// Khai báo các hằng số, màu sắc, icon dùng chung cho file
// ============================================================================
type AttendanceStatus = "MISSING_PUNCH" | "LATE" | "EARLY_LEAVE" | "VALID" | "LATE_EARLY" | null;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: string }> = {
    VALID: { label: "ON TIME", color: "#15803d", bg: "#dcfce7", icon: "✓" },
    LATE: { label: "LATE", color: "#dc2626", bg: "#fef2f2", icon: "⚠" },
    EARLY_LEAVE: { label: "EARLY LEAVE", color: "#b45309", bg: "#fef3c7", icon: "⚠" },
    MISSING_PUNCH: { label: "AWAITING CHECK-OUT", color: "#0369a1", bg: "#e0f2fe", icon: "⏳" },
    LATE_EARLY: { label: "LATE & EARLY", color: "#991b1b", bg: "#fee2e2", icon: "⚠" },
};

const CheckInOut: React.FC = () => {
    // ============================================================================
    // KHU VỰC 2: KHỞI TẠO STATE (STATE MANAGEMENT)
    // Nơi lưu trữ toàn bộ dữ liệu biến đổi của màn hình này
    // ============================================================================
    const currentUser = useCurrentUser();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedDisplay, setElapsedDisplay] = useState("00h 00m");

    // State liên quan đến Chấm công & Ca làm việc
    const [status, setStatus] = useState<"pending" | "checked_in" | "checked_out">("pending");
    const [attendanceStatus, setAttendanceStatus] = useState<AttendanceStatus>(null);
    const [checkInTime, setCheckInTime] = useState<string | null>(null);
    const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
    const [workingHours, setWorkingHours] = useState<number>(0);
    const [todaySchedule, setTodaySchedule] = useState<WorkScheduleResponse | null>(null);

    // State liên quan đến UI (Loading, Error)
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // ============================================================================
    // KHU VỰC 3: CÁC HÀM FORMAT DỮ LIỆU (FORMATTERS)
    // Các hàm nhỏ chuyên dùng để cắt chuỗi, format giờ/ngày cho đẹp
    // ============================================================================
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

    const formatTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
    const formatDate = (date: Date) => date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    // ============================================================================
    // KHU VỰC 4: LOGIC TÍNH TOÁN & CẬP NHẬT STATE (CORE LOGIC)
    // ============================================================================
    // 4.1. Tính thời gian đã trôi qua từ lúc Check-in (Live counter)
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

    // 4.2. Kiểm tra xem có đi muộn không (So sánh giờ bấm với giờ Ca làm)
    const isCheckInLate = useCallback((): boolean => {
        if (!checkInTime || !todaySchedule?.shift?.startTime) return false;
        const [sh, sm] = todaySchedule.shift.startTime.split(":").map(Number);
        const [ch, cm, cs] = checkInTime.split(":").map(Number);
        const shiftMinutes = sh * 60 + sm;
        const checkMinutes = ch * 60 + cm + (cs || 0) / 60;
        return checkMinutes > shiftMinutes;
    }, [checkInTime, todaySchedule]);

    // 4.3. Kiểm tra xem có về sớm không
    const isCheckOutEarly = useCallback((): boolean => {
        if (!checkOutTime || !todaySchedule?.shift?.endTime) return false;
        const [sh, sm] = todaySchedule.shift.endTime.split(":").map(Number);
        const [ch, cm, cs] = checkOutTime.split(":").map(Number);
        const shiftEndMinutes = sh * 60 + sm;
        const checkOutMinutes = ch * 60 + cm + (cs || 0) / 60;
        return checkOutMinutes < shiftEndMinutes;
    }, [checkOutTime, todaySchedule]);

    // 4.4. Đổ dữ liệu từ API vào Local State
    const applyLogState = (log: AttendanceLogResponse) => {
        setCheckInTime(formatApiTime(log.checkIn));
        setCheckOutTime(formatApiTime(log.checkOut));
        setWorkingHours(log.workingHours ?? 0);
        setAttendanceStatus(log.status as AttendanceStatus);

        if (log.checkOut) setStatus("checked_out");
        else if (log.checkIn) setStatus("checked_in");
        else setStatus("pending");
    };

    // ============================================================================
    // KHU VỰC 5: LIFECYCLE EFFECTS (TỰ ĐỘNG CHẠY NGẦM)
    // ============================================================================
    // 5.1. Đồng hồ nháy theo giây
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 5.2. Cập nhật số giờ làm việc nháy mỗi 30 giây (khi đang trong ca)
    useEffect(() => {
        if (status !== "checked_in") return;
        setElapsedDisplay(getElapsedTime());
        const timer = setInterval(() => setElapsedDisplay(getElapsedTime()), 30000);
        return () => clearInterval(timer);
    }, [status, getElapsedTime]);

    // 5.3. Chạy 1 lần lúc mới vào trang: Tải Log hôm nay & Lịch làm việc
    useEffect(() => {
        const init = async () => {
            if (!currentUser?.employeeId) {
                setInitializing(false);
                return;
            }
            try {
                const todayLog = await getTodayLog(currentUser.employeeId);
                if (todayLog) applyLogState(todayLog);

                const now = new Date();
                const schedules = await getMySchedules(currentUser.employeeId, now.getMonth() + 1, now.getFullYear());
                const localTodayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const todaySched = schedules.find((s) => s.date === localTodayStr);

                setTodaySchedule(todaySched ?? null);
            } catch (err) {
                console.error("Failed to initialize attendance:", err);
            } finally {
                setInitializing(false);
            }
        };
        init();
    }, [currentUser?.employeeId]);

    // ============================================================================
    // KHU VỰC 6: XỬ LÝ SỰ KIỆN NÚT BẤM (ACTION HANDLERS)
    // Các hàm được gọi khi User thực sự click vào nút trên màn hình
    // ============================================================================
    // 🔴 [NÚT BẤM]: Xử lý khi nhấn nút CHECK-IN
    const handleCheckIn = async () => {
        if (!currentUser?.employeeId) {
            setError("Employee ID not found. Please contact your administrator.");
            return;
        }
        setLoading(true); setError(null);
        try {
            const result = await apiCheckIn(currentUser.employeeId);
            applyLogState(result); // Cập nhật lại UI sau khi call API thành công
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err.message ?? "Unable to Check-in. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // 🔴 [NÚT BẤM]: Xử lý khi nhấn nút CHECK-OUT
    const handleCheckOut = async () => {
        if (!currentUser?.employeeId) {
            setError("Employee ID not found. Please contact your administrator.");
            return;
        }
        setLoading(true); setError(null);
        try {
            const result = await apiCheckOut(currentUser.employeeId);
            applyLogState(result); // Cập nhật lại UI sau khi call API thành công
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err.message ?? "Unable to Check-out. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ============================================================================
    // KHU VỰC 7: CHUẨN BỊ DỮ LIỆU HIỂN THỊ (UI PREPARATION)
    // Tính toán xem sẽ vẽ cái Badge màu gì, hiển thị chữ gì trước khi thả vào JSX
    // ============================================================================
    const displayWorkHours = status === "checked_in" ? elapsedDisplay : status === "checked_out" ? formatWorkingHours(workingHours) : "00h 00m";

    const getCheckInBadge = () => {
        if (!checkInTime) return null;
        if (isCheckInLate()) return { label: "LATE", color: "#dc2626", bg: "#fef2f2" };
        return { label: "ON TIME", color: "#15803d", bg: "#dcfce7" };
    };

    const getCheckOutBadge = () => {
        if (!checkOutTime) return null;
        if (isCheckOutEarly()) return { label: "EARLY LEAVE", color: "#b45309", bg: "#fef3c7" };
        return { label: "ON TIME", color: "#15803d", bg: "#dcfce7" };
    };

    const getOverallStatusBadge = () => {
        if (!attendanceStatus) return null;
        return STATUS_CONFIG[attendanceStatus] ?? null;
    };


    // ============================================================================
    // KHU VỰC 8: VẼ GIAO DIỆN (RENDER JSX)
    // ============================================================================

    // Màn hình lỗi: Chưa liên kết Employee ID
    if (!initializing && !currentUser?.employeeId) {
        return (
            <div className="flex flex-col pb-10 max-w-5xl mx-auto w-full">
                <div className="mb-6"><h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Time & Attendance</h1></div>
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 shadow-sm text-center">
                    <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#b45309]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
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

    // Màn hình chính
    return (
        <div className="flex flex-col pb-10 max-w-5xl mx-auto w-full">
            <div className="mb-6"><h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Time & Attendance</h1></div>

            {/* Banner báo lỗi đỏ (nếu có) */}
            {error && (
                <div className="mb-4 p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm font-medium flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="ml-auto text-[#dc2626] hover:text-[#b91c1c]"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* ---------- PANEL TRÁI: ĐỒNG HỒ & NÚT BẤM CHÍNH ---------- */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-[#f0fdf4] rounded-full blur-3xl opacity-60"></div>
                    <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-[#f0f9ff] rounded-full blur-3xl opacity-60"></div>

                    {initializing ? (
                        <div className="relative z-10 flex flex-col items-center gap-4 py-12">
                            <div className="w-12 h-12 border-4 border-[#e2e8f0] border-t-[#0d9488] rounded-full animate-spin"></div>
                            <p className="text-[#64748b] font-medium">Loading attendance data...</p>
                        </div>
                    ) : (
                        <>
                            {/* Khu vực Đồng hồ Live */}
                            <div className="relative z-10 text-center mb-10">
                                <p className="text-[#64748b] font-medium text-lg mb-2 uppercase tracking-wider">{formatDate(currentTime)}</p>
                                <h2 className="text-[72px] font-bold text-[#0f172a] leading-none tracking-tight font-mono">{formatTime(currentTime)}</h2>
                                {overallBadge && (
                                    <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ backgroundColor: overallBadge.bg }}>
                                        <span className="text-sm">{overallBadge.icon}</span>
                                        <span className="text-sm font-bold" style={{ color: overallBadge.color }}>{overallBadge.label}</span>
                                    </div>
                                )}
                            </div>

                            {/* Khu vực Nút bấm hành động */}
                            <div className="relative z-10 w-full max-w-md space-y-4">

                                {/* TRẠNG THÁI 1: CHƯA LÀM GÌ CẢ (Chờ Check-in) */}
                                {status === "pending" && (
                                    <>
                                        {/*Check xem có lịch làm hôm nay ko*/todaySchedule ? (
                                            <>
                                                {/* 🔴 NÚT BẤM: CHECK-IN NOW */}
                                                <button onClick={handleCheckIn} disabled={loading} className="w-full relative group overflow-hidden bg-[#0d9488] text-white py-5 rounded-2xl font-bold text-xl shadow-[0_8px_20px_rgb(13,148,136,0.25)] hover:shadow-[0_8px_25px_rgb(13,148,136,0.35)] transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                                                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                                    <div className="flex items-center justify-center gap-3">
                                                        {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>}
                                                        {loading ? "PROCESSING..." : "CHECK-IN NOW"}
                                                    </div>
                                                </button>
                                                <p className="text-center text-[#64748b] text-sm">Shift starts at <span className="font-bold text-[#0d9488]">{todaySchedule.shift.startTime.substring(0, 5)}</span></p>
                                            </>
                                        ) : (
                                            //Disable nút check-in khi không có lịch làm việc
                                            <div className="w-full space-y-4">
                                                <button disabled className="w-full bg-[#e2e8f0] text-[#94a3b8] py-5 rounded-2xl font-bold text-xl cursor-not-allowed">
                                                    <div className="flex items-center justify-center gap-3"><svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>CHECK-IN DISABLED</div>
                                                </button>
                                                <div className="p-4 rounded-xl bg-[#fff7ed] border border-[#ffedd5] text-[#9a3412] text-center text-sm font-medium">You don't have a work schedule for today. Please contact your manager to be assigned a shift.</div>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* TRẠNG THÁI 2: ĐANG TRONG CA LÀM (Chờ Check-out) */}
                                {status === "checked_in" && (
                                    <>
                                        {/* 🔴 NÚT BẤM: CHECK-OUT */}
                                        <button onClick={handleCheckOut} disabled={loading} className="w-full relative group overflow-hidden bg-[#f59e0b] text-white py-5 rounded-2xl font-bold text-xl shadow-[0_8px_20px_rgb(245,158,11,0.25)] hover:shadow-[0_8px_25px_rgb(245,158,11,0.35)] transition-all transform hover:-translate-y-1 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                                            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                                            <div className="flex items-center justify-center gap-3">
                                                {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>}
                                                {loading ? "PROCESSING..." : "CHECK-OUT"}
                                            </div>
                                        </button>
                                        {todaySchedule && <p className="text-center text-[#64748b] text-sm">Shift ends at <span className="font-bold text-[#f59e0b]">{todaySchedule.shift.endTime.substring(0, 5)}</span><span className="text-[#94a3b8]"> — early check-out counts as early leave</span></p>}
                                    </>
                                )}

                                {/* TRẠNG THÁI 3: ĐÃ XONG VIỆC (Shift Completed) */}
                                {status === "checked_out" && (
                                    <div className="w-full bg-[#f8fafc] border-2 border-[#e2e8f0] text-[#64748b] py-5 rounded-2xl font-bold text-xl text-center flex items-center justify-center gap-3 cursor-not-allowed">
                                        <svg className="w-7 h-7 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>SHIFT COMPLETED
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ---------- PANEL PHẢI: BẢNG TRẠNG THÁI (STATUS) ---------- */}
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm flex flex-col space-y-6">

                    {/* Hộp hiển thị giờ của Ca làm việc */}
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-5">Today's Shift</h3>
                        {todaySchedule ? (
                            <div className="p-4 rounded-xl bg-[#ccfbf1] border border-[#99f6e4]">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="px-2.5 py-1 bg-[#0d9488] text-white text-[10px] font-bold uppercase tracking-wider rounded-md">{todaySchedule.shift.name}</span>
                                    <span className="text-[#0f766e] font-bold text-sm">{todaySchedule.shift.startTime.substring(0, 5)} - {todaySchedule.shift.endTime.substring(0, 5)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 rounded-xl bg-[#f8fafc] border border-[#e2e8f0]"><p className="text-sm text-[#94a3b8] text-center">{initializing ? "Loading..." : "No shift scheduled for today"}</p></div>
                        )}
                    </div>

                    <div className="border-t border-[#f1f5f9]"></div>

                    {/* Hộp hiển thị Lịch sử chấm (Check-in/out thực tế) */}
                    <div>
                        <h3 className="text-base font-bold text-[#0f172a] mb-4">Status</h3>
                        <div className="space-y-4">

                            {/* Dòng Check-in */}
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${checkInBadge ? checkInBadge.label === "LATE" ? "bg-[#fef2f2] text-[#dc2626]" : "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#94a3b8]"}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-[#64748b] font-medium">Check-in</p>
                                    <div className="flex items-baseline gap-2"><p className={`text-lg font-bold ${checkInTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>{displayTime(checkInTime)}</p></div>
                                </div>
                                {checkInBadge && <span className="ml-auto text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap" style={{ color: checkInBadge.color, backgroundColor: checkInBadge.bg }}>{checkInBadge.label}</span>}
                            </div>

                            {/* Dòng Check-out */}
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${checkOutBadge ? checkOutBadge.label === "EARLY LEAVE" ? "bg-[#fef3c7] text-[#b45309]" : "bg-[#dcfce7] text-[#15803d]" : "bg-[#f1f5f9] text-[#94a3b8]"}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm text-[#64748b] font-medium">Check-out</p>
                                    <div className="flex items-baseline gap-2"><p className={`text-lg font-bold ${checkOutTime ? 'text-[#0f172a]' : 'text-[#cbd5e1]'}`}>{displayTime(checkOutTime)}</p></div>
                                </div>
                                {checkOutBadge && <span className="ml-auto text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap" style={{ color: checkOutBadge.color, backgroundColor: checkOutBadge.bg }}>{checkOutBadge.label}</span>}
                            </div>

                            {/* Dòng Tổng số giờ */}
                            <div className="flex items-center gap-4 pt-2">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-[#e0f2fe] text-[#0369a1]">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <p className="text-sm text-[#64748b] font-medium">Total Hours</p>
                                    <p className="text-lg font-bold text-[#0f172a]">{displayWorkHours}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
        </div>
    );
};

export default CheckInOut;