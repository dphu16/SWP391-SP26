import React, { useState, useEffect, useRef } from "react";
import { useCurrentUser } from "../../hooks/useCurrentUser";
// FIX 1: Removed the duplicate import block. Merged into a single import that
// includes all required exports: getLeaveBalance and LeaveBalanceResponse.
import {
  getMyRequests,
  createRequest,
  updateRequest,
  deleteRequest,
  getLeaveBalance,
  type RequestRecord as RequestRecordApi,
  type CreateRequestDTO,
  type LeaveBalanceResponse,
} from "../../services/requestService";
import {
  offboardingService,
  type OffboardingResponse,
} from "../../services/offboardingService";
import { personnelChangeService } from "../../services/personnelChangeService";
// searchEmployees is now used in ApplicationModals
import { getLookupDepartments, getLookupPositions } from "../../services/lookupService";
import {
  type AttendanceEmployee,
  LeaveModalContent,
  OTModalContent,
  OtherModalContent,
  ResignationModalContent,
  PersonnelChangeModalContent,
} from "./ApplicationModals";

// ── Types ──────────────────────────────────────────────────────────────────
type AppStatus = "Pending" | "Approved" | "Rejected";
type AppType =
  | "Leave"
  | "OT"
  | "Other" | "Resignation" | "PersonnelChange";
type ModalType =
  | "Leave"
  | "OT"
  | "Other"
  | "Resignation"
  | "PersonnelChange"
  | null;

// FIX 4: AttendanceEmployee is imported from ApplicationModals

interface RequestRecord {
  id: string;
  type: AppType;
  typeLabel: string;
  dateRequested: string;
  datesAffected: string;
  status: AppStatus;
  raw: RequestRecordApi;
}

const mapApiRequest = (r: RequestRecordApi): RequestRecord => {
  let type: AppType = "Leave";
  let typeLabel = "Leave Application";
  if (r.requestType === "OT") {
    type = "OT";
    typeLabel = "Overtime Request";
  } else if (r.requestType === "OTHER") {
    type = "Other";
    typeLabel = "Other Request";
  }

  let status: AppStatus = "Pending";
  if (r.status === "APPROVED") status = "Approved";
  else if (r.status === "REJECTED") status = "Rejected";

  const dReq = r.createdAt ? new Date(r.createdAt) : new Date();
  const dateRequested = dReq.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const dStart = r.startDate ? new Date(r.startDate) : new Date();
  const textStart = dStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  OT: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  Other: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16m-7 6h7"
      />
    </svg>
  ),
  Resignation: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  ),
  PersonnelChange: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
      />
    </svg>
  ),
};

const typeBg: Record<AppType, string> = {
  Leave: "bg-[#ccfbf1] text-[#0f766e]",
  OT: "bg-[#dcfce7] text-[#15803d]",
  Other: "bg-[#e0f2fe] text-[#0369a1]",
  Resignation: "bg-[#fee2e2] text-[#b91c1c]",
  PersonnelChange: "bg-[#e0e7ff] text-[#4338ca]",
};

const statusBadge: Record<AppStatus, string> = {
  Pending: "bg-[#fef3c7] text-[#b45309]",
  Approved: "bg-[#dcfce7] text-[#15803d]",
  Rejected: "bg-[#fee2e2] text-[#dc2626]",
};

// EmployeeSearch is now extracted to ApplicationModals

// ── Canonical blank form state ─────────────────────────────────────────────
// FIX 3: Centralised the reset object so closeModal and handleEdit always use
// the exact same shape — no phantom fields (shiftDate, targetShiftDate) and no
// missing fields (otherDate).
const BLANK_FORM = {
  leaveType: "Annual Leave",
  startDate: "",
  endDate: "",
  reason: "",
  otDate: "",
  otStartTime: "",
  otEndTime: "",
  otherDate: "",
  pcType: "DEPARTMENT_TRANSFER",
  newDepartmentId: "",
  newPositionId: "",
  newTitle: "",
  newSalary: "",
};

// ── Main component ─────────────────────────────────────────────────────────
const Applications: React.FC = () => {
  const currentUser = useCurrentUser();
  const [modal, setModal] = useState<ModalType>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [editRequestId, setEditRequestId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [positions, setPositions] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [pcEmployee, setPcEmployee] = useState<AttendanceEmployee | null>(null);
  const [formData, setFormData] = useState(BLANK_FORM);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalanceResponse | null>(
    null,
  );
  const [leaveBalanceLoading, setLeaveBalanceLoading] = useState(false);
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
      const [regularReqs, offboardingReqs] = await Promise.all([
        getMyRequests(currentUser.employeeId),
        offboardingService.getActiveRequests().catch(() => ({ data: [] })),
      ]);

      const mappedRegular = regularReqs.map(mapApiRequest);

      const myOffboarding = (offboardingReqs.data || [])
        .filter(
          (o: OffboardingResponse) =>
            o.employeeId === currentUser.employeeId && o.type === "RESIGNATION",
        )
        .map(
          (o: OffboardingResponse): RequestRecord => ({
            id: o.offboardingId,
            type: "Resignation",
            typeLabel: "Resignation",
            dateRequested: new Date(o.requestDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }),
            datesAffected: o.expectedLastDay
              ? new Date(o.expectedLastDay).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })
              : "N/A",
            status: (o.status === "PENDING"
              ? "Pending"
              : o.status === "CANCELLED"
                ? "Rejected"
                : "Approved") as AppStatus,
            raw: {} as RequestRecordApi,
          }),
        );

      setRequests(
        [...mappedRegular, ...myOffboarding].sort(
          (a, b) =>
            new Date(b.dateRequested).getTime() -
            new Date(a.dateRequested).getTime(),
        ),
      );
    } catch (error) {
      console.error("Error fetching requests", error);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [currentUser?.employeeId]);

  useEffect(() => {
    if (modal === "PersonnelChange") {
      getLookupDepartments()
        .then((data) => setDepartments(data))
        .catch(() => { });
      getLookupPositions()
        .then((data) => {
          setPositions(
            data.map((p) => ({
              id: p.id,
              name: p.name || p.title || "",
            }))
          );
        })
        .catch(() => { });
    }
  }, [modal]);

  // FIX 3 (cont.): closeModal now uses BLANK_FORM — no phantom fields.
  const closeModal = () => {
    setModal(null);
    setPcEmployee(null);
    setFormData(BLANK_FORM);
    setSubmitError(null);
    setEditRequestId(null);
  };

  const handleDropdownItemClick = (type: ModalType) => {
    setModal(type);
    setMenuOpen(false);
    setEditRequestId(null);
    if (type === "Leave" && currentUser?.employeeId) {
      setLeaveBalanceLoading(true);
      getLeaveBalance(currentUser.employeeId, new Date().getFullYear())
        .then(setLeaveBalance)
        .catch(() => setLeaveBalance(null))
        .finally(() => setLeaveBalanceLoading(false));
    }
  };

  const handleSubmit = async () => {
    if (!currentUser?.employeeId) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      let dto: CreateRequestDTO;
      if (modal === "Leave") {
        if (!formData.startDate || !formData.endDate)
          throw new Error("Please select start and end dates.");
        dto = {
          employeeId: currentUser.employeeId,
          requestType: "LEAVE",
          startDate: formData.startDate,
          endDate: formData.endDate,
          reason: `[${formData.leaveType}] ${formData.reason}`,
        };
      } else if (modal === "OT") {
        if (!formData.otDate || !formData.otStartTime || !formData.otEndTime)
          throw new Error("Please fill in all OT date and time fields.");
        dto = {
          employeeId: currentUser.employeeId,
          requestType: "OT",
          startDate: formData.otDate,
          endDate: formData.otDate,
          reason: `${formData.otStartTime} - ${formData.otEndTime} | ${formData.reason}`,
        };
      } else if (modal === "Other") {
        if (!formData.otherDate || !formData.reason)
          throw new Error(
            "Please fill in the date and reason for the request.",
          );
        dto = {
          employeeId: currentUser.employeeId,
          requestType: "OTHER",
          startDate: formData.otherDate,
          endDate: formData.otherDate,
          reason: formData.reason,
        };
      } else if (modal === "Resignation") {
        if (!formData.startDate)
          throw new Error("Please select an expected last day.");
        if (!formData.reason) throw new Error("Please specify a reason.");
        await offboardingService.createResignation(currentUser.employeeId, {
          type: "RESIGNATION",
          reason: formData.reason,
          expectedLastDay: formData.startDate,
        });
        closeModal();
        loadRequests();
        setSubmitting(false);
        return;
      } else if (modal === "PersonnelChange") {
        if (!pcEmployee) throw new Error("Please select an employee.");
        if (!formData.reason) throw new Error("Please specify a reason.");
        await personnelChangeService.create({
          employeeId: pcEmployee.employeeId,
          changeType: formData.pcType as any,
          reason: formData.reason,
          newDepartmentId: formData.newDepartmentId || undefined,
          newPositionId: formData.newPositionId || undefined,
          newTitle: formData.newTitle || undefined,
          newSalary: formData.newSalary
            ? Number(formData.newSalary)
            : undefined,
        });
        closeModal();
        loadRequests();
        setSubmitting(false);
        return;
      } else return;

      if (editRequestId) {
        await updateRequest(editRequestId, dto!);
      } else {
        await createRequest(dto!);
      }
      closeModal();
      loadRequests();
    } catch (error: any) {
      setSubmitError(
        error.response?.data?.message ||
        error.message ||
        "Failed to submit request.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, status: AppStatus, type: AppType) => {
    if (status !== "Pending") return;
    try {
      if (type === "Resignation") {
        const reason = window.prompt("Reason for cancellation:");
        if (!reason) return;
        await offboardingService.cancel(id, { cancelReason: reason });
      } else {
        await deleteRequest(id);
      }
      loadRequests();
    } catch (error: any) {
      console.error(
        error.response?.data?.message || "Failed to delete request.",
      );
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
    } else if (r.type === "Other") {
      parsedReason = raw.reason || "";
    }

    // FIX 3 (cont.): handleEdit resets to BLANK_FORM first then overlays only
    // the fields that are relevant — no phantom shiftDate/targetShiftDate keys.
    setFormData({
      ...BLANK_FORM,
      leaveType,
      startDate: r.type === "Leave" ? raw.startDate || "" : "",
      endDate: r.type === "Leave" ? raw.endDate || "" : "",
      reason: parsedReason,
      otDate: r.type === "OT" ? raw.startDate || "" : "",
      otStartTime,
      otEndTime,
      otherDate: r.type === "Other" ? raw.startDate || "" : "",
    });
  };

  // FIX 2: Rewrote the modal title as a plain lookup object to avoid the broken
  // nested ternary that had mismatched braces and caused a syntax error.
  const modalTitle: Record<NonNullable<ModalType>, string> = {
    Leave: "Leave Application",
    OT: "OT Application",
    Other: "Other Request",
    Resignation: "Resignation Request",
    PersonnelChange: "Personnel Change",
  };

  return (
    <div className="flex flex-col pb-10 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-[28px] font-bold text-[#1a1c21] tracking-tight">
            Application Management
          </h1>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium text-sm shadow-sm transition-all"
          >
            <svg
              className="w-5 h-5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span>New Request</span>
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white border border-[#e2e8f0] rounded-xl shadow-lg z-10 overflow-hidden">
              <button
                onClick={() => handleDropdownItemClick("Leave")}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]"
              >
                Leave Application
              </button>
              <button
                onClick={() => handleDropdownItemClick("OT")}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors border-b border-[#f1f5f9]"
              >
                OT Application
              </button>
              <button
                onClick={() => handleDropdownItemClick("Other")}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition-colors"
              >
                Other Request
              </button>
              <button
                onClick={() => handleDropdownItemClick("Resignation")}
                className="w-full text-left px-4 py-2.5 text-sm font-semibold text-black hover:bg-red-50 transition-colors border-b border-[#f1f5f9]"
              >
                Application for Resignation
              </button>
              {currentUser?.roles?.some((r) =>
                ["HR", "MANAGER", "ROLE_HR", "ROLE_MANAGER"].includes(r),
              ) && (
                  <button
                    onClick={() => handleDropdownItemClick("PersonnelChange")}
                    className="w-full text-left px-4 py-2.5 text-sm font-semibold text-black hover:bg-indigo-50 transition-colors"
                  >
                    Personnel Change
                  </button>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white border border-[#e2e8f0] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex justify-between items-center p-5 border-b border-[#e2e8f0]">
          <h2 className="text-lg font-bold text-[#0f172a]">Recent Activity</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                {[
                  "Request Type",
                  "Date Requested",
                  "Dates Affected",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-xs font-bold text-[#64748b] uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {loadingRequests ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-[#64748b]"
                  >
                    Loading requests...
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-5 py-8 text-center text-sm text-[#64748b]"
                  >
                    No recent requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-[#f8fafc] transition-colors"

                  >  <td className="px-5 py-4">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${typeBg[r.type]}`}
                        >
                          {typeIcon[r.type]}
                        </div>
                        <span className="font-semibold text-[#1e293b] text-sm">
                          {r.typeLabel}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569]">
                      {r.dateRequested}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#475569]">
                      {r.datesAffected}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold ${statusBadge[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEdit(r)}
                          disabled={
                            r.status !== "Pending" || r.type === "Resignation"

                          } className={`transition-colors ${r.status !== "Pending" || r.type === "Resignation" ? "text-gray-300 cursor-not-allowed" : "text-[#94a3b8] hover:text-[#0ea5e9]"}`}
                          title={
                            r.status === "Pending"
                              ? "Edit request"
                              : "Cannot edit request"
                          }
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(r.id, r.status, r.type)}
                          disabled={r.status !== "Pending"}
                          className={`transition-colors ${r.status !== "Pending" ? "text-gray-300 cursor-not-allowed" : "text-[#94a3b8] hover:text-[#ef4444]"}`}
                          title={
                            r.status === "Pending"
                              ? "Delete request"
                              : "Cannot delete approved/rejected request"
                          }
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
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
                {/* FIX 2: Clean title lookup — no broken nested ternary. */}
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {editRequestId ? "Edit" : "New"} {modalTitle[modal]}
                </h3>
                <p className="text-sm text-[#64748b] mt-0.5">
                  {modal === "Leave" && "Submit a leave request for approval."}
                  {modal === "OT" &&
                    "Register your overtime hours for approval."}
                  {modal === "Other" &&
                    "Submit a general request for approval."}
                  {modal === "Resignation" &&
                    "Submit your resignation request to HR/Manager."}
                  {modal === "PersonnelChange" &&
                    "Propose a personnel change to an employee."}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {submitError && (
                <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  {submitError}
                </div>
              )}

              {modal === "Leave" && (
                <LeaveModalContent
                  leaveBalanceLoading={leaveBalanceLoading}
                  leaveBalance={leaveBalance}
                  formData={formData}
                  setFormData={setFormData}
                />
              )}

              {modal === "OT" && <OTModalContent formData={formData} setFormData={setFormData} />}

              {modal === "Other" && <OtherModalContent formData={formData} setFormData={setFormData} />}

              {modal === "Resignation" && <ResignationModalContent formData={formData} setFormData={setFormData} />}

              {modal === "PersonnelChange" && (
                <PersonnelChangeModalContent
                  formData={formData}
                  setFormData={setFormData}
                  pcEmployee={pcEmployee}
                  setPcEmployee={setPcEmployee}
                  departments={departments}
                  positions={positions}
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 bg-[#f8fafc] border-t border-[#e2e8f0]">
              <button
                onClick={closeModal}
                className="px-5 py-2 rounded-lg border border-[#e2e8f0] text-sm font-semibold text-[#334155] hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-5 py-2 rounded-lg bg-[#0d9488] hover:bg-[#0f766e] disabled:opacity-50 text-white text-sm font-semibold shadow-sm transition-colors"
              >
                {submitting
                  ? "Submitting..."
                  : editRequestId
                    ? "Save Changes"
                    : "Submit Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Applications;
