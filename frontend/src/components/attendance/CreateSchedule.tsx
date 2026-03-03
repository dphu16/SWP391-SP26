import React, { useState, useEffect, useRef, useCallback } from "react";
import apiClient from "../../services/apiClient";
import {
    getAllShifts,
    createSchedule,
    createBulkSchedules,
    cloneScheduleFromPreviousMonth,
    type ShiftResponse,
} from "../../services/attendanceService";
import type { PageResponse } from "../../types";

// Khớp với AttendanceEmployeeResponse của backend attendance
interface AttendanceEmployee {
    id: string;
    fullName: string;
    employeeCode: string;
    deptName: string;
}
type Employee = AttendanceEmployee;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];
function formatTime(t: string) { return t.slice(0, 5); }
type Tab = "single" | "bulk" | "clone";

function initials(name: string) {
    return name?.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() ?? "?";
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; size?: string }> = ({ name, size = "w-8 h-8" }) => {
    const colors = ["bg-[#e0f2fe] text-[#0369a1]", "bg-[#fef9c3] text-[#854d0e]", "bg-[#f3e8ff] text-[#7c3aed]", "bg-[#fce7f3] text-[#be185d]", "bg-[#dcfce7] text-[#15803d]"];
    const c = colors[(name?.charCodeAt(0) ?? 0) % colors.length];
    return (
        <div className={`${size} rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${c}`}>
            {initials(name)}
        </div>
    );
};

// ─── Single Employee Search Dropdown ──────────────────────────────────────────
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

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
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
            } catch { setEmployees([]); }
            finally { setLoading(false); }
        };
        const t = setTimeout(load, 250);
        return () => clearTimeout(t);
    }, [query]);

    return (
        <div ref={ref} className="relative">
            <label className="block text-sm font-semibold text-[#374151] mb-2">Employee</label>
            {selectedEmployee && !open ? (
                <button type="button" onClick={() => setOpen(true)}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-[#0d9488] bg-[#f0fdf4] text-left">
                    <Avatar name={selectedEmployee.fullName} />
                    <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[#0f172a] text-sm truncate">{selectedEmployee.fullName}</div>
                        <div className="text-xs text-[#64748b] truncate">{selectedEmployee.employeeCode} · {selectedEmployee.deptName}</div>
                    </div>
                    <svg className="w-4 h-4 text-[#64748b] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
            ) : (
                <input type="text" autoFocus={open} value={query} placeholder="Search by name or employee code..."
                    onFocus={() => setOpen(true)} onChange={e => { setQuery(e.target.value); setOpen(true); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
            )}
            {open && (
                <div className="absolute z-30 mt-1 w-full bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden">
                    <div className="px-3 py-2 border-b border-[#f1f5f9]">
                        <input type="text" autoFocus value={query} placeholder="Search by name or employee code..."
                            onChange={e => setQuery(e.target.value)}
                            className="w-full text-sm text-[#0f172a] focus:outline-none placeholder-[#94a3b8]" />
                    </div>
                    <div className="max-h-56 overflow-y-auto">
                        {loading && <p className="px-4 py-3 text-sm text-[#94a3b8]">Loading...</p>}
                        {!loading && employees.length === 0 && <p className="px-4 py-3 text-sm text-[#94a3b8]">No results found.</p>}
                        {!loading && employees.map(emp => (
                            <button key={emp.id} type="button" onClick={() => { onSelect(emp); setOpen(false); setQuery(""); }}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors text-left">
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

// ─── Multi-Employee Checkbox List (for Bulk tab) ────────────────────────────────
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
            const res = await apiClient.get<PageResponse<Employee>>("/api/v1/attendance/work-schedules/employees", {
                params: { page: 0, size: 50, search: q || undefined },
            });
            setEmployees(res.data.content);
        } catch { setEmployees([]); }
        finally { setLoading(false); }
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
                    {selectedIds.size > 0 && (
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-[#0d9488]/10 text-[#0d9488] text-xs font-bold">
                            {selectedIds.size} selected
                        </span>
                    )}
                </label>
                <div className="flex gap-2">
                    <button type="button" onClick={() => allSelected ? onDeselectAll() : onSelectAll(employees)}
                        className="text-xs font-semibold text-[#0d9488] hover:underline transition-all">
                        {allSelected ? "Deselect All" : "Select All"}
                    </button>
                    {selectedIds.size > 0 && (
                        <button type="button" onClick={onDeselectAll}
                            className="text-xs font-semibold text-[#ef4444] hover:underline transition-all">
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {/* Search */}
            <div className="relative mb-2">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search employees..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
            </div>

            {/* List */}
            <div className="border border-[#e2e8f0] rounded-xl overflow-hidden max-h-64 overflow-y-auto">
                {loading && <p className="px-4 py-3 text-sm text-[#94a3b8]">Loading...</p>}
                {!loading && employees.length === 0 && <p className="px-4 py-3 text-sm text-[#94a3b8]">No employees found.</p>}
                {!loading && employees.map((emp, idx) => {
                    const checked = selectedIds.has(emp.id);
                    return (
                        <label key={emp.id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors select-none
 ${idx !== employees.length - 1 ? "border-b border-[#f1f5f9]" : ""}
 ${checked ? "bg-[#f0fdf4]" : "hover:bg-[#f8fafc]"}`}
                        >
                            <input type="checkbox" checked={checked} onChange={() => onToggle(emp)}
                                className="w-4 h-4 rounded border-2 border-gray-300 text-[#0d9488] focus:ring-0 focus:ring-offset-0 accent-teal-600 cursor-pointer flex-shrink-0" />
                            <Avatar name={emp.fullName} />
                            <div className="flex-1 min-w-0">
                                <div className={`font-semibold text-sm truncate ${checked ? "text-[#0f766e]" : "text-[#0f172a]"}`}>{emp.fullName}</div>
                                <div className="text-xs text-[#64748b] truncate">{emp.employeeCode} · {emp.deptName}</div>
                            </div>
                            {checked && (
                                <svg className="w-4 h-4 text-[#0d9488] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                </svg>
                            )}
                        </label>
                    );
                })}
            </div>
        </div>
    );
};

// ─── Shift Card ────────────────────────────────────────────────────────────────
const ShiftCard: React.FC<{ shift: ShiftResponse; selected: boolean; onClick: () => void }> = ({ shift, selected, onClick }) => {
    const isMorning = parseInt(shift.startTime.slice(0, 2), 10) < 12;
    return (
        <button type="button" onClick={onClick}
            className={`w-full text-left p-3 rounded-xl border-2 transition-all cursor-pointer
 ${selected
                    ? isMorning ? "border-[#f59e0b] bg-[#fef9c3]" : "border-[#0d9488] bg-[#ccfbf1]"
                    : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1]"}`}
        >
            <div className="flex items-center gap-2 mb-0.5">
                <span>{isMorning ? "☀️" : "🌙"}</span>
                <span className="font-bold text-[13px] text-[#0f172a]">{shift.name}</span>
                {selected && (
                    <span className="ml-auto w-4 h-4 rounded-full bg-[#0d9488] flex items-center justify-center flex-shrink-0">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </span>
                )}
            </div>
            <p className="text-[12px] text-[#64748b] font-medium">{formatTime(shift.startTime)} – {formatTime(shift.endTime)}</p>
        </button>
    );
};

// ─── Result Banner ──────────────────────────────────────────────────────────────
const ResultBanner: React.FC<{ count: number; onClose: () => void }> = ({ count, onClose }) => (
    <div className="flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 mb-6">
        <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold">Success! Created {count} schedule(s).</span>
        <button onClick={onClose} className="ml-auto text-green-700 hover:text-green-900 font-bold text-lg leading-none">×</button>
    </div>
);

// ─── Main Component ─────────────────────────────────────────────────────────────
const CreateSchedule: React.FC = () => {
    const today = new Date();

    // Single / Clone: one employee
    const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

    // Bulk: multiple employees
    const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
    const [selectedBulkEmployees, setSelectedBulkEmployees] = useState<Map<string, Employee>>(new Map());

    const [shifts, setShifts] = useState<ShiftResponse[]>([]);
    const [shiftsLoading, setShiftsLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("single");

    // Single
    const [singleDate, setSingleDate] = useState(today.toISOString().slice(0, 10));
    const [singleShiftId, setSingleShiftId] = useState("");

    // Bulk
    const [bulkStart, setBulkStart] = useState(today.toISOString().slice(0, 10));
    const [bulkEnd, setBulkEnd] = useState(today.toISOString().slice(0, 10));
    const [bulkShiftId, setBulkShiftId] = useState("");

    // Clone
    const [cloneTargetMonth, setCloneTargetMonth] = useState(today.getMonth() + 1);
    const [cloneTargetYear, setCloneTargetYear] = useState(today.getFullYear());

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successCount, setSuccessCount] = useState<number | null>(null);

    useEffect(() => {
        getAllShifts()
            .then(allShifts => {
                setShifts(allShifts);
            })
            .catch(() => { })
            .finally(() => setShiftsLoading(false));
    }, []);

    // Bulk employee toggle
    const toggleBulkEmployee = (emp: Employee) => {
        setSelectedBulkIds(prev => {
            const next = new Set(prev);
            if (next.has(emp.id)) { next.delete(emp.id); }
            else { next.add(emp.id); }
            return next;
        });
        setSelectedBulkEmployees(prev => {
            const next = new Map(prev);
            if (next.has(emp.id)) { next.delete(emp.id); } else { next.set(emp.id, emp); }
            return next;
        });
    };
    const selectAllBulk = (employees: Employee[]) => {
        setSelectedBulkIds(prev => {
            const next = new Set(prev);
            employees.forEach(e => next.add(e.id));
            return next;
        });
        setSelectedBulkEmployees(prev => {
            const next = new Map(prev);
            employees.forEach(e => next.set(e.id, e));
            return next;
        });
    };
    const deselectAllBulk = () => {
        setSelectedBulkIds(new Set());
        setSelectedBulkEmployees(new Map());
    };

    const handleSubmit = async () => {
        setError(null);
        setSuccessCount(null);
        setSubmitting(true);
        try {
            if (tab === "single") {
                if (!selectedEmployee) throw new Error("Please select an employee.");
                if (!singleShiftId) throw new Error("Please select a shift.");
                await createSchedule({ employeeId: selectedEmployee.id, date: singleDate, shiftId: singleShiftId });
                setSuccessCount(1);

            } else if (tab === "bulk") {
                if (selectedBulkIds.size === 0) throw new Error("Please select at least 1 employee.");
                if (!bulkShiftId) throw new Error("Please select a shift.");
                // Call API for each selected employee in parallel
                const results = await Promise.all(
                    Array.from(selectedBulkIds).map(empId =>
                        createBulkSchedules({ employeeId: empId, startDate: bulkStart, endDate: bulkEnd, shiftId: bulkShiftId })
                    )
                );
                setSuccessCount(results.reduce((sum, r) => sum + r.length, 0));

            } else {
                if (!selectedEmployee) throw new Error("Please select an employee.");
                const result = await cloneScheduleFromPreviousMonth(selectedEmployee.id, cloneTargetMonth, cloneTargetYear);
                setSuccessCount(result.length);
            }
        } catch (err: any) {
            setError(err?.response?.data?.message ?? err.message ?? "An unknown error occurred.");
        } finally {
            setSubmitting(false);
        }
    };

    const tabBtn = (id: Tab, label: string, icon: string) => (
        <button onClick={() => { setTab(id); setError(null); setSuccessCount(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
 ${tab === id ? "bg-[#0d9488] text-white shadow-sm" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a]"}`}
        >
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

    return (
        <div className="flex flex-col pb-10 max-w-3xl">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Create Schedule</h1>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2 mb-6 p-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl w-fit">
                {tabBtn("single", "Single", "📅")}
                {tabBtn("bulk", "Bulk", "⚡")}
                {tabBtn("clone", "Clone Previous", "📋")}
            </div>

            {successCount !== null && <ResultBanner count={successCount} onClose={() => setSuccessCount(null)} />}
            {error && (
                <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 mb-6">
                    <span className="text-lg leading-none flex-shrink-0">⚠️</span><span>{error}</span>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm p-6 space-y-6">

                {/* ── SINGLE ──────────────────────────────────────── */}
                {tab === "single" && (
                    <>
                        <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div>
                                    <label className="block text-sm font-semibold text-[#374151] mb-2">Work Date</label>
                                    <input type="date" value={singleDate} onChange={e => setSingleDate(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                                </div>
                                <ShiftSelector value={singleShiftId} onChange={setSingleShiftId} />
                            </>
                        )}
                    </>
                )}

                {/* ── BULK ────────────────────────────────────────── */}
                {tab === "bulk" && (
                    <>
                        {/* Date range */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-[#374151] mb-2">Start Date</label>
                                <input type="date" value={bulkStart} onChange={e => setBulkStart(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-[#374151] mb-2">End Date</label>
                                <input type="date" value={bulkEnd} onChange={e => setBulkEnd(e.target.value)}
                                    className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all" />
                            </div>
                        </div>


                        <div className="border-t border-[#f1f5f9]" />

                        {/* Multi-employee selector */}
                        <EmployeeMultiSelector
                            selectedIds={selectedBulkIds}
                            onToggle={toggleBulkEmployee}
                            onSelectAll={selectAllBulk}
                            onDeselectAll={deselectAllBulk}
                        />

                        {/* Selected badge strip */}
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

                {/* ── CLONE ───────────────────────────────────────── */}
                {tab === "clone" && (
                    <>
                        <EmployeeSelector selectedEmployee={selectedEmployee} onSelect={setSelectedEmployee} />
                        {selectedEmployee && (
                            <>
                                <div className="border-t border-[#f1f5f9]" />
                                <div className="p-4 bg-[#f8fafc] rounded-xl border border-[#e2e8f0]">
                                    <p className="text-sm text-[#475569] leading-relaxed">
                                        Clone all schedules from the <strong>previous month</strong> to your target month.
                                        <strong>Sundays</strong> and dates that <strong>already have schedules</strong> will be skipped.
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-[#374151] mb-3">Target Month</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Month</label>
                                            <select value={cloneTargetMonth} onChange={e => setCloneTargetMonth(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all bg-white">
                                                {MONTH_NAMES.map((n, i) => <option key={i + 1} value={i + 1}>{n}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-[#94a3b8] mb-1.5 font-medium">Year</label>
                                            <select value={cloneTargetYear} onChange={e => setCloneTargetYear(Number(e.target.value))}
                                                className="w-full px-4 py-2.5 rounded-xl border border-[#e2e8f0] text-[#0f172a] text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/40 focus:border-[#0d9488] transition-all bg-white">
                                                {[today.getFullYear() - 1, today.getFullYear(), today.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-2 text-sm text-[#64748b]">
                                        <span className="text-[#0d9488] font-semibold">
                                            {MONTH_NAMES[cloneTargetMonth === 1 ? 11 : cloneTargetMonth - 2]}{" "}
                                            {cloneTargetMonth === 1 ? cloneTargetYear - 1 : cloneTargetYear}
                                        </span>
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                        <span className="font-semibold text-[#0f172a]">{MONTH_NAMES[cloneTargetMonth - 1]} {cloneTargetYear}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* Submit */}
                {(tab === "bulk" || selectedEmployee) && (
                    <div className="pt-2">
                        <button onClick={handleSubmit} disabled={submitting}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl shadow-sm transition-all">
                            {submitting ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Processing {tab === "bulk" ? `${selectedBulkIds.size} employee(s)` : ""}...
                                </>
                            ) : tab === "single" ? "📅 Create Schedule"
                                : tab === "bulk" ? `⚡ Create Bulk${selectedBulkIds.size > 0 ? ` (${selectedBulkIds.size})` : ""}`
                                    : "📋 Clone Previous Month"
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CreateSchedule;
