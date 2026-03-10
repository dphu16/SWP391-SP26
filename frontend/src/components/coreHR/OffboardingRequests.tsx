import React, { useState, useEffect, useCallback } from "react";
import {
  offboardingService,
  type OffboardingResponse,
} from "../../services/offboardingService";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";

// ─── Status Config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; border: string; label: string }
> = {
  PENDING: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border border-amber-200",
    label: "Chờ duyệt",
  },
  MANAGER_APPROVED: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border border-blue-200",
    label: "Đã duyệt",
  },
  HR_CONFIRMED: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/5",
    border: "border border-primary/20",
    label: "HR xác nhận",
  },
  CANCELLED: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
    border: "border border-gray-200",
    label: "Đã hủy",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border border-emerald-200",
    label: "Hoàn tất",
  },
};

const TYPE_LABELS: Record<string, string> = {
  RESIGNATION: "Nghỉ tự nguyện",
  TERMINATED: "Sa thải",
  CONTRACT_EXPIRED: "Hết hạn HĐ",
};

// ─── Avatar ────────────────────────────────────────────────────────────────
const Avatar: React.FC<{ name: string; url?: string }> = ({ name, url }) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";
  const colors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600",
    "bg-purple-100 text-purple-600",
    "bg-amber-100 text-amber-700",
    "bg-rose-100 text-rose-600",
  ];
  const colorIdx = (name?.charCodeAt(0) ?? 0) % colors.length;

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="w-9 h-9 rounded-full object-cover ring-2 ring-white flex-shrink-0"
      />
    );
  }
  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${colors[colorIdx]}`}
    >
      {initials}
    </div>
  );
};

// ─── Status Badge ──────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["PENDING"];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${cfg.text} ${cfg.bg} ${cfg.border}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

// ─── Skeleton Row ──────────────────────────────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr className="border-b border-gray-100">
    <td className="px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-9 h-9 rounded-full" />
        <div className="space-y-1.5">
          <div className="skeleton h-3.5 w-32 rounded" />
          <div className="skeleton h-2.5 w-20 rounded" />
        </div>
      </div>
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-24 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-20 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-6 w-20 rounded-full" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-24 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-8 w-20 rounded-lg" />
    </td>
  </tr>
);

// ─── Create Request Modal ──────────────────────────────────────────────────
const CreateRequestModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: {
    type: string;
    reason: string;
    expectedLastDay?: string;
    employeeId?: string;
  }) => void;
  mode: "resign" | "propose";
  loading: boolean;
}> = ({ onClose, onSubmit, mode, loading }) => {
  const [type, setType] = useState(
    mode === "resign" ? "RESIGNATION" : "TERMINATED"
  );
  const [reason, setReason] = useState("");
  const [expectedLastDay, setExpectedLastDay] = useState("");
  const [employeeId, setEmployeeId] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      type,
      reason,
      expectedLastDay: expectedLastDay || undefined,
      employeeId: mode === "propose" ? employeeId : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === "resign"
              ? "Tạo yêu cầu nghỉ việc"
              : "Đề xuất cho nhân viên nghỉ việc"}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {mode === "resign"
              ? "Yêu cầu sẽ được gửi đến Quản lý duyệt"
              : "Yêu cầu sẽ được gửi đến HR xác nhận"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {mode === "propose" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Mã nhân viên (Employee ID)
              </label>
              <input
                type="text"
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
                placeholder="Nhập UUID nhân viên"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors"
              />
            </div>
          )}

          {mode === "propose" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Loại hình
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors cursor-pointer"
              >
                <option value="TERMINATED">Sa thải</option>
                <option value="CONTRACT_EXPIRED">Hết hạn HĐ không gia hạn</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lý do
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Nhập lý do nghỉ việc..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ngày nghỉ dự kiến
            </label>
            <input
              type="date"
              value={expectedLastDay}
              onChange={(e) => setExpectedLastDay(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang gửi..." : "Gửi yêu cầu"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Detail Modal ──────────────────────────────────────────────────────────
const DetailModal: React.FC<{
  request: OffboardingResponse;
  onClose: () => void;
}> = ({ request, onClose }) => {
  const steps = [
    {
      label: "Tạo yêu cầu",
      date: request.requestDate,
      by: request.requestedByName,
      done: true,
    },
    {
      label: "Quản lý duyệt",
      date: request.managerApprovedDate,
      by: request.approvedByManagerName,
      done: !!request.approvedByManager,
    },
    {
      label: "HR xác nhận",
      date: request.hrConfirmedDate,
      by: request.confirmedByHrName,
      done: !!request.confirmedByHr,
    },
    {
      label: "Hoàn tất",
      date: request.officialLastDay,
      by: null,
      done: request.status === "COMPLETED",
    },
  ];

  // For manager-proposed (TERMINATED, CONTRACT_EXPIRED), skip "Quản lý duyệt" step display since it's auto
  const isSelfResign = request.type === "RESIGNATION";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Chi tiết yêu cầu offboarding
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {request.employeeName} - {request.employeeCode}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500">Loại hình</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {TYPE_LABELS[request.type] ?? request.type}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">Trạng thái</span>
              <div className="mt-0.5">
                <StatusBadge status={request.status} />
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Ngày nghỉ dự kiến</span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {request.expectedLastDay ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-xs text-gray-500">
                Ngày nghỉ chính thức
              </span>
              <p className="text-sm font-medium text-gray-900 mt-0.5">
                {request.officialLastDay ?? "—"}
              </p>
            </div>
          </div>

          {/* Reason */}
          <div>
            <span className="text-xs text-gray-500">Lý do</span>
            <p className="text-sm text-gray-700 mt-1 bg-gray-50 p-3 rounded-lg">
              {request.reason}
            </p>
          </div>

          {/* Cancel info */}
          {request.status === "CANCELLED" && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <span className="text-xs font-semibold text-rose-700">
                Đã hủy bởi: {request.cancelledByName} ({request.cancelledDate})
              </span>
              <p className="text-sm text-rose-600 mt-1">
                {request.cancelReason}
              </p>
            </div>
          )}

          {/* Timeline Steps */}
          <div>
            <span className="text-xs text-gray-500 block mb-3">
              Tiến trình
            </span>
            <div className="space-y-0">
              {(isSelfResign ? steps : [steps[0], steps[2], steps[3]]).map(
                (step, idx, arr) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          step.done
                            ? "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      />
                      {idx < arr.length - 1 && (
                        <div
                          className={`w-0.5 h-8 ${
                            step.done ? "bg-emerald-300" : "bg-gray-200"
                          }`}
                        />
                      )}
                    </div>
                    <div className="pb-4 -mt-0.5">
                      <p
                        className={`text-sm font-medium ${
                          step.done ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {step.date}
                          {step.by && ` — ${step.by}`}
                        </p>
                      )}
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const OffboardingRequests: React.FC = () => {
  const [requests, setRequests] = useState<OffboardingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createMode, setCreateMode] = useState<"resign" | "propose">("resign");
  const [submitting, setSubmitting] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<OffboardingResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const { success, error: toastError } = useToast();
  const auth = useAuth();

  const isManager = auth?.hasRole("MANAGER");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offboardingService.getActiveRequests();
      setRequests(res.data);
    } catch {
      toastError("Lỗi", "Không thể tải danh sách yêu cầu offboarding");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCreateRequest = async (data: {
    type: string;
    reason: string;
    expectedLastDay?: string;
    employeeId?: string;
  }) => {
    setSubmitting(true);
    try {
      const payload = {
        type: data.type,
        reason: data.reason,
        expectedLastDay: data.expectedLastDay,
      };

      if (createMode === "resign") {
        const empId = auth?.user?.employeeId;
        if (!empId) return;
        await offboardingService.createResignation(empId, payload);
        success("Thành công", "Yêu cầu nghỉ việc đã được tạo");
      } else {
        if (!data.employeeId) return;
        await offboardingService.createManagerProposal(
          data.employeeId,
          payload
        );
        success("Thành công", "Đề xuất offboarding đã được tạo");
      }

      setShowCreateModal(false);
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Không thể tạo yêu cầu";
      toastError("Lỗi", message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests =
    filterStatus === "ALL"
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Yêu cầu Offboarding
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Quản lý các yêu cầu nghỉ việc, sa thải và hết hạn hợp đồng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCreateMode("resign");
              setShowCreateModal(true);
            }}
            className="px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Tạo yêu cầu nghỉ việc
          </button>
          {isManager && (
            <button
              onClick={() => {
                setCreateMode("propose");
                setShowCreateModal(true);
              }}
              className="px-4 py-2.5 border-2 border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/5 transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Đề xuất offboarding
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {[
          { value: "ALL", label: "Tất cả" },
          { value: "PENDING", label: "Chờ duyệt" },
          { value: "MANAGER_APPROVED", label: "Đã duyệt" },
          { value: "HR_CONFIRMED", label: "HR xác nhận" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilterStatus(tab.value)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              filterStatus === tab.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
            {tab.value !== "ALL" && (
              <span className="ml-1.5 text-xs opacity-60">
                {requests.filter((r) =>
                  tab.value === "ALL" ? true : r.status === tab.value
                ).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Nhân viên
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Loại hình
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngày yêu cầu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Ngày nghỉ dự kiến
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-16 text-center text-sm text-gray-400"
                  >
                    Không có yêu cầu offboarding nào
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr
                    key={req.offboardingId}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={req.employeeName}
                          url={req.avatarUrl}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {req.employeeName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {req.employeeCode}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-700">
                        {TYPE_LABELS[req.type] ?? req.type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">
                        {req.requestDate}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-sm text-gray-600">
                        {req.expectedLastDay ?? "—"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button
                        onClick={() => setSelectedRequest(req)}
                        className="px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-lg hover:bg-primary/10 transition-colors cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          mode={createMode}
          loading={submitting}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateRequest}
        />
      )}

      {selectedRequest && (
        <DetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default OffboardingRequests;
