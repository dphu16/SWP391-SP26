import React, { useState, useEffect, useCallback } from "react";
import {
  offboardingService,
  type OffboardingResponse,
} from "../../services/offboardingService";
import { useToast } from "../../components/ui/Toast";
import { useAuth } from "../../hooks/useAuth";

// ─── Status Config ─────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; border: string; label: string }
> = {
  PENDING: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border border-amber-200",
    label: "Chờ Manager duyệt",
  },
  MANAGER_APPROVED: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border border-blue-200",
    label: "Chờ HR xác nhận",
  },
  HR_CONFIRMED: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/5",
    border: "border border-primary/20",
    label: "HR đã xác nhận",
  },
};

const TYPE_LABELS: Record<string, string> = {
  RESIGNATION: "Nghỉ tự nguyện",
  TERMINATED: "Sa thải",
  CONTRACT_EXPIRED: "Hết hạn HĐ",
};

// ─── Avatar ──────────────────────────────────────────────────────────────
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

// ─── Status Badge ────────────────────────────────────────────────────────
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

// ─── Skeleton Row ────────────────────────────────────────────────────────
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
      <div className="skeleton h-6 w-20 rounded-full" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-3.5 w-48 rounded" />
    </td>
    <td className="px-4 py-4">
      <div className="skeleton h-8 w-32 rounded-lg" />
    </td>
  </tr>
);

// ─── HR Confirm Modal ────────────────────────────────────────────────────
const HRConfirmModal: React.FC<{
  request: OffboardingResponse;
  onClose: () => void;
  onConfirm: (officialLastDay: string) => void;
  loading: boolean;
}> = ({ request, onClose, onConfirm, loading }) => {
  const [officialLastDay, setOfficialLastDay] = useState(
    request.expectedLastDay ?? ""
  );

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Xác nhận Offboarding
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Điền ngày nghỉ chính thức cho <strong>{request.employeeName}</strong>
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 space-y-1">
            <p className="text-xs text-gray-500">Lý do</p>
            <p className="text-sm text-gray-700">{request.reason}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ngày nghỉ chính thức
            </label>
            <input
              type="date"
              value={officialLastDay}
              onChange={(e) => setOfficialLastDay(e.target.value)}
              required
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
              onClick={() => onConfirm(officialLastDay)}
              disabled={!officialLastDay || loading}
              className="flex-1 px-4 py-2.5 bg-primary text-white rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang xử lý..." : "Xác nhận"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Cancel Modal ────────────────────────────────────────────────────────
const CancelModal: React.FC<{
  request: OffboardingResponse;
  onClose: () => void;
  onCancel: (reason: string) => void;
  loading: boolean;
}> = ({ request, onClose, onCancel, loading }) => {
  const [cancelReason, setCancelReason] = useState("");

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">
            Hủy yêu cầu Offboarding
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Hủy yêu cầu offboarding cho{" "}
            <strong>{request.employeeName}</strong>
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Lý do hủy
            </label>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              rows={3}
              required
              placeholder="Ghi rõ lý do hủy yêu cầu..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:ring-0 focus:outline-none transition-colors resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Quay lại
            </button>
            <button
              onClick={() => onCancel(cancelReason)}
              disabled={!cancelReason.trim() || loading}
              className="flex-1 px-4 py-2.5 bg-rose-500 text-white rounded-lg text-sm font-medium hover:bg-rose-600 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Đang hủy..." : "Xác nhận hủy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
const OffboardingApproval: React.FC = () => {
  const [requests, setRequests] = useState<OffboardingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [hrConfirmTarget, setHrConfirmTarget] =
    useState<OffboardingResponse | null>(null);
  const [cancelTarget, setCancelTarget] =
    useState<OffboardingResponse | null>(null);

  const { success, error: toastError } = useToast();
  const auth = useAuth();
  const isHR = auth?.hasRole("HR");
  const isManager = auth?.hasRole("MANAGER");

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await offboardingService.getActiveRequests();
      setRequests(res.data);
    } catch {
      toastError("Lỗi", "Không thể tải danh sách cần duyệt");
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // ── BRD 3.1: Manager Approve ──
  const handleManagerApprove = async (offboardingId: string) => {
    setActionLoading(true);
    try {
      await offboardingService.managerApprove(offboardingId);
      success("Đã duyệt", "Yêu cầu đã gửi cho HR xác nhận");
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Không thể duyệt yêu cầu";
      toastError("Lỗi", message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── BRD 3.1 + 3.4: HR Confirm ──
  const handleHRConfirm = async (officialLastDay: string) => {
    if (!hrConfirmTarget) return;
    setActionLoading(true);
    try {
      await offboardingService.hrConfirm(hrConfirmTarget.offboardingId, {
        officialLastDay,
      });
      success(
        "Đã xác nhận",
        "Nhân viên sẽ chuyển sang trạng thái chờ offboard"
      );
      setHrConfirmTarget(null);
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Không thể xác nhận";
      toastError("Lỗi", message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── BRD 3.2: Cancel ──
  const handleCancel = async (reason: string) => {
    if (!cancelTarget) return;
    setActionLoading(true);
    try {
      await offboardingService.cancel(cancelTarget.offboardingId, {
        cancelReason: reason,
      });
      success("Đã hủy", "Yêu cầu offboarding đã bị hủy");
      setCancelTarget(null);
      fetchRequests();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Không thể hủy yêu cầu";
      toastError("Lỗi", message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter: Manager sees PENDING, HR sees MANAGER_APPROVED + HR_CONFIRMED
  const visibleRequests = requests.filter((r) => {
    if (isHR) return true;
    if (isManager) return r.status === "PENDING" || r.status === "MANAGER_APPROVED";
    return false;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Phê duyệt Offboarding
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isHR
            ? "Duyệt và xác nhận các yêu cầu offboarding"
            : "Duyệt các yêu cầu nghỉ việc của nhân viên"}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            label: "Chờ Manager duyệt",
            count: requests.filter((r) => r.status === "PENDING").length,
            color: "bg-amber-50 text-amber-700 border-amber-200",
          },
          {
            label: "Chờ HR xác nhận",
            count: requests.filter((r) => r.status === "MANAGER_APPROVED")
              .length,
            color: "bg-blue-50 text-blue-700 border-blue-200",
          },
          {
            label: "Đã xác nhận",
            count: requests.filter((r) => r.status === "HR_CONFIRMED").length,
            color: "bg-emerald-50 text-emerald-700 border-emerald-200",
          },
        ].map((card) => (
          <div
            key={card.label}
            className={`px-4 py-3 rounded-xl border ${card.color}`}
          >
            <p className="text-2xl font-bold">{card.count}</p>
            <p className="text-sm font-medium">{card.label}</p>
          </div>
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
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Lý do
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
              ) : visibleRequests.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-16 text-center text-sm text-gray-400"
                  >
                    Không có yêu cầu nào cần xử lý
                  </td>
                </tr>
              ) : (
                visibleRequests.map((req) => (
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
                            {req.employeeCode} &middot;{" "}
                            {req.departmentName ?? "—"}
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
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {req.reason}
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-center gap-2">
                        {/* Manager: Approve PENDING resignation */}
                        {isManager &&
                          req.status === "PENDING" &&
                          req.type === "RESIGNATION" && (
                            <button
                              onClick={() =>
                                handleManagerApprove(req.offboardingId)
                              }
                              disabled={actionLoading}
                              className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                              Duyệt
                            </button>
                          )}

                        {/* HR: Confirm MANAGER_APPROVED */}
                        {isHR && req.status === "MANAGER_APPROVED" && (
                          <button
                            onClick={() => setHrConfirmTarget(req)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Xác nhận
                          </button>
                        )}

                        {/* Cancel button - for active requests */}
                        {(req.status === "PENDING" ||
                          req.status === "MANAGER_APPROVED" ||
                          req.status === "HR_CONFIRMED") && (
                          <button
                            onClick={() => setCancelTarget(req)}
                            disabled={actionLoading}
                            className="px-3 py-1.5 text-xs font-medium text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Hủy
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR Confirm Modal */}
      {hrConfirmTarget && (
        <HRConfirmModal
          request={hrConfirmTarget}
          loading={actionLoading}
          onClose={() => setHrConfirmTarget(null)}
          onConfirm={handleHRConfirm}
        />
      )}

      {/* Cancel Modal */}
      {cancelTarget && (
        <CancelModal
          request={cancelTarget}
          loading={actionLoading}
          onClose={() => setCancelTarget(null)}
          onCancel={handleCancel}
        />
      )}
    </div>
  );
};

export default OffboardingApproval;
