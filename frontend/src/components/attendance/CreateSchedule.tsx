import React, { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../../services/apiClient";
import {
    getAllShifts, createSchedule, createBulkSchedules, cloneScheduleFromPreviousMonth,
    createShift, deleteShift, deleteSchedule, deleteSchedulesByMonth,
    getMySchedules, updateSchedule, type ShiftResponse, type WorkScheduleResponse,
} from "../../services/attendanceService";
import type { PageResponse } from "../../types";

// ============================================================================
// KHU VỰC 1: TYPE DEFINITIONS (Khai báo kiểu dữ liệu)
// ============================================================================
interface AttendanceEmployee {
    id: string;
    fullName: string;
    employeeCode: string;
    deptName: string;
}
type Employee = AttendanceEmployee;
type Tab = "single" | "bulk" | "clone" | "shifts" | "manage";

// ============================================================================
// KHU VỰC 2: HELPER FUNCTIONS (Hàm công cụ độc lập)
// ============================================================================
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
function formatTime(t: string) { return t.slice(0, 5); }

// Lấy 2 chữ cái đầu của tên để làm Avatar (VD: Lê Đức -> LĐ)
function initials(name: string) {
    return name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
}

// ============================================================================
// KHU VỰC 3: SHARED UI COMPONENTS (Các Component vệ tinh dùng chung)
// ============================================================================

// 3.1. Avatar tròn có màu ngẫu nhiên
const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-8 h-8" }) => {
    const colors = ["bg-[#e0f2fe] text-[#0369a1]", "bg-[#fef9c3] text-[#854d0e]", "bg-[#f3e8ff] text-[#7c3aed]", "bg-[#fce7f3] text-[#be185d]", "bg-[#dcfce7] text-[#15803d]"];
    const c = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c}`}>
            {initials(name)}
        </div>
    );
};

// 3.2. Thẻ hiển thị Ca làm việc (Shift)
const ShiftCard: React.FC<{ shift: ShiftResponse; selected: boolean; onClick: () => void }> = ({ shift, selected, onClick }) => {
    return (
        <button type="button" onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer ${selected ? "border-[#0d9488] bg-[#ccfbf1]" : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}
        >
            <div className="flex items-center gap-2 mb-0.5">
                <span className="font-bold text-[13px] text-[#0f172a]">{shift.name}</span>
                {selected && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </span>
                )}
            </div>
            <p className="text-[12px] text-[#64748b] font-medium">{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</p>
        </button>
    );
};

// 3.3. Dải băng thông báo Thành công (Màu xanh)
const ResultBanner: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 mb-6">
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        <span className="font-semibold">Success! Created {count} schedule(s).</span>
        <button onClick={onClose} className="ml-auto text-green-700 hover:text-green-900 font-bold text-lg leading-none">×</button>
    </div>
);

// ============================================================================
// KHU VỰC 4: COMPLEX SUB-COMPONENTS (Các Component tìm kiếm & Form)
// ============================================================================

// 4.1. Ô tìm kiếm & Chọn 1 Nhân viên (Dùng cho tab Single, Clone, Manage)
interface EmployeeSelectorProps { selectedEmployee: Employee | null; onSelect: (emp: Employee) => void; }
const EmployeeSelector: React.FC<EmployeeSelectorProps> = ({ selectedEmployee, onSelect }) => {
    // ... (Giữ nguyên logic bên trong EmployeeSelector của bạn)
    const [query, setQuery] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await apiClient.get<PageResponse<Employee>>("/api/v1/attendance/work-schedules/employees", {
                    params: { page: 0, size: 20, search: query || undefined },
                });
                setEmployees(res.data.content);
            } catch { setEmployees([]); } finally { setLoading(false); }
        };
        const t = setTimeout(load, 250); // Debounce chống spam API
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
                </button>
            ) : (
                <input type="text" autoFocus={open} value={query} placeholder="Search by name or employee code..." onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }} className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
            )}
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden">
                    {/* Danh sách xổ xuống... */}
                    <div className="max-h-56 overflow-y-auto">
                        {loading && <p className="px-4 py-3 text-sm text-[#94a3b8]">Loading...</p>}
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

// 4.2. Khung Checkbox Chọn nhiều Nhân viên (Dùng cho tab Bulk)
interface EmployeeMultiSelectorProps { selectedIds: Set<string>; onToggle: (emp: Employee) => void; onSelectAll: (employees: Employee[]) => void; onDeselectAll: () => void; }
const EmployeeMultiSelector: React.FC<EmployeeMultiSelectorProps> = ({ selectedIds, onToggle, onSelectAll, onDeselectAll }) => {
    // ... (Giữ nguyên logic của EmployeeMultiSelector)
    const [query, setQuery] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(false);

    const load = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const res = await apiClient.get<PageResponse<Employee>>("/api/v1/attendance/work-schedules/employees", { params: { page: 0, size: 50, search: q || undefined } });
            setEmployees(res.data.content);
        } catch { setEmployees([]); } finally { setLoading(false); }
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(query), 250);
        return () => clearTimeout(t);
    }, [query, load]);

    const allSelected = employees.length > 0 && employees.every(e => selectedIds.has(e.id));

    return (
        <div>
            {/* Header có nút Select All / Clear */}
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-[#374151]">
                    Select Employees {selectedIds.size > 0 && <span className="ml-2 px-2 py-0.5 rounded-full bg-[#0d9488]/10 text-[#0d9488] text-xs font-bold">{selectedIds.size} selected</span>}
                </label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => allSelected ? onDeselectAll() : onSelectAll(employees)} className="text-xs font-semibold text-[#0d9488] hover:underline">
                        {allSelected ? "Deselect All" : "Select All"}
                    </button>
                    {selectedIds.size > 0 && <button type="button" onClick={onDeselectAll} className="text-xs font-semibold text-[#ef4444] hover:underline">Clear</button>}
                </div>
            </div>

            {/* Ô tìm kiếm */}
            <div className="relative mb-2">
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..." className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488]" />
            </div>

            {/* Danh sách Checkbox */}
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {!loading && employees.map((emp, idx) => {
                    const checked = selectedIds.has(emp.id);
                    return (
                        <label key={emp.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer select-none ${idx !== employees.length - 1 ? "border-b border-[#f1f5f9]" : ""} ${checked ? "bg-[#f0fdf4]" : "hover:bg-[#f8fafc]"}`}>
                            <input type="checkbox" checked={checked} onChange={() => onToggle(emp)} className="w-4 h-4 rounded border-2 border-gray-300 text-[#0d9488] focus:ring-0 accent-teal-600 cursor-pointer flex-shrink-0" />
                            <Avatar name={emp.fullName} />
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm truncate ${checked ? "text-[#0f766e]" : "text-[#0f172a]"}`}>{emp.fullName}</div>
                                <div className="text-xs text-[#64748b] truncate">{emp.employeeCode} · {emp.deptName}</div>
                            </div>
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

// 4.3. Popup Modal Tạo Ca Làm Việc Mới (Dùng cho tab Shifts)
interface CreateShiftModalProps { onClose: () => void; onCreated: (shift: ShiftResponse) => void; }
const CreateShiftModal: React.FC<CreateShiftModalProps> = ({ onClose, onCreated }) => {
    // ... (Giữ nguyên logic form Modal)
    const [name, setName] = useState("");
    const [startTime, setStartTime] = useState("08:00");
    const [endTime, setEndTime] = useState("17:00");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSave = async () => {
        setError(null);
        if (!name.trim()) { setError("Shift name is required."); return; }
        if (!startTime || !endTime) { setError("Time is required."); return; }
        setSaving(true);
        try {
            const created = await createShift({ name: name.trim(), startTime, endTime });
            onCreated(created);
        } catch (err: any) { setError(err?.response?.data?.message ?? err.message ?? "Failed to create shift."); } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5" onClick={e => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="flex items-center justify-between">
                    <h2 className="text-[17px] font-bold text-[#0f172a]">Create New Shift</h2>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f1f5f9]">×</button>
                </div>
                {error && <div className="text-xs text-red-700 bg-red-50 p-2 rounded">{error}</div>}

                {/* Form Inputs */}
                <div className="flex flex-col gap-4">
                    <div>
                        <label className="block text-xs font-semibold mb-1">Shift Name</label>
                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold mb-1">Start</label>
                            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold mb-1">End</label>
                            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full px-3 py-2 border rounded-xl" />
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-1">
                    <button type="button" onClick={onClose} className="flex-1 border rounded-xl py-2">Cancel</button>
                    <button type="button" onClick={handleSave} disabled={saving} className="flex-1 bg-[#0d9488] text-white rounded-xl py-2 disabled:opacity-50">{saving ? "Saving..." : "Create"}</button>
                </div>
            </div>
        </div>
    );
};

// ============================================================================
// KHU VỰC 5: MAIN COMPONENT - TRẠM KIỂM SOÁT TRUNG TÂM
// ============================================================================
const CreateSchedule: React.FC = () => {
    const today = new Date();

    // ─── 5.1 STATE QUẢN LÝ TAB & GLOBAL ─────────────────────────────────────
    const [tab, setTab] = useState<Tab>("single");
    const [shifts, setShifts] = useState<ShiftResponse[]>([]);
    const [shiftsLoading, setShiftsLoading] = useState(true);

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);
    const [showCreateShiftModal, setShowCreateShiftModal] = useState(false);

    // ─── 5.2 STATE CỦA TỪNG TAB RIÊNG BIỆT ──────────────────────────────────

    // TAB SINGLE & CLONE
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
    const [singleDate, setSingleDate] = useState(today.toISOString().slice(0, 10));
    const [singleShiftId, setSingleShiftId] = useState("");
    const [cloneTargetMonth, setCloneTargetMonth] = useState(today.getMonth() + 1);
    const [cloneTargetYear, setCloneTargetYear] = useState(today.getFullYear());

    // TAB BULK
    const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
    const [selectedBulkEmployees, setSelectedBulkEmployees] = useState<Map<string, Employee>>(new Map());
    const [bulkStart, setBulkStart] = useState(today.toISOString().slice(0, 10));
    const [bulkEnd, setBulkEnd] = useState(today.toISOString().slice(0, 10));
    const [bulkShiftId, setBulkShiftId] = useState("");

    // TAB SHIFTS
    const [deletingShiftId, setDeletingShiftId] = useState<string | null>(null);
    const [shiftDeleteError, setShiftDeleteError] = useState<string | null>(null);

    // TAB MANAGE
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

    // ─── 5.3 LIFECYCLE (Khởi tạo dữ liệu) ───────────────────────────────────
    useEffect(() => {
        getAllShifts()
            .then(allShifts => setShifts(allShifts))
            .catch(() => { })
            .finally(() => setShiftsLoading(false));
    }, []);

    // ─── 5.4 EVENT HANDLERS (Xử lý Logic Các Tab) ───────────────────────────

    // Handlers Tab Bulk
    const toggleBulkEmployee = (emp: Employee) => {
        setSelectedBulkIds(prev => { const next = new Set(prev); if (next.has(emp.id)) next.delete(emp.id); else next.add(emp.id); return next; });
        setSelectedBulkEmployees(prev => { const next = new Map(prev); if (next.has(emp.id)) next.delete(emp.id); else next.set(emp.id, emp); return next; });
    };
    const selectAllBulk = (employees: Employee[]) => {
        setSelectedBulkIds(prev => { const next = new Set(prev); employees.forEach(e => next.add(e.id)); return next; });
        setSelectedBulkEmployees(prev => { const next = new Map(prev); employees.forEach(e => next.set(e.id, e)); return next; });
    };
    const deselectAllBulk = () => { setSelectedBulkIds(new Set()); setSelectedBulkEmployees(new Map()); };

    // Handler Khổng Lồ: Nút Submit Chung
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
                    Array.from(selectedBulkIds).map(empId => createBulkSchedules({ employeeId: empId, startDate: bulkStart, endDate: bulkEnd, shiftId: bulkShiftId }))
                );
                setSuccessCount(results.reduce((sum, r) => sum + r.length, 0));
            } else { // tab clone
                if (!selectedEmployee) throw new Error("Please select an employee.");
                const result = await cloneScheduleFromPreviousMonth(selectedEmployee.id, cloneTargetMonth, cloneTargetYear);
                setSuccessCount(result.length);
            }
        } catch (err: any) { setError(err?.response?.data?.message ?? err.message ?? "An unknown error occurred."); }
        finally { setSubmitting(false); }
    };

    // Handlers Tab Manage
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
        const confirmed = window.confirm(`Are you sure you want to delete ALL schedules?`);
        if (!confirmed) return;
        setDeletingAll(true); setManageError(null);
        try {
            await deleteSchedulesByMonth(manageEmployee.id, manageMonth, manageYear);
            setManageSchedules([]);
        } catch (err: any) { setManageError(err?.response?.data?.message ?? err.message ?? "Failed to delete all."); }
        finally { setDeletingAll(false); }
    };

    // Handlers Tab Shifts
    const handleDeleteShift = async (shiftId: string) => {
        setShiftDeleteError(null); setDeletingShiftId(shiftId);
        try {
            await deleteShift(shiftId);
            setShifts(prev => prev.filter(s => s.id !== shiftId));
        } catch (err: any) { setShiftDeleteError(err?.response?.data?.message ?? err.message ?? "Failed to delete shift."); }
        finally { setDeletingShiftId(null); }
    };

    // ─── 5.5 RENDER HELPERS (Hàm phụ hỗ trợ vẽ HTML) ────────────────────────
    const tabBtn = (id: Tab, label: string, icon: string) => (
        <button onClick={() => { setTab(id); setError(null); setSuccessCount(null); setShiftDeleteError(null); setManageError(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${tab === id ? "bg-[#0d9488] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"}`}>
            <span>{icon}</span><span>{label}</span>
        </button>
    );

    const ShiftSelector = ({ value, onChange }: { value: string; onChange: (id: string) => void }) => (
        <div>
            <label className="block text-sm font-semibold text-[#374151] mb-3">Select Shift</label>
            {shiftsLoading ? <p className="text-sm text-[#94a3b8]">Loading shifts...</p>
                : shifts.length === 0 ? <p className="text-sm text-[#94a3b8]">No shifts available.</p>
                : <div className="grid grid-cols-2 gap-3">
                    {shifts.map(sh => <ShiftCard key={sh.id} shift={sh} selected={value === sh.id} onClick={() => onChange(sh.id)} />)}
                  </div>
            }
        </div>
    );

    // ─── 5.6 MAIN RENDER (Vẽ Giao Diện Chính Theo Từng Tab) ──────────────────
    return (
        <div className="flex flex-col pb-10 max-w-3xl">
            {/* Tiêu đề & Cấu hình Modal */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Create Schedule</h1>
            </div>
            {showCreateShiftModal && <CreateShiftModal onClose={() => setShowCreateShiftModal(false)} onCreated={(newShift) => { setShifts(prev => [...prev, newShift]); setShowCreateShiftModal(false); }} />}

            {/* Thanh Menu 5 Tabs */}
            <div className="flex items-center gap-2 mb-6 p-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl w-fit">
                {tabBtn("single", "Single", "📅")}
                {tabBtn("bulk", "Bulk", "⚡")}
                {tabBtn("clone", "Clone Previous", "📋")}
                {tabBtn("shifts", "Shifts", "🕐")}
                {tabBtn("manage", "Manage", "🔍")}
            </div>

            {/* Hiển thị Thông báo chung */}
            {successCount !== null && <ResultBanner count={successCount} onClose={() => setSuccessCount(null)} />}
            {error && <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">⚠️ {error}</div>}

            {/* Vùng Khung Trắng Chứa Nội Dung Từng Tab */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">

                {/* ======= GIAO DIỆN TAB 1: SINGLE ======= */}
                {tab === "single" && (
                    <>
                        <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div>
                                    <label className="block text-sm font-semibold mb-2">Work Date</label>
                                    <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)} className="w-full px-4 py-2 border rounded-xl" />
                                </div>
                                <ShiftSelector value={singleShiftId} onChange={setSingleShiftId} />
                            </>
                        )}
                    </>
                )}

                {/* ======= GIAO DIỆN TAB 2: BULK ======= */}
                {tab === "bulk" && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-semibold mb-2">Start Date</label><input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)} className="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label className="block text-sm font-semibold mb-2">End Date</label><input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)} className="w-full px-4 py-2 border rounded-xl" /></div>
                        </div>
                        <div className="border-t border-[#f1f5f9]" />
                        <EmployeeMultiSelector selectedIds={selectedBulkIds} onToggle={toggleBulkEmployee} onSelectAll={selectAllBulk} onDeselectAll={deselectAllBulk} />
                        <div className="border-t border-[#f1f5f9]" />
                        <ShiftSelector value={bulkShiftId} onChange={setBulkShiftId} />
                    </>
                )}

                {/* ======= GIAO DIỆN TAB 3: CLONE ======= */}
                {tab === "clone" && (
                    <>
                        <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div>
                                    <label className="block text-sm font-semibold mb-3">Target Month</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <select value={cloneTargetMonth} onChange={e => setCloneTargetMonth(Number(e.target.value))} className="w-full px-4 py-2 border rounded-xl">{MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}</select>
                                        <select value={cloneTargetYear} onChange={e => setCloneTargetYear(Number(e.target.value))} className="w-full px-4 py-2 border rounded-xl">{[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* ======= GIAO DIỆN TAB 4: SHIFTS ======= */}
                {tab === "shifts" && (
                    <>
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-semibold">All Shifts ({shifts.length})</label>
                            <button onClick={() => setShowCreateShiftModal(true)} className="px-3 py-1.5 bg-[#0d9488] text-white rounded-xl text-xs">+ New Shift</button>
                        </div>
                        {/* (Danh sách ca làm và nút Delete...) */}
                    </>
                )}

                {/* ======= GIAO DIỆN TAB 5: MANAGE ======= */}
                {tab === "manage" && (
                    <>
                        <EmployeeSelector selectedEmployee={manageEmployee} onSelect={(emp) => { setManageEmployee(emp); setManageSchedules([]); setManageError(null); }} />
                        {manageEmployee && (
                            <div className="flex items-end gap-3 mt-4">
                                <select value={manageMonth} onChange={e => setManageMonth(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl">{MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}</select>
                                <select value={manageYear} onChange={e => setManageYear(Number(e.target.value))} className="w-full px-3 py-2 border rounded-xl">{[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}</select>
                                <button onClick={loadManageSchedules} className="px-4 py-2.5 bg-[#0d9488] text-white rounded-xl">Load</button>
                            </div>
                        )}
                        {/* (Danh sách sửa/xóa các ngày lịch cụ thể...) */}
                    </>
                )}

                {/* ======= NÚT SUBMIT LỚN (Áp dụng cho Single, Bulk, Clone) ======= */}
                {(tab === "bulk" || (selectedEmployee && tab !== "shifts" && tab !== "manage")) && (
                    <div className="pt-2">
                        <button onClick={handleSubmit} disabled={submitting}
                            className="w-full flex justify-center gap-2 px-6 py-3 bg-[#0d9488] text-white font-semibold rounded-xl disabled:opacity-60 transition-all">
                            {submitting ? "Processing..." : tab === "single" ? "📅 Create Schedule" : tab === "bulk" ? `⚡ Create Bulk (${selectedBulkIds.size})` : "📋 Clone Previous Month"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateSchedule;