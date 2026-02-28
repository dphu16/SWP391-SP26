import React, { useState, useEffect, useRef } from "react";
import apiClient from "../../services/apiClient";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { getMyRequests, createRequest, updateRequest, deleteRequest, type RequestRecord as RequestRecordApi, type CreateRequestDTO } from "../../services/requestService";

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
    id: string; // Updated from number
    type: AppType;
    typeLabel: string;
    dateRequested: string;
    datesAffected: string;
    status: AppStatus;
    raw: RequestRecordApi;
}

// Map from API RequestRecord to UI RequestRecord
const mapApiRequest = (r: RequestRecordApi): RequestRecord => {
    let type: AppType = "Leave";
    let typeLabel = "Leave Application";
    if (r.requestType === "OT") { type = "OT"; typeLabel = "Overtime Request"; }
    else if (r.requestType === "SHIFT_CHANGE") { type = "ChangeShift"; typeLabel = "Change Shift"; }

    let status: AppStatus = "Pending";
    if (r.status === "APPROVED") status = "Approved";
    else if (r.status === "REJECTED") status = "Rejected";

    const dReq = r.createdAt ? new Date(r.createdAt) : new Date();
    const dateRequested = dReq.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const dStart = r.startDate ? new Date(r.startDate) : new Date();
    const textStart = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    let datesAffected = textStart;
    if (r.endDate && r.endDate !== r.startDate) {
        const dEnd = new Date(r.endDate);
        datesAffected += ` - ${dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    }
    return {
        id: r.requestId,
        type,
        typeLabel,
        dateRequested,
        datesAffected,
        status,
        raw: r,
    };
};

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
        if (value) onChange(null); // clear selection when typing
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
    const currentUser = useCurrentUser();
    const [modal, setModal] = useState<ModalType>(null);
    const [swapEmployee, setSwapEmployee] = useState<AttendanceEmployee | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [requests, setRequests] = useState<RequestRecord[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [editRequestId, setEditRequestId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        leaveType: "Annual Leave",
        startDate: "",
        endDate: "",
        reason: "",
        otDate: "",
        otStartTime: "",
        otEndTime: "",
        shiftDate: "",
        targetShiftDate: ""
    });
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const loadRequests = async () => {
        if (!currentUser?.employeeId) {
            setLoadingRequests(false);
            return;
        }
        setLoadingRequests(true);
        try {
            const data = await getMyRequests(currentUser.employeeId);
            setRequests(data.map(mapApiRequest));
        } catch (error) {
            console.error("Error fetching requests", error);
        } finally {
            setLoadingRequests(false);
        }
    };

    useEffect(() => {
        loadRequests();
    }, [currentUser?.employeeId]);

    const closeModal = () => {
        setModal(null);
        setSwapEmployee(null);
        setFormData({ leaveType: "Annual Leave", startDate: "", endDate: "", reason: "", otDate: "", otStartTime: "", otEndTime: "", shiftDate: "", targetShiftDate: "" });
        setSubmitError(null);
        setEditRequestId(null);
    };

    const handleDropdownItemClick = (type: ModalType) => {
        setModal(type);
        setMenuOpen(false);
        setEditRequestId(null);
    };

    const handleSubmit = async () => {
        if (!currentUser?.employeeId) return;
        setSubmitting(true);
        setSubmitError(null);
        try {
            let dto: CreateRequestDTO;
            if (modal === "Leave") {
                if (!formData.startDate || !formData.endDate) throw new Error("Please select start and end dates.");
                dto = {
                    employeeId: currentUser.employeeId,
                    requestType: "LEAVE",
                    startDate: formData.startDate,
                    endDate: formData.endDate,
                    reason: `[${formData.leaveType}] ${formData.reason}`
                };
            } else if (modal === "OT") {
                if (!formData.otDate || !formData.otStartTime || !formData.otEndTime) throw new Error("Please fill in all OT date and time fields.");
                dto = {
                    employeeId: currentUser.employeeId,
                    requestType: "OT",
                    startDate: formData.otDate,
                    endDate: formData.otDate,
                    reason: `${formData.otStartTime} - ${formData.otEndTime} | ${formData.reason}`
                };
            } else if (modal === "ChangeShift") {
                if (!formData.shiftDate || !formData.targetShiftDate || !swapEmployee) throw new Error("Please fill in all shift dates and select an employee.");
                dto = {
                    employeeId: currentUser.employeeId,
                    requestType: "SHIFT_CHANGE",
                    startDate: formData.shiftDate,
                    endDate: formData.targetShiftDate,
                    reason: `Swap with ${swapEmployee.fullName} | ${formData.reason}`
                };
            } else return;

            if (editRequestId) {
                await updateRequest(editRequestId, dto);
            } else {
                await createRequest(dto);
            }
            closeModal();
            loadRequests();
        } catch (error: any) {
            setSubmitError(error.response?.data?.message || error.message || "Failed to submit request.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string, status: AppStatus) => {
        if (status !== "Pending") return;
        try {
            await deleteRequest(id);
            loadRequests();
        } catch (error: any) {
            console.error(error.response?.data?.message || "Failed to delete request.");
        }
    };

    const handleEdit = (r: RequestRecord) => {
        if (r.status !== "Pending") return;
        const { raw } = r;
        setEditRequestId(r.id);
        setModal(r.type);

        let parsedReason = raw.reason || "";
        let leaveType = "Annual Leave";
        let otStartTime = "";
        let otEndTime = "";

        if (r.type === "Leave") {
            const match = parsedReason.match(/^\[(.*?)\] (.*)$/);
            if (match) {
                leaveType = match[1];
                parsedReason = match[2];
            }
        } else if (r.type === "OT") {
            const match = parsedReason.match(/^(.*?) - (.*?) \| (.*)$/);
            if (match) {
                otStartTime = match[1];
                otEndTime = match[2];
                parsedReason = match[3];
            }
        } else if (r.type === "ChangeShift") {
            const match = parsedReason.match(/^Swap with (.*?) \| (.*)$/);
            if (match) {
                parsedReason = match[2];
            }
            setSwapEmployee(null);
        }

        setFormData({
            leaveType,
            startDate: r.type === "Leave" ? raw.startDate || "" : "",
            endDate: r.type === "Leave" ? raw.endDate || "" : "",
            reason: parsedReason,
            otDate: r.type === "OT" ? raw.startDate || "" : "",
            otStartTime,
            otEndTime,
            shiftDate: r.type === "ChangeShift" ? raw.startDate || "" : "",
            targetShiftDate: r.type === "ChangeShift" ? raw.endDate || "" : ""
        });
    };

    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Application Management</h1>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="flex items-center space-x-2 px-4 py-2 bg-[#0d9488] hover:bg-[#0f766e] text-white rounded-lg font-medium text-sm shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>New Request</span>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 overflow-hidden">
                            <button onClick={() => handleDropdownItemClick("Leave")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]">
                                Leave Application
                            </button>
                            <button onClick={() => handleDropdownItemClick("OT")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]">
                                OT Application
                            </button>
                            <button onClick={() => handleDropdownItemClick("ChangeShift")} className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors">
                                Change Shift
                            </button>
                        </div>
                    )}
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
                            {loadingRequests ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#64748b]">Loading requests...</td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-8 text-center text-sm text-[#64748b]">No recent requests found.</td>
                                </tr>
                            ) : requests.map(r => (
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
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleEdit(r)}
                                                disabled={r.status !== "Pending"}
                                                className={`transition-colors ${r.status !== "Pending" ? "text-gray-300 cursor-not-allowed" : "text-[#94a3b8] hover:text-[#0ea5e9]"}`}
                                                title={r.status === "Pending" ? "Edit request" : "Cannot edit approved/rejected request"}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(r.id, r.status)}
                                                disabled={r.status !== "Pending"}
                                                className={`transition-colors ${r.status !== "Pending" ? "text-gray-300 cursor-not-allowed" : "text-[#94a3b8] hover:text-[#ef4444]"}`}
                                                title={r.status === "Pending" ? "Delete request" : "Cannot delete approved/rejected request"}
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
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
                                    {editRequestId ? "Edit" : "New"} {modal === "Leave" ? "Leave Application" : modal === "OT" ? "OT Application" : "Shift Change Request"}
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
                            {submitError && (
                                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                                    {submitError}
                                </div>
                            )}
                            {modal === "Leave" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Leave Type</label>
                                        <select
                                            value={formData.leaveType}
                                            onChange={e => setFormData({ ...formData, leaveType: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        >
                                            <option>Annual Leave</option>
                                            <option>Sick Leave</option>
                                            <option>Casual Leave</option>
                                            <option>Maternity/Paternity Leave</option>
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Date</label>
                                            <input
                                                type="date"
                                                value={formData.startDate}
                                                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Date</label>
                                            <input
                                                type="date"
                                                value={formData.endDate}
                                                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
                                        <textarea
                                            rows={3}
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Describe the reason for the leave..."
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
                                    </div>
                                </>
                            )}

                            {modal === "OT" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">OT Date</label>
                                        <input
                                            type="date"
                                            value={formData.otDate}
                                            onChange={e => setFormData({ ...formData, otDate: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">Start Time</label>
                                            <input
                                                type="time"
                                                value={formData.otStartTime}
                                                onChange={e => setFormData({ ...formData, otStartTime: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-[#334155] mb-1.5">End Time</label>
                                            <input
                                                type="time"
                                                value={formData.otEndTime}
                                                onChange={e => setFormData({ ...formData, otEndTime: e.target.value })}
                                                className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason for OT</label>
                                        <textarea
                                            rows={3}
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Describe the task requiring overtime..."
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
                                    </div>
                                </>
                            )}

                            {modal === "ChangeShift" && (
                                <>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Your Current Shift Date</label>
                                        <input
                                            type="date"
                                            value={formData.shiftDate}
                                            onChange={e => setFormData({ ...formData, shiftDate: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
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
                                        <input
                                            type="date"
                                            value={formData.targetShiftDate}
                                            onChange={e => setFormData({ ...formData, targetShiftDate: e.target.value })}
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-[#334155] mb-1.5">Reason</label>
                                        <textarea
                                            rows={2}
                                            value={formData.reason}
                                            onChange={e => setFormData({ ...formData, reason: e.target.value })}
                                            placeholder="Reason for the shift change..."
                                            className="w-full border border-[#e2e8f0] rounded-lg px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 focus:border-[#0d9488]"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end gap-3 px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
                            <button onClick={closeModal} className="px-5 py-2 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-[#334155] hover:bg-gray-100 transition-colors">
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="px-5 py-2 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors"
                            >
                                {submitting ? "Submitting..." : editRequestId ? "Save Changes" : "Submit Request"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Applications;
