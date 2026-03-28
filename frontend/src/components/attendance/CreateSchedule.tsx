import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    getAllShifts,
    createSchedule,
    createBulkSchedules,
    deleteShift,
    deleteSchedule,
    deleteSchedulesByMonth,
    getMySchedules,
    updateSchedule,
    searchEmployeesForSchedule,
    type ShiftResponse,
    type WorkScheduleResponse,
    type ScheduleEmployee,
} from "../../services/attendanceService";
import { CreateShiftModal, ShiftCard, ResultBanner } from "./CreateScheduleComponents";

// ============================================================================
// KHU VỰC 1: KIỂU DỮ LIỆU & CẤU HÌNH (TYPES & CONFIG)
// ============================================================================
type Employee = ScheduleEmployee & { id: string };
type Tab = "single" | "bulk" | "shifts" | "manage";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

// Hàm format giờ (Ví dụ: "08:00:00" -> "08:00")
function formatTime(t: string) { return t.slice(0, 5); }

// Hàm lấy chữ cái đầu của tên để làm Avatar
function initials(name: string) {
    return name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
}

// ============================================================================
// KHU VỰC 2: CÁC COMPONENT PHỤ TRỢ (SUB-COMPONENTS)
// ============================================================================

// ─── 2.1. Component: Avatar ───
const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-8 h-8" }) => {
    const colors = ["bg-[#e0f2fe] text-[#0369a1]", "bg-[#fef9c3] text-[#854d0e]", "bg-[#f3e8ff] text-[#7c3aed]", "bg-[#fce7f3] text-[#be185d]", "bg-[#dcfce7] text-[#15803d]"];
    const c = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c}`}>
            {initials(name)}
        </div>
    );
};

// ─── 2.2. Component: Chọn 1 Nhân Viên (Cho Tab Single & Manage) ───
interface EmployeeSelectorProps {
    selectedEmployee: Employee | null;
    onSelect: (emp: Employee) => void;
}
const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ selectedEmployee, onSelect }) => {
    const [query, setQuery] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Tự động đóng dropdown khi click ra ngoài
    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Tìm kiếm nhân viên (Debounce 250ms)
    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const data = await searchEmployeesForSchedule(query || undefined, 0, 20);
                setEmployees(data.content);
            } catch { setEmployees([]); } finally { setLoading(false); }
        };
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <div ref={ref} className="relative">
            <label className="block text-sm font-semibold text-[#374151] mb-2">Employee</label>
            {selectedEmployee && !open ? (
                <button type="button" onClick={() => setOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#0d9488] bg-[#f0fdf4] text-left">
                    <Avatar name={selectedEmployee.fullName} />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#0f172a] text-sm truncate">{selectedEmployee.fullName}</div>
                        <div className="text-xs text-[#64748b] truncate">{selectedEmployee.employeeCode} · {selectedEmployee.deptName}</div>
                    </div>
                    <svg className="w-4 h-4 text-[#64748b] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
            ) : (
                <input type="text" autoFocus={open} value={query} placeholder="Search by name or employee code..." onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
            )}
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#f1f5f9]">
                        <input type="text" autoFocus value={query} placeholder="Search by name or employee code..." onChange={e => setQuery(e.target.value)} className="w-full text-sm text-[#0f172a] focus:outline-none placeholder-[#94a3b8]" />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {loading && <p className="px-4 py-3 text-sm text-[#94a3b8]">Loading...</p>}
                        {!loading && employees.length === 0 && <p className="px-4 py-3 text-sm text-[#94a3b8]">No results found.</p>}
                        {!loading && employees.map(emp => (
                            <button key={emp.id} type="button" onClick={() => { onSelect(emp); setOpen(false); setQuery(""); }} className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors text-left">
                                <Avatar name={emp.fullName} />
                                <div className="flex-1 min-w-0">
                                    <div className="font-semibold text-[#0f172a] text-sm truncate">{emp.fullName}</div>
                                    <div className="text-xs text-[#64748b] truncate">{emp.employeeCode} · {emp.deptName}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── 2.3. Component: Chọn Nhiều Nhân Viên (Cho Tab Bulk) ───
interface EmployeeMultiSelectorProps {
    selectedIds: Set<string>;
    onToggle: (emp: Employee) => void;
    onSelectAll: (employees: Employee[]) => void;
    onDeselectAll: () => void;
}
const EmployeeMultiSelector: React.FC<EmployeeMultiSelectorProps> = ({ selectedIds, onToggle, onSelectAll, onDeselectAll }) => {
    const [query, setQuery] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const data = await searchEmployeesForSchedule(q || undefined, 0, 50);
            setEmployees(data.content);
        } catch { setEmployees([]); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(query), 250);
        return () => clearTimeout(t);
    }, [query, load]);

    const allSelected = employees.length > 0 && employees.every(e => selectedIds.has(e.id));

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#374151]">
                    Select Employees
                    {selectedIds.size > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#0d9488]/10 text-[#0d9488] text-xs font-bold">{selectedIds.size} selected</span>}
                </label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => allSelected ? onDeselectAll() : onSelectAll(employees)} className="text-xs font-semibold text-[#0d9488] hover:underline transition-all">
                        {allSelected ? "Deselect All" : "Select All"}
                    </button>
                    {selectedIds.size > 0 && (
                        <button type="button" onClick={onDeselectAll} className="text-xs font-semibold text-[#ef4444] hover:underline transition-all">Clear</button>
                    )}
                </div>
            </div>
            <div className="relative mb-2">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
            </div>
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {loading && <p className="px-4 py-3 text-sm text-[#94a3b8]">Loading...</p>}
                {!loading && employees.length === 0 && <p className="px-4 py-3 text-sm text-[#94a3b8]">No employees found.</p>}
                {!loading && employees.map((emp, idx) => {
                    const checked = selectedIds.has(emp.id);
                    return (
                        <label key={emp.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none ${idx !== employees.length - 1 ? "border-b border-[#f1f5f9]" : ""} ${checked ? "bg-[#f0fdf4]" : "hover:bg-[#f8fafc]"}`}>
                            <input type="checkbox" checked={checked} onChange={() => onToggle(emp)} className="w-4 h-4 rounded border-2 border-gray-300 text-[#0d9488] focus:ring-0 focus:ring-offset-0 accent-teal-600 cursor-pointer flex-shrink-0" />
                            <Avatar name={emp.fullName} />
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm truncate ${checked ? "text-[#0f766e]" : "text-[#0f172a]"}`}>{emp.fullName}</div>
                                <div className="text-xs text-[#64748b] truncate">{emp.employeeCode} · {emp.deptName}</div>
                            </div>
                            {checked && <svg className="w-4 h-4 text-[#0d9488] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>}
                        </label>
                    );
                })}
            </div>
        </div>
    );
};


// ============================================================================
// KHU VỰC 3: MAIN COMPONENT (CREATE SCHEDULE) & STATE MANAGEMENT
// ============================================================================
const CreateSchedule: React.FC = () => {
    const today = new Date();

    // ─── 3.1. States Toàn cục & Các Tab ───
    const [tab, setTab] = useState<Tab>("single");
    const [shifts, setShifts] = useState<ShiftResponse[]>([]);
    const [shiftsLoading, setShiftsLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    // ─── 3.2. States của Tab: Single ───
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [singleDate, setSingleDate] = useState(today.toISOString().slice(0, 10));
    const [singleShiftId, setSingleShiftId] = useState("");

    // ─── 3.3. States của Tab: Bulk ───
    const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
    const [selectedBulkEmployees, setSelectedBulkEmployees] = useState<Map<string, Employee>>(new Map());
    const [bulkStart, setBulkStart] = useState(today.toISOString().slice(0, 10));
    const [bulkEnd, setBulkEnd] = useState(today.toISOString().slice(0, 10));
    const [bulkShiftId, setBulkShiftId] = useState("");

    // ─── 3.4. States của Tab: Shifts (Quản lý các loại Ca) ───
    const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);
    const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
    const [shiftDeleteError, setShiftDeleteError] = useState<string | null>(null);

    // ─── 3.5. States của Tab: Manage (Quản lý Lịch đã xếp) ───
    const [manageEmployee, setManageEmployee] = useState<Employee | null>(null);
    const [manageMonth, setManageMonth] = useState(today.getMonth() + 1);
    const [manageYear, setManageYear] = useState(today.getFullYear());
    const [manageSchedules, setManageSchedules] = useState<WorkScheduleResponse[]>([]);
    const [manageLoading, setManageLoading] = useState(false);
    const [manageError, setManageError] = useState<string | null>(null);
    const [deletingScheduleId, setDeletingScheduleId] = useState<string | null>(null);
    const [deletingAll, setDeletingAll] = useState(false);
    const [updatingScheduleId, setUpdatingScheduleId] = useState<string | null>(null);
    const [updatingShiftId, setUpdatingShiftId] = useState<string>("");
    const [updatingLoading, setUpdatingLoading] = useState(false);


    // ============================================================================
    // KHU VỰC 4: LOGIC TẢI DỮ LIỆU CHẠY NGẦM (EFFECTS)
    // ============================================================================
    // Tự động load danh sách các Ca làm (Shifts) khi vào màn hình
    useEffect(() => {
        getAllShifts()
            .then(allShifts => setShifts(allShifts))
            .catch(() => { })
            .finally(() => setShiftsLoading(false));
    }, []);


    // ============================================================================
    // KHU VỰC 5: XỬ LÝ SỰ KIỆN NÚT BẤM (ACTION HANDLERS)
    // ============================================================================

    // ─── 5.1. Nút bấm ở Tab: Bulk ───
    const toggleBulkEmployee = (emp: Employee) => {
        setSelectedBulkIds(prev => { const next = new Set(prev); if (next.has(emp.id)) next.delete(emp.id); else next.add(emp.id); return next; });
        setSelectedBulkEmployees(prev => { const next = new Map(prev); if (next.has(emp.id)) next.delete(emp.id); else next.set(emp.id, emp); return next; });
    };

    const selectAllBulk = (employees: Employee[]) => {
        setSelectedBulkIds(prev => { const next = new Set(prev); employees.forEach(e => next.add(e.id)); return next; });
        setSelectedBulkEmployees(prev => { const next = new Map(prev); employees.forEach(e => next.set(e.id, e)); return next; });
    };

    const deselectAllBulk = () => { setSelectedBulkIds(new Set()); setSelectedBulkEmployees(new Map()); };

    // ─── 5.2. 🔴 NÚT SUBMIT TỔNG (Dành cho cả Single và Bulk) ───
    const handleSubmit = async () => {
        setError(null); setSuccessCount(null); setSubmitting(true);
        try {
            if (tab === "single") {
                if (!selectedEmployee) throw new Error("Please select an employee.");
                if (!singleShiftId) throw new Error("Please select a shift.");
                await createSchedule({ employeeId: selectedEmployee.id, date: singleDate, shiftId: singleShiftId });
                setSuccessCount(1);
            } else if (tab === "bulk") {
                if (selectedBulkIds.size === 0) throw new Error("Please select at least 1 employee.");
                if (!bulkShiftId) throw new Error("Please select a shift.");
                const results = await Promise.all(
                    Array.from(selectedBulkIds).map(empId =>
                        createBulkSchedules({ employeeId: empId, startDate: bulkStart, endDate: bulkEnd, shiftId: bulkShiftId })
                    )
                );
                setSuccessCount(results.reduce((sum, r) => sum + r.length, 0));
            }
        } catch (err: any) { setError(err?.response?.data?.message ?? err.message ?? "An unknown error occurred."); }
        finally { setSubmitting(false); }
    };

    // ─── 5.3. Nút bấm ở Tab: Shifts (Xóa Ca làm) ───
    const handleDeleteShift = async (shiftId: string) => {
        setShiftDeleteError(null); setDeletingShiftId(shiftId);
        try {
            await deleteShift(shiftId);
            setShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (err: any) { setShiftDeleteError(err?.response?.data?.message ?? err.message ?? "Failed to delete shift."); }
        finally { setDeletingShiftId(null); }
    };

    // ─── 5.4. Nút bấm ở Tab: Manage (Tải, Xóa, Sửa Lịch) ───
    const loadManageSchedules = useCallback(async () => {
        if (!manageEmployee) return;
        setManageLoading(true); setManageError(null);
        try {
            const data = await getMySchedules(manageEmployee.id, manageMonth, manageYear);
            setManageSchedules(data);
        } catch (err: any) { setManageError(err?.response?.data?.message ?? err.message ?? "Failed to load schedules."); }
        finally { setManageLoading(false); }
    }, [manageEmployee, manageMonth, manageYear]);

    const handleDeleteSchedule = async (scheduleId: string) => {
        setDeletingScheduleId(scheduleId);
        try {
            await deleteSchedule(scheduleId);
            setManageSchedules(prev => prev.filter(s => s.id !== scheduleId));
        } catch (err: any) { setManageError(err?.response?.data?.message ?? err.message ?? "Failed to delete schedule."); }
        finally { setDeletingScheduleId(null); }
    };

    const handleUpdateSchedule = async (scheduleId: string) => {
        if (!updatingShiftId) return;
        setUpdatingLoading(true); setManageError(null);
        try {
            const updated = await updateSchedule(scheduleId, updatingShiftId);
            setManageSchedules(prev => prev.map(s => s.id === scheduleId ? updated : s));
            setUpdatingScheduleId(null);
        } catch (err: any) { setManageError(err?.response?.data?.message ?? err.message ?? "Failed to update schedule."); }
        finally { setUpdatingLoading(false); }
    };

    const handleDeleteAllSchedules = async () => {
        if (!manageEmployee) return;
        const confirmed = window.confirm(`Are you sure you want to delete ALL ${manageSchedules.length} schedule(s) for ${manageEmployee.fullName} in ${MONTH_NAMES[manageMonth - 1]} ${manageYear}?`);
        if (!confirmed) return;

        setDeletingAll(true); setManageError(null);
        try {
            await deleteSchedulesByMonth(manageEmployee.id, manageMonth, manageYear);
            setManageSchedules([]);
        } catch (err: any) { setManageError(err?.response?.data?.message ?? err.message ?? "Failed to delete all schedules."); }
        finally { setDeletingAll(false); }
    };


    // ============================================================================
    // KHU VỰC 6: CHUẨN BỊ GIAO DIỆN (UI RENDER HELPERS)
    // ============================================================================
    const tabBtn = (id: Tab, label: string, icon: string) => (
        <button onClick={() => { setTab(id); setError(null); setSuccessCount(null); setShiftDeleteError(null); setManageError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? "bg-[#0d9488] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"}`}>
            <span>{icon}</span><span>{label}</span>
        </button>
    );

    const ShiftSelector = ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
        <div>
            <label className="block text-sm font-semibold text-[#374151] mb-3">Select Shift</label>
            {shiftsLoading
                ? <p className="text-sm text-[#94a3b8]">Loading shifts...</p>
                : shifts.length === 0
                    ? <p className="text-sm text-[#94a3b8]">No shifts available.</p>
                    : <div className="grid grid-cols-2 gap-3">
                        {shifts.map(sh => (
                            <ShiftCard key={sh.id} shift={sh} selected={value === sh.id} onClick={() => onChange(sh.id)} />
                        ))}
                    </div>
            }
        </div>
    );


    // ============================================================================
    // KHU VỰC 7: VẼ GIAO DIỆN CHÍNH (RENDER JSX)
    // ============================================================================
    return (
        <div className="flex flex-col pb-10 max-w-3xl">

            {/* ── Tiêu đề ── */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Create Schedule</h1>
            </div>

            {/* ── Modal TẠO CA MỚI (chỉ hiện khi bấm nút +) ── */}
            {showCreateShiftModal && (
                <CreateShiftModal
                    onClose={() => setShowCreateShiftModal(false)}
                    onCreated={(newShift) => { setShifts(prev => [...prev, newShift]); setShowCreateShiftModal(false); }}
                />
            )}

            {/* ── Thanh chuyển Tab ── */}
            <div className="flex items-center gap-2 mb-6 p-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl w-fit">
                {tabBtn("single", "Single", "📅")}
                {tabBtn("bulk", "Bulk", "⚡")}
                {tabBtn("shifts", "Shifts", "🕐")}
                {tabBtn("manage", "Manage", "🔍")}
            </div>

            {/* ── Banner Thông báo Toàn cục ── */}
            {successCount !== null && <ResultBanner count={successCount} onClose={() => setSuccessCount(null)} />}
            {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
                    <span className="text-lg leading-none flex-shrink-0">⚠️</span><span>{error}</span>
                </div>
            )}

            {/* ── KHUNG NỘI DUNG CHÍNH ── */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">

                {/* --- 7.1. NỘI DUNG TAB: SINGLE --- */}
                {tab === "single" && (
                    <>
                        <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div>
                                    <label className="block text-sm font-semibold text-[#374151] mb-2">Work Date</label>
                                    <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                                </div>
                                <ShiftSelector value={singleShiftId} onChange={setSingleShiftId} />
                            </>
                        )}
                    </>
                )}

                {/* --- 7.2. NỘI DUNG TAB: BULK --- */}
                {tab === "bulk" && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#374151] mb-2">Start Date</label>
                                <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#374151] mb-2">End Date</label>
                                <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                            </div>
                        </div>
                        <div className="border-t border-[#f1f5f9]" />
                        <EmployeeMultiSelector selectedIds={selectedBulkIds} onToggle={toggleBulkEmployee} onSelectAll={selectAllBulk} onDeselectAll={deselectAllBulk} />

                        {selectedBulkIds.size > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {Array.from(selectedBulkEmployees.values()).map(emp => (
                                    <span key={emp.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#f0fdf4] border border-[#86efac] rounded-full text-xs font-semibold text-[#15803d]">
                                        {emp.fullName}
                                        <button type="button" onClick={() => toggleBulkEmployee(emp)} className="text-[#15803d] hover:text-red-500 font-bold leading-none">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <div className="border-t border-[#f1f5f9]" />
                        <ShiftSelector value={bulkShiftId} onChange={setBulkShiftId} />
                    </>
                )}

                {/* --- 7.3. NỘI DUNG TAB: SHIFTS --- */}
                {tab === "shifts" && (
                    <>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold text-[#374151]">All Shifts <span className="ml-2 text-xs font-normal text-[#94a3b8]">({shifts.length})</span></label>
                            <button type="button" onClick={() => setShowCreateShiftModal(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0d9488] text-white text-xs font-bold hover:bg-[#0f766e] transition-all">
                                <span>+</span> New Shift
                            </button>
                        </div>
                        {shiftDeleteError && (
                            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                <span>⚠️</span><span>{shiftDeleteError}</span>
                                <button onClick={() => setShiftDeleteError(null)} className="ml-auto text-red-500 font-bold">×</button>
                            </div>
                        )}
                        {shiftsLoading ? <p className="text-sm text-[#94a3b8]">Loading...</p> : shifts.length === 0 ? <div className="text-center py-8 text-[#94a3b8] text-sm">No shifts yet. Create one above.</div> :
                            <div className="flex flex-col gap-2">
                                {shifts.map(sh => {
                                    const isDeleting = deletingShiftId === sh.id;
                                    return (
                                        <div key={sh.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#e2e8f0] bg-white hover:border-[#cbd5e1] transition-colors">
                                            <div className="flex-1 min-w-0">
                                                <p className="font-semibold text-sm text-[#0f172a]">{sh.name}</p>
                                                <p className="text-xs text-[#64748b]">{formatTime(sh.startTime)} – {formatTime(sh.endTime)}</p>
                                            </div>
                                            <button type="button" onClick={() => handleDeleteShift(sh.id)} disabled={isDeleting} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-all">
                                                {isDeleting ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : "🗑️"}
                                                {isDeleting ? "Deleting..." : "Delete"}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        }
                    </>
                )}

                {/* --- 7.4. NỘI DUNG TAB: MANAGE --- */}
                {tab === "manage" && (
                    <>
                        <EmployeeSelector selectedEmployee={manageEmployee} onSelect={(emp) => { setManageEmployee(emp); setManageSchedules([]); setManageError(null); }} />
                        {manageEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div className="flex items-end gap-3">
                                    <div className="flex-1">
                                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Month</label>
                                        <select value={manageMonth} onChange={e => setManageMonth(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] bg-white transition-all">
                                            {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div className="w-28">
                                        <label className="block text-xs font-semibold text-[#374151] mb-1.5">Year</label>
                                        <select value={manageYear} onChange={e => setManageYear(Number(e.target.value))} className="w-full px-3 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] bg-white transition-all">
                                            {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={loadManageSchedules} disabled={manageLoading} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 text-white font-semibold text-sm transition-all">
                                        {manageLoading ? <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : "🔍"}
                                        Load
                                    </button>
                                </div>
                                {manageError && (
                                    <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                        <span>⚠️</span><span>{manageError}</span>
                                        <button onClick={() => setManageError(null)} className="ml-auto text-red-500 font-bold">×</button>
                                    </div>
                                )}
                                {!manageLoading && manageSchedules.length > 0 && (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-[#374151]">{MONTH_NAMES[manageMonth - 1]} {manageYear} <span className="ml-2 text-xs font-normal text-[#94a3b8]">({manageSchedules.length} schedule{manageSchedules.length !== 1 ? "s" : ""})</span></p>
                                            <button type="button" onClick={handleDeleteAllSchedules} disabled={deletingAll || manageSchedules.length === 0} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm">
                                                {deletingAll ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : "🗑️"}
                                                {deletingAll ? "Deleting..." : "Delete All"}
                                            </button>
                                        </div>
                                        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
                                            {manageSchedules.map(sch => {
                                                if (!sch.shift) return null;
                                                const isDeleting = deletingScheduleId === sch.id;
                                                const dateObj = new Date(sch.date + "T00:00:00");
                                                const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][dateObj.getDay()];
                                                return (
                                                    <div key={sch.id} className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#e2e8f0] bg-white hover:border-[#cbd5e1] transition-colors">
                                                        <div className="flex-shrink-0 text-center w-10">
                                                            <p className="text-xs font-bold text-[#94a3b8] uppercase">{dayName}</p>
                                                            <p className="text-lg font-bold text-[#0f172a] leading-tight">{dateObj.getDate()}</p>
                                                        </div>
                                                        <div className="w-px h-8 bg-[#e2e8f0] flex-shrink-0" />
                                                        {updatingScheduleId === sch.id ? (
                                                            <div className="flex-1 min-w-0 pr-4">
                                                                <select value={updatingShiftId} onChange={e => setUpdatingShiftId(e.target.value)} className="w-full px-2 py-1 flex-1 rounded-lg border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 transition-all bg-white">
                                                                    <option value="" disabled>Select Shift</option>
                                                                    {shifts.map(sh => <option key={sh.id} value={sh.id}>{sh.name} ({formatTime(sh.startTime)}-{formatTime(sh.endTime)})</option>)}
                                                                </select>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 min-w-0">
                                                                <p className="font-semibold text-sm text-[#0f172a] flex items-center gap-1.5">{sch.shift.name}</p>
                                                                <p className="text-xs text-[#64748b]">{formatTime(sch.shift.startTime)} – {formatTime(sch.shift.endTime)}</p>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {updatingScheduleId === sch.id ? (
                                                                <>
                                                                    <button type="button" onClick={() => handleUpdateSchedule(sch.id)} disabled={updatingLoading || !updatingShiftId} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 transition-all">{updatingLoading ? "..." : "Save"}</button>
                                                                    <button type="button" onClick={() => setUpdatingScheduleId(null)} disabled={updatingLoading} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#64748b] border border-[#e2e8f0] hover:bg-[#f1f5f9] disabled:opacity-50 transition-all">Cancel</button>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <button type="button" onClick={() => { setUpdatingScheduleId(sch.id); setUpdatingShiftId(sch.shift.id); }} disabled={isDeleting} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#0d9488] border border-[#0d9488]/30 hover:bg-[#0d9488]/10 disabled:opacity-50 transition-all" title="Change Shift">✏️</button>
                                                                    <button type="button" onClick={() => handleDeleteSchedule(sch.id)} disabled={isDeleting} className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 disabled:opacity-50 transition-all">
                                                                        {isDeleting ? <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg> : "🗑️"}
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </>
                                )}
                                {!manageLoading && manageSchedules.length === 0 && manageEmployee && (
                                    <div className="text-center py-8 text-[#94a3b8] text-sm">No schedules found. Try loading a different month.</div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* --- 7.5. NÚT SUBMIT TỔNG (Dành cho Single, Bulk, Clone) --- */}
                {(tab === "bulk" || (selectedEmployee && tab !== "shifts" && tab !== "manage")) && (
                    <div className="pt-2">
                        <button onClick={handleSubmit} disabled={submitting} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                            {submitting ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                                    Processing {tab === "bulk" ? `${selectedBulkIds.size} employee(s)` : ""}...
                                </>
                            ) : tab === "single" ? "📅 Create Schedule" : `⚡ Create Bulk${selectedBulkIds.size > 0 ? ` (${selectedBulkIds.size})` : ""}`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateSchedule;