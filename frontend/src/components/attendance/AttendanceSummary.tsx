import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
    getAttendanceSummary,
    getDepartments,
    type AttendanceSummaryDTO,
    type DepartmentOption,
} from "../../services/attendanceService";
import apiClient from "../../services/apiClient";

// ── Helpers ──
const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

function formatHours(hours: number): string {
    if (hours <= 0) return "0h 00m";
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${String(m).padStart(2, "0")}m`;
}

// ── Select style ──
const selectStyle: React.CSSProperties = {
    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
    backgroundPosition: "right 0.75rem center",
    backgroundRepeat: "no-repeat",
    backgroundSize: "1.25em 1.25em",
    paddingRight: "2.5rem",
};

// ── Employee option (from BE: /api/v1/attendance/work-schedules/employees) ──
interface EmployeeOption {
    id: string;       // UUID
    fullName: string;
    employeeCode: string;
    deptName: string;
}

// ── Phase type ──
type Phase = "filter" | "result";

const AttendanceSummary: React.FC = () => {
    const now = new Date();

    // ── Filter state ──
    const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(now.getFullYear());
    const [filterDeptId, setFilterDeptId] = useState("");
    const [filterEmployeeId, setFilterEmployeeId] = useState(""); // UUID from dropdown

    // ── Employee search dropdown ──
    const [empSearch, setEmpSearch] = useState("");
    const [empOptions, setEmpOptions] = useState<EmployeeOption[]>([]);
    const [empDropdownOpen, setEmpDropdownOpen] = useState(false);
    const [empLoading, setEmpLoading] = useState(false);
    const [selectedEmpLabel, setSelectedEmpLabel] = useState("");
    const empDropdownRef = useRef<HTMLDivElement>(null);

    // ── Data state ──
    const [phase, setPhase] = useState<Phase>("filter");
    const [summaryData, setSummaryData] = useState<AttendanceSummaryDTO[]>([]);
    const [departments, setDepartments] = useState<DepartmentOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Applied filters (snapshot) ──
    const [appliedMonth, setAppliedMonth] = useState(now.getMonth() + 1);
    const [appliedYear, setAppliedYear] = useState(now.getFullYear());
    const [appliedDept, setAppliedDept] = useState("");

    // ── Sort ──
    const [sortField, setSortField] = useState<keyof AttendanceSummaryDTO>("fullName");
    const [sortAsc, setSortAsc] = useState(true);

    // ── Load departments on mount ──
    useEffect(() => {
        getDepartments().then(setDepartments);
    }, []);

    // ── Close employee dropdown on outside click ──
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (empDropdownRef.current && !empDropdownRef.current.contains(e.target as Node)) {
                setEmpDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // ── Search employees (debounced) ──
    useEffect(() => {
        if (!empDropdownOpen) return;
        const timer = setTimeout(async () => {
            setEmpLoading(true);
            try {
                const res = await apiClient.get(`/api/v1/attendance/work-schedules/employees`, {
                    params: { search: empSearch || undefined, page: 0, size: 30 },
                });
                setEmpOptions(res.data.content ?? []);
            } catch {
                setEmpOptions([]);
            } finally {
                setEmpLoading(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [empSearch, empDropdownOpen]);

    // Year options
    const yearOptions: number[] = [];
    for (let y = now.getFullYear() - 2; y <= now.getFullYear() + 1; y++) {
        yearOptions.push(y);
    }

    // ── Fetch summary ──
    const handleSearch = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAttendanceSummary({
                month: filterMonth,
                year: filterYear,
                departmentId: filterDeptId || undefined,
                employeeId: filterEmployeeId || undefined,
            });
            setSummaryData(data);
            setAppliedMonth(filterMonth);
            setAppliedYear(filterYear);
            setAppliedDept(filterDeptId);
            setPhase("result");
        } catch (err) {
            console.error("Failed to fetch attendance summary:", err);
            const msg =
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
                (err instanceof Error ? err.message : "Failed to load data. Please try again.");
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [filterMonth, filterYear, filterDeptId, filterEmployeeId]);

    // ── Sorted data ──
    const sortedData = useMemo(() => {
        return [...summaryData].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (typeof aVal === "string" && typeof bVal === "string") {
                return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            }
            const aNum = Number(aVal) || 0;
            const bNum = Number(bVal) || 0;
            return sortAsc ? aNum - bNum : bNum - aNum;
        });
    }, [summaryData, sortField, sortAsc]);

    const handleSort = (field: keyof AttendanceSummaryDTO) => {
        if (sortField === field) {
            setSortAsc(!sortAsc);
        } else {
            setSortField(field);
            setSortAsc(true);
        }
    };

    const SortIcon: React.FC<{ field: keyof AttendanceSummaryDTO }> = ({ field }) => (
        <span className="inline-flex ml-1 opacity-60">
            {sortField === field ? (sortAsc ? "↑" : "↓") : "⇅"}
        </span>
    );

    const getDeptName = (id: string) => departments.find((d) => d.deptId === id)?.deptName ?? "";

    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full">
            {/* ── Header ── */}
            <div className="mb-6">
                <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Attendance Summary</h1>
            </div>

            {/* ═══════════════ FILTER PANEL ═══════════════ */}
            <div className="bg-white rounded-2xl border border-[#e2e8f0] p-6 shadow-sm mb-6">
                <h3 className="text-base font-bold text-[#0f172a] mb-5 flex items-center gap-2">
                    <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Month */}
                    <div>
                        <label className="block text-sm font-semibold text-[#374151] mb-2">Month</label>
                        <select
                            value={filterMonth}
                            onChange={(e) => setFilterMonth(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] transition-all appearance-none cursor-pointer"
                            style={selectStyle}
                        >
                            {MONTHS.map((label, idx) => (
                                <option key={idx + 1} value={idx + 1}>{label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Year */}
                    <div>
                        <label className="block text-sm font-semibold text-[#374151] mb-2">Year</label>
                        <select
                            value={filterYear}
                            onChange={(e) => setFilterYear(Number(e.target.value))}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] transition-all appearance-none cursor-pointer"
                            style={selectStyle}
                        >
                            {yearOptions.map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>

                    {/* Department */}
                    <div>
                        <label className="block text-sm font-semibold text-[#374151] mb-2">Department</label>
                        <select
                            value={filterDeptId}
                            onChange={(e) => setFilterDeptId(e.target.value)}
                            className="w-full px-4 py-3 border border-[#e2e8f0] rounded-xl text-sm font-medium text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#10b981]/30 focus:border-[#10b981] transition-all appearance-none cursor-pointer"
                            style={selectStyle}
                        >
                            <option value="">All Departments</option>
                            {departments.map((dept) => (
                                <option key={dept.deptId} value={dept.deptId}>{dept.deptName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Employee (searchable dropdown) */}
                    <div ref={empDropdownRef} className="relative">
                        <label className="block text-sm font-semibold text-[#374151] mb-2">
                            Employee <span className="font-normal text-[#94a3b8]">(optional)</span>
                        </label>
                        <div
                            className={`w-full px-4 py-3 border rounded-xl text-sm font-medium bg-white flex items-center gap-2 cursor-pointer transition-all ${empDropdownOpen ? "border-[#10b981] ring-2 ring-[#10b981]/30" : "border-[#e2e8f0]"}`}
                            onClick={() => setEmpDropdownOpen(!empDropdownOpen)}
                        >
                            {selectedEmpLabel ? (
                                <>
                                    <span className="flex-1 text-[#0f172a] truncate">{selectedEmpLabel}</span>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFilterEmployeeId("");
                                            setSelectedEmpLabel("");
                                            setEmpSearch("");
                                        }}
                                        className="text-[#94a3b8] hover:text-[#dc2626] flex-shrink-0"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </>
                            ) : (
                                <span className="flex-1 text-[#94a3b8]">All Employees</span>
                            )}
                            <svg className={`w-4 h-4 text-[#94a3b8] flex-shrink-0 transition-transform ${empDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>

                        {/* Dropdown */}
                        {empDropdownOpen && (
                            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-hidden animate-fade-in">
                                <div className="p-2 border-b border-[#f1f5f9]">
                                    <input
                                        type="text"
                                        placeholder="Search by name or employee code..."
                                        value={empSearch}
                                        onChange={(e) => setEmpSearch(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#10b981]/30 focus:border-[#10b981] placeholder:text-[#94a3b8]"
                                        autoFocus
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                    {empLoading ? (
                                        <div className="py-4 text-center text-sm text-[#94a3b8]">Searching...</div>
                                    ) : empOptions.length === 0 ? (
                                        <div className="py-4 text-center text-sm text-[#94a3b8]">No results found</div>
                                    ) : (
                                        empOptions.map((emp) => (
                                            <button
                                                key={emp.id}
                                                onClick={() => {
                                                    setFilterEmployeeId(emp.id);
                                                    setSelectedEmpLabel(`${emp.fullName} (${emp.employeeCode})`);
                                                    setEmpDropdownOpen(false);
                                                    setEmpSearch("");
                                                }}
                                                className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[#f0fdf4] transition-colors flex items-center justify-between gap-2 ${filterEmployeeId === emp.id ? "bg-[#f0fdf4]" : ""}`}
                                            >
                                                <div>
                                                    <span className="font-medium text-[#0f172a]">{emp.fullName}</span>
                                                    <span className="text-[#94a3b8] ml-1.5 text-xs">{emp.employeeCode}</span>
                                                </div>
                                                <span className="text-xs text-[#94a3b8] flex-shrink-0">{emp.deptName}</span>
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-4 p-4 rounded-xl bg-[#fef2f2] border border-[#fecaca] text-[#dc2626] text-sm font-medium flex items-center gap-3">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="flex-1">{error}</span>
                        <button onClick={() => setError(null)} className="text-[#dc2626] hover:text-[#b91c1c]">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Search button */}
                <button
                    onClick={handleSearch}
                    disabled={loading}
                    className="w-full sm:w-auto relative group overflow-hidden bg-[#10b981] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgb(16,185,129,0.3)] hover:shadow-[0_6px_20px_rgb(16,185,129,0.4)] transition-all transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                    <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></span>
                    <div className="flex items-center justify-center gap-2.5">
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        )}
                        {loading ? "Loading..." : "View Summary"}
                    </div>
                </button>
            </div>

            {/* ═══════════════ RESULTS (TABLE ONLY) ═══════════════ */}
            {phase === "result" && !loading && (
                <div className="animate-fade-in">
                    {/* Applied filter summary bar */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        <span className="text-sm text-[#64748b]">Results for:</span>
                        <span className="inline-flex items-center gap-1 text-sm font-bold text-[#10b981] bg-[#dcfce7] px-3 py-1 rounded-lg">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {MONTHS[appliedMonth - 1]} {appliedYear}
                        </span>
                        {appliedDept && (
                            <span className="inline-flex items-center gap-1 text-sm font-bold text-[#7c3aed] bg-[#ede9fe] px-3 py-1 rounded-lg">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                                {getDeptName(appliedDept)}
                            </span>
                        )}
                        <span className="text-sm text-[#94a3b8]">— {summaryData.length} employee(s)</span>
                        <button
                            onClick={() => setPhase("filter")}
                            className="ml-auto text-sm text-[#64748b] hover:text-[#0f172a] font-medium flex items-center gap-1 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                            Filter Again
                        </button>
                    </div>

                    {/* ── Table ── */}
                    <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                        <div className="p-5 border-b border-[#f1f5f9]">
                            <h3 className="text-base font-bold text-[#0f172a] flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                                </svg>
                                Attendance Report — {MONTHS[appliedMonth - 1]} {appliedYear}
                            </h3>
                        </div>

                        {summaryData.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-[#94a3b8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                    </svg>
                                </div>
                                <p className="text-[#94a3b8] text-sm font-medium">No attendance data found for the selected filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-[#f8fafc]">
                                            <th className="text-left px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider">#</th>
                                            <th className="text-left px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("employeeCode")}>
                                                Emp Code<SortIcon field="employeeCode" />
                                            </th>
                                            <th className="text-left px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("fullName")}>
                                                Full Name<SortIcon field="fullName" />
                                            </th>
                                            <th className="text-left px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("departmentName")}>
                                                Department<SortIcon field="departmentName" />
                                            </th>
                                            <th className="text-right px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("totalWorkingHours")}>
                                                Total Hours<SortIcon field="totalWorkingHours" />
                                            </th>
                                            <th className="text-center px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("totalLateDays")}>
                                                Late<SortIcon field="totalLateDays" />
                                            </th>
                                            <th className="text-center px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("totalEarlyLeaveDays")}>
                                                Early Leave<SortIcon field="totalEarlyLeaveDays" />
                                            </th>
                                            <th className="text-center px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider cursor-pointer hover:text-[#0f172a] transition-colors" onClick={() => handleSort("totalMissingPunchDays")}>
                                                Missing<SortIcon field="totalMissingPunchDays" />
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedData.map((row, idx) => (
                                            <tr
                                                key={row.employeeId}
                                                className="border-t border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors"
                                            >
                                                <td className="px-5 py-3.5 text-[#94a3b8] text-xs">{idx + 1}</td>
                                                <td className="px-5 py-3.5 font-mono text-xs text-[#64748b]">{row.employeeCode || "—"}</td>
                                                <td className="px-5 py-3.5 font-medium text-[#0f172a]">{row.fullName}</td>
                                                <td className="px-5 py-3.5">
                                                    <span className="inline-flex items-center text-xs font-medium bg-[#f1f5f9] text-[#475569] px-2 py-0.5 rounded-md">
                                                        {row.departmentName}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-[#0f172a]">
                                                    {formatHours(row.totalWorkingHours)}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {row.totalLateDays > 0 ? (
                                                        <span className="inline-flex items-center justify-center min-w-[28px] text-xs font-bold bg-[#fef2f2] text-[#dc2626] px-1.5 py-0.5 rounded-md">
                                                            {row.totalLateDays}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#cbd5e1]">0</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {row.totalEarlyLeaveDays > 0 ? (
                                                        <span className="inline-flex items-center justify-center min-w-[28px] text-xs font-bold bg-[#fef3c7] text-[#b45309] px-1.5 py-0.5 rounded-md">
                                                            {row.totalEarlyLeaveDays}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#cbd5e1]">0</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-center">
                                                    {row.totalMissingPunchDays > 0 ? (
                                                        <span className="inline-flex items-center justify-center min-w-[28px] text-xs font-bold bg-[#e0f2fe] text-[#0369a1] px-1.5 py-0.5 rounded-md">
                                                            {row.totalMissingPunchDays}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[#cbd5e1]">0</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    {/* Footer totals */}
                                    <tfoot>
                                        <tr className="border-t-2 border-[#e2e8f0] bg-[#f8fafc]">
                                            <td colSpan={4} className="px-5 py-3.5 text-sm font-bold text-[#0f172a]">
                                                Total ({summaryData.length} employees)
                                            </td>
                                            <td className="px-5 py-3.5 text-right font-bold text-[#0f172a]">
                                                {formatHours(summaryData.reduce((sum, r) => sum + (r.totalWorkingHours ?? 0), 0))}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="font-bold text-[#dc2626]">
                                                    {summaryData.reduce((sum, r) => sum + (r.totalLateDays ?? 0), 0)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="font-bold text-[#b45309]">
                                                    {summaryData.reduce((sum, r) => sum + (r.totalEarlyLeaveDays ?? 0), 0)}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <span className="font-bold text-[#0369a1]">
                                                    {summaryData.reduce((sum, r) => sum + (r.totalMissingPunchDays ?? 0), 0)}
                                                </span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Initial empty state ── */}
            {phase === "filter" && !loading && (
                <div className="bg-white rounded-2xl border border-[#e2e8f0] p-12 shadow-sm text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-full bg-[#f0fdf4] flex items-center justify-center mx-auto mb-5">
                        <svg className="w-10 h-10 text-[#10b981]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-[#0f172a] mb-2">Select filters to get started</h3>
                    <p className="text-[#64748b] text-sm max-w-md mx-auto">
                        Choose month, year, and department above, then click <strong>"View Summary"</strong> to see the attendance report.
                    </p>
                </div>
            )}

            <style>
                {`@keyframes shimmer { 100% { transform: translateX(100%); } }`}
            </style>
        </div>
    );
};

export default AttendanceSummary;
