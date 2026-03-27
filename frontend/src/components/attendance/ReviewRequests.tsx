import React, { useState, useEffect } from "react";
import {
    getAllRequestsForReview,
    approveRequest,
    rejectRequest,
    type RequestResponseDTO,
} from "../../services/requestService";
import { processApprovalRequest } from "../../services/approvalService";
import {
    offboardingService,
    type OffboardingResponse,
} from "../../services/offboardingService";
import {
    personnelChangeService,
    type PersonnelChangeResponseDTO,
} from "../../services/personnelChangeService";
import { useAuth } from "../../hooks/useAuth";
import HRConfirmOffboardingModal from "./HRConfirmOffboardingModal";

// ============================================================================
// KHU VỰC 1: KIỂU DỮ LIỆU & CẤU HÌNH GIAO DIỆN (TYPES & CONFIG)
// ============================================================================
type AppStatus = "Pending" | "Approved" | "Rejected";

interface ReviewEntry {
    id: string;
    initials: string;
    avatarColor: string;
    employeeName: string;
    position: string;
    appType: string;
    rawType: string;
    dateRequested: string;
    details: string;
    sub: string;
    status: AppStatus;
    rawOffboardingData?: OffboardingResponse;
    rawPersonnelData?: PersonnelChangeResponseDTO;
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
    DEPARTMENT_TRANSFER: "Department Transfer",
    SALARY_CHANGE: "Salary Change",
    DISCIPLINE: "Discipline",
    REWARD: "Reward",
};

const typeIcon: Record<string, React.ReactNode> = {
    "Onboarding Approval": (
        <span className="w-8 h-8 rounded-lg bg-[#f3e8ff] text-[#7e22ce] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
        </span>
    ),
    "Annual Leave": (
        <span className="w-8 h-8 rounded-lg bg-[#ccfbf1] text-[#0f766e] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
    ),
    Overtime: (
        <span className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#15803d] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
    ),
    "Other Request": (
        <span className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" /></svg>
        </span>
    ),
    "Sick Leave": (
        <span className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#b45309] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
        </span>
    ),
    "Shift Change": (
        <span className="w-8 h-8 rounded-lg bg-[#e0f2fe] text-[#0369a1] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        </span>
    ),
    Resignation: (
        <span className="w-8 h-8 rounded-lg bg-[#fee2e2] text-[#b91c1c] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </span>
    ),
    Termination: (
        <span className="w-8 h-8 rounded-lg bg-[#fef08a] text-[#854d0e] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" /></svg>
        </span>
    ),
    "Contract Expiration": (
        <span className="w-8 h-8 rounded-lg bg-[#e5e7eb] text-[#374151] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </span>
    ),
    "Department Transfer": (
        <span className="w-8 h-8 rounded-lg bg-[#dbeafe] text-[#1d4ed8] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        </span>
    ),
    "Salary Change": (
        <span className="w-8 h-8 rounded-lg bg-[#fef3c7] text-[#92400e] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </span>
    ),
    Discipline: (
        <span className="w-8 h-8 rounded-lg bg-[#fee2e2] text-[#991b1b] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        </span>
    ),
    Reward: (
        <span className="w-8 h-8 rounded-lg bg-[#dcfce7] text-[#166534] flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
        </span>
    ),
};

// ============================================================================
// KHU VỰC 2: CÁC HÀM PARSER (FORMAT DỮ LIỆU TỪ BACKEND)
// Chuyển đổi dữ liệu JSON khô khan thành format chung (ReviewEntry) để hiển thị
// ============================================================================

// 2.1. Parse Đơn thông thường (Nghỉ phép, OT, Duyệt nhân viên mới...)
const parseRequest = (dto: RequestResponseDTO): ReviewEntry => {
    let appType = "Annual Leave";
    if (dto.requestType === "OT") appType = "Overtime";
    if (dto.requestType === "OTHER") appType = "Other Request";
    if (dto.requestType === "APPROVAL") appType = "Onboarding Approval";

    let status: AppStatus = "Pending";
    if (dto.status === "APPROVED") status = "Approved";
    if (dto.status === "REJECTED") status = "Rejected";

    const dReq = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const dateRequested = dReq.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    let details = "N/A";
    let sub = "";
    const rawReason = dto.reason || "";

    if (dto.requestType === "LEAVE") {
        const dStart = dto.startDate ? new Date(dto.startDate) : new Date();
        details = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (dto.endDate && dto.endDate !== dto.startDate) {
            const dEnd = new Date(dto.endDate);
            details += ` - ${dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
        }
        const match = rawReason.match(/^\[(.*?)\] (.*)$/);
        if (match) { appType = match[1]; sub = match[2]; } else { sub = rawReason; }
    } else if (dto.requestType === "OT") {
        const match = rawReason.match(/^(.*?) - (.*?) \| (.*)$/);
        const dStart = dto.startDate ? new Date(dto.startDate) : new Date();
        if (match) {
            details = `${dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}, ${match[1]} - ${match[2]}`;
            sub = match[3];
        } else {
            sub = rawReason;
            details = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        }
    } else if (dto.requestType === "OTHER") {
        const dStart = dto.startDate ? new Date(dto.startDate) : new Date();
        details = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        sub = rawReason || "Other Request";
    } else if (dto.requestType === "APPROVAL") {
        details = "New Employee Onboarding";
        sub = "Review and approve profile setup";
    }

    const nameParts = (dto.employeeName || "Unknown").split(" ");
    const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0][0];

    const colors = ["#a78bfa", "#f48c57", "#60a5fa", "#34d399", "#f472b6", "#facc15"];
    let hash = 0;
    for (let i = 0; i < (dto.employeeName || "").length; i++) hash = (dto.employeeName || "").charCodeAt(i) + ((hash << 5) - hash);
    const avatarColor = colors[Math.abs(hash) % colors.length];

    return {
        id: dto.requestId as string, initials: initials.toUpperCase(), avatarColor,
        employeeName: dto.employeeName || "Unknown", position: dto.deptName || "N/A",
        appType, rawType: dto.requestType, dateRequested, details, sub, status,
    };
};

// 2.2. Parse Đơn Offboarding (Nghỉ việc, Sa thải...)
const parseOffboardingRequest = (dto: OffboardingResponse, isHR: boolean): ReviewEntry => {
    let status: AppStatus = "Pending";
    if (dto.status === "PENDING") status = "Pending";
    else if (dto.status === "MANAGER_APPROVED") status = isHR ? "Pending" : "Approved";
    else if (dto.status === "HR_CONFIRMED" || dto.status === "COMPLETED") status = "Approved";
    else if (dto.status === "CANCELLED") status = "Rejected";

    const dReq = dto.requestDate ? new Date(dto.requestDate) : new Date();
    const dateRequested = dReq.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    let appType = "Resignation";
    if (dto.type === "TERMINATED") appType = "Termination";
    if (dto.type === "CONTRACT_EXPIRED") appType = "Contract Expiration";

    let details = dto.expectedLastDay ? `Expected Last Day: ${new Date(dto.expectedLastDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : "Offboarding";
    if (dto.officialLastDay) details = `Official Last Day: ${new Date(dto.officialLastDay).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

    const sub = dto.reason || "No reason provided";

    const nameParts = (dto.employeeName || "Unknown").split(" ");
    const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0][0];

    const colors = ["#a78bfa", "#f48c57", "#60a5fa", "#34d399", "#f472b6", "#facc15"];
    let hash = 0;
    for (let i = 0; i < (dto.employeeName || "").length; i++) hash = (dto.employeeName || "").charCodeAt(i) + ((hash << 5) - hash);
    const avatarColor = colors[Math.abs(hash) % colors.length];

    return {
        id: dto.offboardingId, initials: initials.toUpperCase(), avatarColor,
        employeeName: dto.employeeName || "Unknown", position: dto.departmentName || dto.positionTitle || "N/A",
        appType, rawType: "OFFBOARDING", dateRequested, details, sub, status, rawOffboardingData: dto,
    };
};

// 2.3. Parse Đơn Thay đổi nhân sự (Chuyển phòng, Đổi lương, Khen thưởng...)
const parsePersonnelChange = (dto: PersonnelChangeResponseDTO, isHR: boolean): ReviewEntry => {
    let status: AppStatus = "Pending";
    if (dto.status === "PENDING") status = "Pending";
    else if (dto.status === "MANAGER_APPROVED") status = isHR ? "Pending" : "Approved";
    else if (dto.status === "HR_CONFIRMED") status = "Approved";
    else if (dto.status === "REJECTED") status = "Rejected";

    const dReq = dto.createdAt ? new Date(dto.createdAt) : new Date();
    const dateRequested = dReq.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const appType = CHANGE_TYPE_LABELS[dto.changeType] || dto.changeType;

    let details = dto.departmentName || "Personnel Change";
    if (dto.changeType === "DEPARTMENT_TRANSFER") details = `${dto.oldValues?.departmentName || "Old Dept"} ➡️ ${dto.newValues?.departmentName || "New Dept"}`;
    else if (dto.changeType === "SALARY_CHANGE") details = `Salary update to ${dto.newValues?.baseSalary?.toLocaleString() || "N/A"}`;
    else if (dto.changeType === "DISCIPLINE" || dto.changeType === "REWARD") details = dto.reason;

    const sub = dto.reason || "No reason provided";

    const nameParts = (dto.employeeName || "Unknown").split(" ");
    const initials = nameParts.length > 1 ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}` : nameParts[0][0];

    const colors = ["#a78bfa", "#f48c57", "#60a5fa", "#34d399", "#f472b6", "#facc15"];
    let hash = 0;
    for (let i = 0; i < (dto.employeeName || "").length; i++) hash = (dto.employeeName || "").charCodeAt(i) + ((hash << 5) - hash);
    const avatarColor = colors[Math.abs(hash) % colors.length];

    return {
        id: dto.changeId, initials: initials.toUpperCase(), avatarColor,
        employeeName: dto.employeeName || "Unknown", position: dto.departmentName || "N/A",
        appType, rawType: "PERSONNEL_CHANGE", dateRequested, details, sub, status, rawPersonnelData: dto,
    };
};


// ============================================================================
// KHU VỰC 3: MAIN COMPONENT & STATE MANAGEMENT
// ============================================================================
const ReviewRequests: React.FC = () => {
    const { hasRole } = useAuth();

    // States quản lý dữ liệu
    const [entries, setEntries] = useState<ReviewEntry[]>([]);
    const [loading, setLoading] = useState(true);

    // States quản lý giao diện
    const [activeTab, setActiveTab] = useState<AppStatus>("Pending");
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    // States quản lý Modals
    const [selectedDetail, setSelectedDetail] = useState<ReviewEntry | null>(null);
    const [hrConfirmModal, setHRConfirmModal] = useState<{
        isOpen: boolean;
        entry: ReviewEntry | null;
        isLoading: boolean;
    }>({ isOpen: false, entry: null, isLoading: false });

    // ============================================================================
    // KHU VỰC 4: LOGIC TẢI DỮ LIỆU & EFFECTS (CORE LOGIC & LIFECYCLES)
    // ============================================================================
    const loadData = async () => {
        setLoading(true);
        try {
            const isHR = hasRole("HR");
            const [data, offData, pcPending, pcMine] = await Promise.all([
                getAllRequestsForReview(),
                offboardingService.getActiveRequests().catch(() => ({ data: [] })),
                personnelChangeService.getPending().catch(() => ({ data: [] })),
                personnelChangeService.getMyRequests().catch(() => ({ data: [] })),
            ]);

            const parsedReqs = data.map(parseRequest);
            const parsedOffs = offData.data ? offData.data.map((dto: OffboardingResponse) => parseOffboardingRequest(dto, isHR)) : [];

            // Combine pending and my-requests for PC, avoiding duplicates
            const pcMap = new Map<string, PersonnelChangeResponseDTO>();
            if (pcPending.data) pcPending.data.forEach(dto => pcMap.set(dto.changeId, dto));
            if (pcMine.data) pcMine.data.forEach(dto => pcMap.set(dto.changeId, dto));
            const parsedPCs = Array.from(pcMap.values()).map((dto) => parsePersonnelChange(dto, isHR));

            setEntries([...parsedReqs, ...parsedOffs, ...parsedPCs]);
        } catch (err) {
            console.error("Failed to load requests", err);
        } finally {
            setLoading(false);
        }
    };

    // Chạy lần đầu khi mở màn hình
    useEffect(() => {
        loadData();
    }, []);

    // Reset về trang 1 mỗi khi chuyển Tab
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab]);


    // ============================================================================
    // KHU VỰC 5: XỬ LÝ SỰ KIỆN NÚT BẤM (ACTION HANDLERS)
    // ============================================================================

    // 🔴 [NÚT BẤM]: APPROVE ĐƠN
    const approve = async (entry: ReviewEntry) => {
        try {
            if (entry.rawType === "APPROVAL") {
                await processApprovalRequest(entry.id, "APPROVED");
            } else if (entry.rawType === "OFFBOARDING") {
                const offboardingData = entry.rawOffboardingData;
                if (offboardingData?.status === "PENDING" && hasRole("MANAGER")) {
                    await offboardingService.managerApprove(entry.id);
                } else if (offboardingData?.status === "MANAGER_APPROVED" && hasRole("HR")) {
                    setHRConfirmModal({ isOpen: true, entry: entry, isLoading: false });
                    return; // Dừng luồng để chờ HR điền Modal
                } else {
                    await offboardingService.managerApprove(entry.id);
                }
            } else if (entry.rawType === "PERSONNEL_CHANGE") {
                const pcData = entry.rawPersonnelData;
                if (hasRole("HR")) {
                    if (pcData?.changeType !== "DEPARTMENT_TRANSFER" || pcData?.status === "MANAGER_APPROVED") {
                        await personnelChangeService.hrConfirm(entry.id);
                    } else {
                        throw new Error("Department transfers must be approved by a Manager before HR confirmation.");
                    }
                } else if (hasRole("MANAGER")) {
                    await personnelChangeService.managerApprove(entry.id);
                }
            } else {
                await approveRequest(entry.id);
            }
            loadData(); // Load lại data sau khi duyệt thành công
        } catch (e: any) {
            console.error("Approve failed", e);
            alert(e?.response?.data?.message || e?.response?.data?.error || "Approve failed. Please check the console for details.");
        }
    };

    // 🔴 [NÚT BẤM]: REJECT ĐƠN
    const reject = async (entry: ReviewEntry) => {
        try {
            if (entry.rawType === "APPROVAL") {
                const reason = window.prompt("Reason for rejection:");
                if (reason === null) return;
                if (!reason.trim()) { alert("Reason is required to reject an onboarding approval."); return; }
                await processApprovalRequest(entry.id, "REJECTED", reason.trim());
            } else if (entry.rawType === "OFFBOARDING") {
                const reason = window.prompt("Reason for cancellation:");
                if (reason === null) return;
                if (!reason.trim()) { alert("Reason is required to cancel an offboarding request."); return; }
                await offboardingService.cancel(entry.id, { cancelReason: reason.trim() });
            } else if (entry.rawType === "PERSONNEL_CHANGE") {
                const reason = window.prompt("Reason for rejection:");
                if (reason === null) return;
                if (!reason.trim()) { alert("Reason is required to reject a personnel change."); return; }
                await personnelChangeService.reject(entry.id, reason.trim());
            } else {
                await rejectRequest(entry.id);
            }
            loadData(); // Load lại data sau khi từ chối thành công
        } catch (e: any) {
            console.error("Reject failed", e);
            alert(e?.response?.data?.message || e?.response?.data?.error || "Reject failed. Please check the console for details.");
        }
    };

    // 🔴 [NÚT BẤM]: LƯU THÔNG TIN Ở MODAL CỦA HR (Dành riêng cho Offboarding)
    const handleHRConfirm = async (officialLastDay: string) => {
        if (!hrConfirmModal.entry?.rawOffboardingData) {
            alert("Missing offboarding data");
            return;
        }
        setHRConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
            await offboardingService.hrConfirm(hrConfirmModal.entry.id, { officialLastDay });
            setHRConfirmModal({ isOpen: false, entry: null, isLoading: false });
            loadData();
        } catch (e: any) {
            console.error("HR confirm failed", e);
            throw e;
        }
    };

    // ============================================================================
    // KHU VỰC 6: CHUẨN BỊ DỮ LIỆU HIỂN THỊ (UI PREPARATION)
    // Tính toán phân trang và đếm số lượng cho Tab
    // ============================================================================
    const displayedAll = entries.filter((e) => e.status === activeTab);
    const pendingCount = entries.filter((e) => e.status === "Pending").length;
    const totalPages = Math.ceil(displayedAll.length / ITEMS_PER_PAGE) || 1;
    const displayed = displayedAll.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const tabs: { label: string; status: AppStatus; badge?: number }[] = [
        { label: "Pending", status: "Pending", badge: pendingCount },
        { label: "Approved", status: "Approved" },
        { label: "Rejected", status: "Rejected" },
    ];


    // ============================================================================
    // KHU VỰC 7: VẼ GIAO DIỆN (RENDER JSX)
    // ============================================================================
    return (
        <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div><h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">Request Review</h1></div>
            </div>

            {/* Main Panel */}
            <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">

                {/* Thanh điều hướng Tabs */}
                <div className="flex border-b border-[#e2e8f0] px-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.status}
                            onClick={() => setActiveTab(tab.status)}
                            className={`relative flex items-center gap-2 py-4 px-2 mr-6 text-sm font-semibold transition-colors
                ${activeTab === tab.status ? "text-[#0d9488] border-b-2 border-[#0d9488]" : "text-[#64748b] hover:text-[#334155]"}`}
                        >
                            {tab.label}
                            {tab.badge !== undefined && tab.badge > 0 && (
                                <span className="ml-1 min-w-[20px] h-5 px-1.5 rounded-full bg-[#0d9488] text-white text-[10px] font-bold flex items-center justify-center">
                                    {tab.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Bảng dữ liệu */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-[#e2e8f0]">
                                {["Employee Name", "Request Type", "Date Requested", "Details", "Action"].map((h) => (
                                    <th key={h} className="px-5 py-3 text-xs font-bold text-[#94a3b8] uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#f1f5f9]">
                            {loading ? (
                                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#94a3b8]">Loading requests...</td></tr>
                            ) : displayed.length === 0 ? (
                                <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-[#94a3b8] italic">No {activeTab.toLowerCase()} requests.</td></tr>
                            ) : (
                                displayed.map((entry) => (
                                    <tr key={entry.id} className="hover:bg-[#f8fafc] transition-colors">
                                        {/* Cột Tên nhân viên */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: entry.avatarColor }}>
                                                    {entry.initials}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-[#1e293b] text-sm">{entry.employeeName}</p>
                                                    <p className="text-xs text-[#94a3b8]">{entry.position}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Cột Loại Đơn */}
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-2.5">
                                                {typeIcon[entry.appType] || typeIcon["Annual Leave"]}
                                                <span className="text-sm font-semibold text-[#1e293b]">{entry.appType}</span>
                                            </div>
                                        </td>

                                        {/* Cột Ngày xin */}
                                        <td className="px-5 py-4 text-sm text-[#475569]">{entry.dateRequested}</td>

                                        {/* Cột Nút View Details */}
                                        <td className="px-5 py-4">
                                            <button onClick={() => setSelectedDetail(entry)} className="px-3 py-1.5 text-xs font-bold text-[#0d9488] bg-[#f0fdf4] border border-[#86efac] hover:bg-[#dcfce7] rounded-lg transition-colors">
                                                View Details
                                            </button>
                                        </td>

                                        {/* Cột Action (Nút Approve/Reject hoặc Hiển thị Trạng thái) */}
                                        <td className="px-5 py-4">
                                            {activeTab === "Pending" ? (
                                                <div className="flex items-center gap-2">
                                                    {/* Phân nhánh duyệt cho HR */}
                                                    {(entry.rawType === "OFFBOARDING" || entry.rawType === "PERSONNEL_CHANGE") &&
                                                        (entry.rawOffboardingData?.status === "MANAGER_APPROVED" || entry.rawPersonnelData?.status === "MANAGER_APPROVED") &&
                                                        hasRole("HR") ? (
                                                        <button onClick={() => approve(entry)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition-all">
                                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                            Confirm
                                                        </button>
                                                    ) : (entry.rawType === "OFFBOARDING" || entry.rawType === "PERSONNEL_CHANGE") &&
                                                        (entry.rawOffboardingData?.status === "MANAGER_APPROVED" || entry.rawPersonnelData?.status === "MANAGER_APPROVED") ? (
                                                        <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#fef3c7] text-[#854d0e]">Awaiting HR Confirm</span>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => approve(entry)} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0d9488] hover:bg-[#0f766e] text-white text-xs font-bold rounded-lg shadow-sm transition-all">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                                                Approve
                                                            </button>
                                                            <button onClick={() => reject(entry)} className="flex items-center gap-1.5 px-3.5 py-1.5 border border-[#fca5a5] bg-white hover:bg-[#fef2f2] text-[#dc2626] text-xs font-bold rounded-lg transition-all">
                                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                {entry.rawType === "OFFBOARDING" ? "Cancel" : "Reject"}
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            ) : (
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${activeTab === "Approved" ? "bg-[#dcfce7] text-[#15803d]" : "bg-[#fee2e2] text-[#dc2626]"}`}>
                                                    {activeTab}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Thanh Phân trang */}
                <div className="flex justify-between items-center px-5 py-4 border-t border-[#f1f5f9]">
                    <p className="text-sm text-[#64748b]">
                        Showing <span className="font-bold text-[#0f172a]">{displayedAll.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="font-bold text-[#0f172a]">{Math.min(currentPage * ITEMS_PER_PAGE, displayedAll.length)}</span> of <span className="font-bold text-[#0f172a]">{displayedAll.length}</span> {activeTab.toLowerCase()} requests
                    </p>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-sm text-[#334155] hover:bg-gray-50 disabled:text-[#94a3b8] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
                            Previous
                        </button>
                        <div className="flex items-center px-2 text-sm font-medium text-[#64748b]">Page {currentPage} of {totalPages}</div>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1.5 rounded-lg border border-[#e2e8f0] text-sm text-[#334155] hover:bg-gray-50 disabled:text-[#94a3b8] disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors">
                            Next
                        </button>
                    </div>
                </div>
            </div>

            {/* Popup xem chi tiết (View Details Modal) */}
            {selectedDetail && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        <div className="flex justify-between items-center px-6 py-5 border-b border-[#e2e8f0]">
                            <h3 className="text-lg font-bold text-[#0f172a]">Request Details</h3>
                            <button onClick={() => setSelectedDetail(null)} className="text-[#94a3b8] hover:text-[#64748b] transition-colors"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div>
                                <h4 className="text-sm font-bold text-[#334155] mb-1">{selectedDetail.appType}</h4>
                                <p className="text-sm text-[#0f172a] font-medium">{selectedDetail.details}</p>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-[#334155] mb-1">Reason / Description</h4>
                                <div className="p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]"><p className="text-sm text-[#475569] whitespace-pre-wrap">{selectedDetail.sub || "No reason provided."}</p></div>
                            </div>
                        </div>
                        <div className="flex justify-end px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
                            <button onClick={() => setSelectedDetail(null)} className="px-5 py-2 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] text-white text-sm font-semibold shadow-sm transition-colors">Close</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Popup điền ngày của HR (Dành riêng cho Offboarding) */}
            <HRConfirmOffboardingModal
                isOpen={hrConfirmModal.isOpen}
                offboarding={hrConfirmModal.entry?.rawOffboardingData || null}
                onConfirm={handleHRConfirm}
                onCancel={() => setHRConfirmModal({ isOpen: false, entry: null, isLoading: false })}
                isLoading={hrConfirmModal.isLoading}
            />
        </div>
    );
};

export default ReviewRequests;