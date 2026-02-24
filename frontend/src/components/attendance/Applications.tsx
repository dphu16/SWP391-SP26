import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../services/apiClient";

// ── Types ──────────────────────────────────────────────────────────────────
type AppStatus = "Pending" | "Approved" | "Rejected";
type AppType = "Leave" | "OT" | "ChangeShift";
type ModalType = "Leave" | "OT" | "ChangeShift" | null;

interface AttendanceEmployee {
    employeeId: string;
    fullName: string;
    position: string;
    deptName: string;
    employeeCode: string;
}

interface PageResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
}

interface RequestRecord {
    id: number;
    type: AppType;
    typeLabel: string;
    dateRequested: string;
    datesAffected: string;
    status: AppStatus;
}

// ── Static data ────────────────────────────────────────────────────────────
const mockRequests: RequestRecord[] = [
    { id: 1, type: "Leave", typeLabel: "Annual Leave", dateRequested: "Oct 20, 2023", datesAffected: "Oct 24 - Oct 25", status: "Pending" },
    { id: 2, type: "OT", typeLabel: "Overtime Request", dateRequested: "Oct 10, 2023", datesAffected: "Oct 12 (2 Hours)", status: "Approved" },
    { id: 3, type: "ChangeShift", typeLabel: "Change Shift", dateRequested: "Oct 28, 2023", datesAffected: "Nov 01", status: "Pending" },
];

const typeIcon: Record<AppType, React.ReactNode> = {
    Leave: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
    ),
    OT: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
    ),
    ChangeShift: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
    ),
};

const typeBg: Record<AppType, string> = {
    Leave: "bg-[#ccfbf1] text-[#0f766e]",
    OT: "bg-[#dcfce7] text-[#15803d]",
    ChangeShift: "bg-[#e0f2fe] text-[#0369a1]",
};

const statusBadge: Record<AppStatus, string> = {
    Pending: "bg-[#fef3c7] text-[#b45309]",
    Approved: "bg-[#dcfce7] text-[#15803d]",
    Rejected: "bg-[#fee2e2] text-[#dc2626]",
};

// ── EmployeeSearch subcomponent ────────────────────────────────────────────
const EmployeeSearch: React.FC<{
    value: AttendanceEmployee | null;
    onChange: (emp: AttendanceEmployee | null) => void;
}> = ({ value, onChange }) => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<AttendanceEmployee[]>([]);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Fetch employees from the same endpoint as CreateSchedule
    const fetchEmployees = async (q: string) => {
        setLoading(true);
        try {
            const res = await apiClient.get<PageResponse<AttendanceEmployee>>(
                "/api/v1/attendance/work-schedules/employees",
                { params: { page: 0, size: 10, search: q || undefined } }
            );
            setResults(res.data.content);
            setOpen(true);
        } catch {
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setQuery(q);
        if (value) onChange(null);   // clear selection when typing
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchEmployees(q), 300);
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node))
                setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const select = (emp: AttendanceEmployee) => {
        onChange(emp);
        setQuery(emp.fullName);
        setOpen(false);
    };

    return (
        <div ref={containerRef} className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={value ? value.fullName : query}
                    onChange={handleInput}
                    onFocus={() => { if (!value) fetchEmployees(query); }}
                    placeholder="Tìm theo tên hoặc mã nhân viên..."
                    className="w-full border border-[#e2e8f0] rounded-lg pl-3 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                />
                {loading && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 animate-spin text-[#0d9488]" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                    </span>
                )}
                {value && (
                    <button
                        onClick={() => { onChange(null); setQuery(""); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                )}
            </div>

            {open && results.length > 0 && !value && (
                <ul className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg overflow-auto max-h-52 text-sm">
                    {results.map(emp => (
                        <li
                            key={emp.employeeId}
                            onMouseDown={() => select(emp)}
                            className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-[#f0fdf4] transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                {emp.fullName.charAt(0)}
                            </div>
                            <div>
                                <p className="font-semibold text-[#0f172a]">{emp.fullName}</p>
                                <p className="text-xs text-[#64748b]">{emp.employeeCode} · {emp.deptName}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {open && !loading && results.length === 0 && !value && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-xl shadow-lg px-4 py-3 text-sm text-[#94a3b8]">
                    Không tìm thấy nhân viên nào.
                </div>
            )}
        </div>
    );
};

// ── Main component ─────────────────────────────────────────────────────────
const Applications: React.FC = () => {
    const [modal, setModal] = useState<ModalType>(null);
    const [swapEmployee, setSwapEmployee] = useState<AttendanceEmployee | null>(null);

    const closeModal = () => { setModal(null); setSwapEmployee(null); };

    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Application Management</h1>
                    <p className="text-[#64748b] text-[15px] mt-1">Manage leave requests, overtime approvals, and shift changes.</p>
                </div>
                <button
                    onClick={() => setModal("Leave")}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg font-medium text-sm shadow-sm transition-all"
                >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    <span>New Request</span>
                </button>
            </div>

            {/* Category Cards */}
            <div>
                <h2 className="text-xl font-bold text-[#0f172a] mb-4">Application Categories</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* Leave */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <span className="px-2.5 py-1 bg-[#fef3c7] text-[#b45309] text-xs font-bold rounded-md">2 Pending</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-1">Leave Application</h3>
                        <p className="text-sm text-[#64748b] mb-5">Vacation, sick leave, and casual time off.</p>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest mb-3">RECENT ACTIVITY</p>
                            <div className="space-y-2.5">
                                {[["Annual Leave", "Oct 24-25", "#f59e0b"], ["Sick Leave", "Sep 12", "#10b981"]].map(([lbl, dt, col]) => (
                                    <div key={lbl} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center space-x-2">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: col }}></span>
                                            <span className="font-medium text-[#1e293b]">{lbl}</span>
                                        </div>
                                        <span className="text-[#64748b] text-[13px]">{dt}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex space-x-3">
                            <button className="flex-1 py-2 font-semibold text-sm rounded-lg border border-[#e2e8f0] text-[#334155] hover:bg-gray-50">View All</button>
                            <button onClick={() => setModal("Leave")} className="flex-1 py-2 font-semibold text-sm rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm">Create New</button>
                        </div>
                    </div>

                    {/* OT */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#dcfce7] text-[#15803d] flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <span className="px-2.5 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-bold rounded-md">Up to date</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-1">OT Application</h3>
                        <p className="text-sm text-[#64748b] mb-5">Overtime requests and approval tracking.</p>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest mb-3">RECENT ACTIVITY</p>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                                    <span className="font-medium text-[#1e293b]">Overtime (2hrs)</span>
                                </div>
                                <span className="text-[#64748b] text-[13px]">Oct 12</span>
                            </div>
                            <p className="text-center text-xs italic text-[#94a3b8] mt-4">No other recent activity</p>
                        </div>
                        <div className="mt-6 flex space-x-3">
                            <button className="flex-1 py-2 font-semibold text-sm rounded-lg border border-[#e2e8f0] text-[#334155] hover:bg-gray-50">View All</button>
                            <button onClick={() => setModal("OT")} className="flex-1 py-2 font-semibold text-sm rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm">Create New</button>
                        </div>
                    </div>

                    {/* Change Shift */}
                    <div className="bg-white border border-[#e2e8f0] rounded-2xl p-6 shadow-sm flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <span className="px-2.5 py-1 bg-[#fef3c7] text-[#b45309] text-xs font-bold rounded-md">1 Pending</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#0f172a] mb-1">Change Shift</h3>
                        <p className="text-sm text-[#64748b] mb-5">Shift swaps and schedule adjustments.</p>
                        <div className="flex-1">
                            <p className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-widest mb-3">RECENT ACTIVITY</p>
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center space-x-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b]"></span>
                                    <span className="font-medium text-[#1e293b]">Swap with Sarah</span>
                                </div>
                                <span className="text-[#64748b] text-[13px]">Nov 01</span>
                            </div>
                        </div>
                        <div className="mt-6 flex space-x-3">
                            <button className="flex-1 py-2 font-semibold text-sm rounded-lg border border-[#e2e8f0] text-[#334155] hover:bg-gray-50">View All</button>
                            <button onClick={() => setModal("ChangeShift")} className="flex-1 py-2 font-semibold text-sm rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white shadow-sm">Create New</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity Log */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
                <div className="flex justify-between items-center p-5 border-b border-[#e2e8f0]">
                    <h2 className="text-lg font-bold text-[#0f172a]">Recent Activity Log</h2>
                    <button className="text-sm font-semibold text-[#0d9488] hover:text-[#0f766e]">View All History</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                                {["Application Type", "Date Requested", "Dates Affected", "Status", "Action"].map(h => (
                                    <th key={h} className="px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#e2e8f0]">
                            {mockRequests.map(r => (
                                <tr key={r.id} className="hover:bg-[#f8fafc] transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeBg[r.type]}`}>
                                                {typeIcon[r.type]}
                                            </div>
                                            <span className="font-semibold text-[#1e293b] text-sm">{r.typeLabel}</span>
                                        </div>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-[#475569]">{r.dateRequested}</td>
                                    <td className="px-5 py-4 text-sm text-[#475569]">{r.datesAffected}</td>
                                    <td className="px-5 py-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${statusBadge[r.status]}`}>{r.status}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <button className="text-[#94a3b8] hover:text-[#0d9488] transition-colors">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── MODALS ── */}
            {modal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-5 border-b border-[#e2e8f0]">
                            <div>
                                <h3 className="text-lg font-bold text-[#0f172a]">
                                    {modal === "Leave" && "New Leave Application"}
                                    {modal === "OT" && "New OT Application"}
                                    {modal === "ChangeShift" && "New Shift Change Request"}
                                </h3>
                                <p className="text-sm text-[#64748b] mt-0.5">
                                    {modal === "Leave" && "Submit a leave request for approval."}
                                    {modal === "OT" && "Register your overtime hours for approval."}
                                    {modal === "ChangeShift" && "Request a shift swap with another employee."}
                                </p>
                            </div>
                            <button onClick={closeModal} className="text-[#94a3b8] hover:text-[#64748b] transition-colors">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-5 space-y-4">
                            {modal === "Leave" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Leave Type</label>
                                        <select className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]">
                                            <option>Annual Leave</option>
                                            <option>Sick Leave</option>
                                            <option>Casual Leave</option>
                                            <option>Maternity/Paternity Leave</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Date</label>
                                            <input type="date" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Date</label>
                                            <input type="date" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
                                        <textarea rows={3} placeholder="Describe the reason for the leave..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                </>
                            )}

                            {modal === "OT" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">OT Date</label>
                                        <input type="date" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Time</label>
                                            <input type="time" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Time</label>
                                            <input type="time" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason for OT</label>
                                        <textarea rows={3} placeholder="Describe the task requiring overtime..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                </>
                            )}

                            {modal === "ChangeShift" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Your Current Shift Date</label>
                                        <input type="date" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">
                                            Swap With <span className="text-[#94a3b8] font-normal">(search nhân viên từ DB)</span>
                                        </label>
                                        <EmployeeSearch value={swapEmployee} onChange={setSwapEmployee} />
                                        {swapEmployee && (
                                            <div className="mt-2 p-3 bg-[#f0fdf4] border border-[#86efac] rounded-lg flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#0d9488]/10 text-[#0d9488] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                    {swapEmployee.fullName.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#15803d] text-sm">{swapEmployee.fullName}</p>
                                                    <p className="text-xs text-[#64748b]">{swapEmployee.employeeCode} · {swapEmployee.position} · {swapEmployee.deptName}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Target Shift Date (của họ)</label>
                                        <input type="date" className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
                                        <textarea rows={2} placeholder="Reason for the shift change..." className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]" />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
                            <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-[#334155] hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button className="px-5 py-2 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-semibold shadow-sm transition-colors">
                                Submit Request
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Applications;
