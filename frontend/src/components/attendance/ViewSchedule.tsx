import React, { useState, useEffect } from "react";
import { getMySchedules, getAllSchedules, type WorkScheduleResponse } from "../../services/attendanceService";
import { getToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

const MONTH_NAMES = [
 "January", "February", "March", "April", "May", "June",
 "July", "August", "September", "October", "November", "December",
];

function getDaysInMonth(year: number, month: number) {
 return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
 const jsDay = new Date(year, month, 1).getDay(); // 0=Sun, 1=Mon...
 // Chuyển sang Mon=0, Tue=1, ..., Sun=6
 return (jsDay + 6) % 7;
}

function toDateKey(year: number, month: number, day: number): string {
 const mm = String(month + 1).padStart(2, "0");
 const dd = String(day).padStart(2, "0");
 return `${year}-${mm}-${dd}`;
}

const ViewSchedule: React.FC = () => {
 const today = new Date();
 const [year, setYear] = useState(today.getFullYear());
 const [month, setMonth] = useState(today.getMonth());

 const [schedules, setSchedules] = useState<WorkScheduleResponse[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [debugInfo, setDebugInfo] = useState<string>("");

 useEffect(() => {
 const fetchSchedules = async () => {
 setLoading(true);
 setError(null);
 try {
 const token = getToken();
 const payload = token ? decodeJwt(token) : null;
 const empId = payload?.employeeId;

 // month+1 vì Java dùng 1-indexed (1=Jan), JS dùng 0-indexed (0=Jan)
 const apiMonth = month + 1;
 const apiYear = year;

 let data: WorkScheduleResponse[];
 if (empId) {
 data = await getMySchedules(empId, apiMonth, apiYear);
 setDebugInfo(`employeeId: ${empId} | ${data.length} lịch tháng ${apiMonth}/${apiYear}`);
 } else {
 // Demo mode: lấy tất cả (không lọc theo tháng vì getAllSchedules không hỗ trợ)
 data = await getAllSchedules();
 setDebugInfo(`Demo mode | ${data.length} lịch từ DB`);
 }

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
 }, [year, month]); // refetch khi đổi tháng/năm

 // Map dateKey -> list of schedules (hỗ trợ nhiều ca/ngày)
 const scheduleMap = new Map<string, WorkScheduleResponse[]>();
 for (const s of schedules) {
 const existing = scheduleMap.get(s.date) ?? [];
 existing.push(s);
 scheduleMap.set(s.date, existing);
 }

 const totalDays = getDaysInMonth(year, month);
 const startDay = getFirstDayOfMonth(year, month);
 const todayKey = toDateKey(today.getFullYear(), today.getMonth(), today.getDate());

 const prevMonthDays = getDaysInMonth(year, month === 0 ? 11 : month - 1);
 const leadingDays = Array.from({ length: startDay }, (_, i) => prevMonthDays - startDay + 1 + i);
 const totalCells = Math.ceil((startDay + totalDays) / 7) * 7;
 const trailingDays = Array.from({ length: totalCells - startDay - totalDays }, (_, i) => i + 1);

 const prevMonth = () => {
 if (month === 0) { setMonth(11); setYear(y => y - 1); }
 else setMonth(m => m - 1);
 };
 const nextMonth = () => {
 if (month === 11) { setMonth(0); setYear(y => y + 1); }
 else setMonth(m => m + 1);
 };

 return (
 <div className="flex flex-col pb-10">
 {/* Header */}
 <div className="flex items-start justify-between mb-6">
 <div>
 <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">My Schedule</h1>
 <p className="text-[#64748b] text-[15px] mt-1">View your shifts and attendance schedule.</p>
 </div>
 <div className="flex space-x-3 mt-1">
 <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-[#e2e8f0] rounded-lg text-[#334155] font-medium text-sm hover:bg-gray-50 shadow-sm transition-all">
 <svg className="w-[18px] h-[18px] text-[#64748b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
 </svg>
 <span>Sync Calendar</span>
 </button>
 <button className="flex items-center space-x-2 px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg font-medium text-sm shadow-sm transition-all">
 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
 </svg>
 <span>Request Leave</span>
 </button>
 </div>
 </div>

 {/* Debug bar */}
 {debugInfo && (
 <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700 font-mono">
 🔍 {debugInfo}
 </div>
 )}

 {/* Calendar Box */}
 <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm">
 {/* Controls */}
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
 <div className="flex items-center bg-[#f8fafc] p-1 rounded-lg border border-[#e2e8f0]">
 <button className="px-4 py-1.5 text-sm font-semibold rounded-md bg-[#e0f2fe] text-[#0369a1] shadow-sm">Month</button>
 <button className="px-4 py-1.5 text-sm font-medium rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-all">Week</button>
 <button className="px-4 py-1.5 text-sm font-medium rounded-md text-[#64748b] hover:text-[#0f172a] hover:bg-white transition-all">Day</button>
 </div>
 </div>

 {loading && <div className="text-center py-10 text-sm opacity-60">Đang tải lịch làm việc...</div>}
 {error && (
 <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
 ⚠️ {error}
 </div>
 )}

 {/* Grid */}
 {!loading && (
 <div className="grid grid-cols-7 border-t border-l border-[#e2e8f0] rounded-xl overflow-hidden [&>*]:border-b [&>*]:border-r [&>*]:border-[#e2e8f0]">
 {["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((d) => (
 <div key={d} className="py-3 text-center text-xs font-bold text-[#94a3b8] bg-[#f8fafc]">{d}</div>
 ))}

 {leadingDays.map((d) => (
 <div key={`prev-${d}`} className="min-h-[90px] p-2 bg-[#f8fafc] text-[#c0ccd8]">
 <span className="text-sm font-medium ml-1">{d}</span>
 </div>
 ))}

 {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
 const dateKey = toDateKey(year, month, day);
 const daySchedules = scheduleMap.get(dateKey) ?? [];
 const isToday = dateKey === todayKey;

 return (
 <div key={day} className={`min-h-[100px] p-2 flex flex-col gap-1 transition-colors ${isToday ? "bg-[#f0fdf4]" : "hover:bg-[#fafafa]"}`}>
 <span className={`text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full mb-0.5 flex-shrink-0 ${isToday ? "bg-[#0d9488] text-white" : "text-[#1e293b]"}`}>
 {day}
 </span>
 {daySchedules.map((sch) => {
 if (!sch.shift) return null;
 const startHour = parseInt(sch.shift.startTime.slice(0, 2), 10);
 const isMorning = startHour < 12;
 return (
 <div
 key={sch.id}
 title={sch.shift.name}
 className={`text-[10px] font-bold py-1 px-1.5 rounded-md flex flex-col items-center justify-center text-center leading-tight mx-0.5
 ${isMorning
 ? "bg-[#fef9c3] text-[#854d0e]" /* sáng: vàng nhạt */
 : "bg-[#ccfbf1] text-[#0f766e]" /* chiều: xanh lá */
 }`}
 >
 <span className="opacity-70 text-[9px] font-semibold">{isMorning ? "☀️ Sáng" : "🌙 Chiều"}</span>
 <span>{sch.shift.startTime.slice(0, 5)} – {sch.shift.endTime.slice(0, 5)}</span>
 </div>
 );
 })}
 </div>
 );
 })}

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
