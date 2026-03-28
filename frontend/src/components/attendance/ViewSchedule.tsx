import React, { useState, useEffect } from "react";
import { getMySchedules, type WorkScheduleResponse } from "../../services/attendanceService";
import { useCurrentUser } from "../../hooks/useCurrentUser";

// ============================================================================
// 1. CONFIGURATION & CONSTANTS (Cấu hình & Hằng số)
// ============================================================================
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// ============================================================================
// 2. HELPER FUNCTIONS (Hàm công cụ độc lập - Không dính đến State)
// ============================================================================
function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
    const jsDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
    return (jsDay + 6) % 7; // Chuyển sang Mon=0, Tue=1, ..., Sun=6
}

function toDateKey(year: number, month: number, day: number): string {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    return `${year}-${mm}-${dd}`;
}

// ============================================================================
// 3. MAIN COMPONENT
// ============================================================================
const ViewSchedule: React.FC = () => {
    // ------------------------------------------------------------------------
    // A. STATE MANAGEMENT (Quản lý trạng thái)
    // ------------------------------------------------------------------------
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth());

    const [schedules, setSchedules] = useState<WorkScheduleResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const currentUser = useCurrentUser();

    // ------------------------------------------------------------------------
    // B. LIFECYCLE & EFFECTS (Tự động chạy lấy dữ liệu)
    // ------------------------------------------------------------------------
    useEffect(() => {
        const fetchSchedules = async () => {
            setLoading(true);
            setError(null);
            try {
                // Lấy thông tin User từ Token

                const empId = currentUser?.employeeId;

                // Xử lý lệch múi tháng (Java: 1=Jan, JS: 0=Jan)
                const apiMonth = month + 1;
                const apiYear = year;

                // CHẶN CỬA: Nếu không có empId thì quăng lỗi ngay lập tức
                if (!empId) {
                    throw new Error("Can not find employeeId. Please re-login.!");
                }

                // Bắt đầu gọi API (Lúc này chắc chắn 100% đã có empId)
                const data = await getMySchedules(empId, apiMonth, apiYear);

                console.log("[ViewSchedule] Schedules:", data);
                setSchedules(data);
            } catch (err: any) {
                const msg = err?.response?.data?.message ?? err.message ?? "Lỗi không xác định";
                setError(`Lỗi kết nối backend: ${msg}`);
                console.error("[ViewSchedule] Lỗi:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedules();
    }, [year, month, currentUser?.employeeId]); // Chạy lại hàm này mỗi khi year hoặc month thay đổi

    // ------------------------------------------------------------------------
    // C. COMPUTED VALUES (Tính toán dữ liệu trước khi vẽ giao diện)
    // ------------------------------------------------------------------------
    // Gom nhóm lịch theo Ngày (Đề phòng 1 ngày có 2 ca làm)
    const scheduleMap = new Map<string, WorkScheduleResponse[]>();
    for (const s of schedules) {
        const existing = scheduleMap.get(s.date) ?? [];
        existing.push(s);
        scheduleMap.set(s.date, existing);
    }

    // Tính toán số lượng ô vuông trên lưới Lịch
    const totalDays = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

    const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
    const leadingDays = Array.from({ length: startDay }, (_, i) => prevMonthDays - startDay + 1 + i);
    const totalCells = Math.ceil((startDay + totalDays) / 7) * 7;
    const trailingDays = Array.from({ length: totalCells - startDay - totalDays }, (_, i) => i + 1);

    // ------------------------------------------------------------------------
    // D. EVENT HANDLERS (Hàm gắn vào nút bấm)
    // ------------------------------------------------------------------------
    const prevMonth = () => {
        if (month === 0) {
            setMonth(11);
            setYear(y => y - 1);
        } else {
            setMonth(m => m - 1);
        }
    };

    const nextMonth = () => {
        if (month === 11) {
            setMonth(0);
            setYear(y => y + 1);
        } else {
            setMonth(m => m + 1);
        }
    };

    // ------------------------------------------------------------------------
    // E. RENDER (Vẽ giao diện HTML/JSX)
    // ------------------------------------------------------------------------
    return (
        <div className="flex flex-col pb-10">
            {/* Header Trang */}
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">My Schedule</h1>
            </div>

            {/* Bảng Lịch (Calendar Box) */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">

                {/* Thanh Công Cụ (Controls: Tháng/Năm, Nút Tới/Lui) */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-4">
                        <h2 className="text-xl font-bold text-[#0f172a]">{MONTH_NAMES[month]} {year}</h2>
                        <div className="flex space-x-1">
                            <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-[#64748b]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                            <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-[#64748b]">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Trạng thái Loading & Báo Lỗi */}
                {loading && <div className="text-center py-10 text-sm opacity-60">Đang tải lịch làm việc...</div>}
                {error && (
                    <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                        ⚠️ {error}
                    </div>
                )}

                {/* Khung Lưới Chứa Các Ngày (Grid) */}
                {!loading && (
                    <div className="grid grid-cols-7 border-t border-l border-[#e2e8f0] rounded-xl overflow-hidden [&>*]:border-b [&>*]:border-r [&>*]:border-[#e2e8f0]">

                        {/* Hàng Tiêu Đề: Tên các Thứ trong tuần */}
                        {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-[#94a3b8] bg-[#f8fafc]">{d}</div>
                        ))}

                        {/* Các ô xám xịt của Tháng Trước (Leading Days) */}
                        {leadingDays.map((d) => (
                            <div key={`prev-${d}`} className="min-h-[90px] p-2 bg-[#f8fafc] text-[#c0ccd8]">
                                <span className="text-sm font-medium ml-1">{d}</span>
                            </div>
                        ))}

                        {/* Các ô vuông Ngày trong Tháng Hiện Tại */}
                        {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                            const dateKey = toDateKey(year, month, day);
                            const daySchedules = scheduleMap.get(dateKey) ?? [];
                            const isToday = dateKey === todayKey;

                            return (
                                <div key={day} className={`min-h-[100px] p-2 flex flex-col gap-1 transition-colors ${isToday ? "bg-[#f0fdf4]" : "hover:bg-[#fafafa]"}`}>

                                    {/* Vẽ số Ngày (Tô màu xanh nếu là Hôm nay) */}
                                    <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0 ${isToday ? "bg-[#0d9488] text-white" : "text-[#1e293b]"}`}>
                                        {day}
                                    </span>

                                    {/* Vẽ danh sách các Ca Làm của ngày đó */}
                                    {daySchedules.map((sch) => {
                                        if (!sch.shift) return null;
                                        return (
                                            <div
                                                key={sch.id}
                                                title={sch.shift.name}
                                                className="text-[10px] font-bold py-1 px-1.5 rounded-md flex flex-col items-center justify-center text-center leading-tight mx-0.5 bg-[#ccfbf1] text-[#0f766e]"
                                            >
                                                <span className="opacity-70 text-[9px] font-semibold">{sch.shift.name}</span>
                                                <span>{sch.shift.startTime.slice(0, 5)} – {sch.shift.endTime.slice(0, 5)}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            );
                        })}

                        {/* Các ô xám xịt của Tháng Sau (Trailing Days) */}
                        {trailingDays.map((d) => (
                            <div key={`next-${d}`} className="min-h-[90px] p-2 bg-[#f8fafc] text-[#c0ccd8]">
                                <span className="text-sm font-medium ml-1">{d}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ViewSchedule;