import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import apiClient from "../../../shared/api/apiClient";

// DTO interface matching GET /api/employee/{id}/view-detail
interface EmployeeDetailDTO {
  employeeId: string;
  employeeCode: string;
  avatarUrl: string;
  fullName: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  citizenId: string;
  taxCode: string;
  dateOfBirth: string;
  dateOfJoining: string;
  role: string;
  positionTitle: string;
  deptName: string;
  statusPos: string;
  status: string;
}

const API_BASE = "/api/employee";

const STATUS_CONFIG: Record<string, { dot: string; text: string; bg: string }> =
{
  ACTIVE: {
    dot: "bg-emerald-500",
    text: "text-emerald-700 dark:text-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  INACTIVE: {
    dot: "bg-rose-500",
    text: "text-rose-700 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-900/20",
  },
};

const getStatusCfg = (status: string) => {
  const key = status?.toUpperCase() ?? "";
  return STATUS_CONFIG[key] ?? STATUS_CONFIG["INACTIVE"];
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return dateStr;
  }
};

// ─── Avatar (deterministic color, MASTER.md palette) ─────────────────────────
const Avatar: React.FC<{ name: string; url?: string; size?: "lg" | "xl" }> = ({
  name,
  url,
  size = "xl",
}) => {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "??";

  const colors = [
    "bg-primary/15 text-primary",
    "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
  ];
  const colorIdx = (name?.charCodeAt(0) ?? 0) % colors.length;
  const sizeClass = size === "xl" ? "w-20 h-20 text-2xl" : "w-8 h-8 text-xs";

  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ring-4 ring-white dark:ring-surface-dark flex-shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold flex-shrink-0 ${colors[colorIdx]}`}
    >
      {initials}
    </div>
  );
};

// ─── Info Row (label + value pair) ───────────────────────────────────────────
const InfoRow: React.FC<{
  label: string;
  value: React.ReactNode;
  required?: boolean;
}> = ({ label, value, required }) => (
  <div>
    <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </p>
    <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
      {value || "—"}
    </p>
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard: React.FC<{
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, action, children }) => (
  <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card p-6 animate-fade-in">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark tracking-tight">
        {title}
      </h3>
      {action}
    </div>
    {children}
  </div>
);

// ─── Icon Button ──────────────────────────────────────────────────────────────
const IconButton: React.FC<{
  onClick?: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  className?: string;
}> = ({
  onClick,
  title,
  children,
  variant = "default",
  disabled,
  className = "",
}) => {
    const variantClass = {
      default:
        "text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800",
      primary: "text-white bg-primary hover:bg-primary-hover",
      danger: "text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-900/20",
    }[variant];

    return (
      <button
        onClick={onClick}
        title={title}
        disabled={disabled}
        className={`p-2 rounded-xl transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${className}`}
      >
        {children}
      </button>
    );
  };

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const EditIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path d="M11.013 2.513a1.75 1.75 0 012.475 2.474L6.226 12.25a2.751 2.751 0 01-.892.596l-2.047.848a.75.75 0 01-.98-.98l.848-2.047a2.75 2.75 0 01.596-.892l7.262-7.262z" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path d="M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0114.25 14H1.75A1.75 1.75 0 010 12.25v-8.5C0 2.784.784 2 1.75 2zM1.5 5.645v6.605c0 .138.112.25.25.25h12.5a.25.25 0 00.25-.25V5.645L8.97 9.04a1.5 1.5 0 01-1.94 0L1.5 5.645zM13.75 3.5H2.25L8 7.88l5.75-4.38z" />
  </svg>
);

const PhoneIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path fillRule="evenodd" d="M1.885.511a1.745 1.745 0 012.61.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 00.178.643l2.457 2.457a.678.678 0 00.644.178l2.189-.547a1.745 1.745 0 011.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 01-7.01-4.42 18.634 18.634 0 01-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" clipRule="evenodd" />
  </svg>
);

const LocationIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path fillRule="evenodd" d="M8 1.5a5 5 0 100 10A5 5 0 008 1.5zM0 8a8 8 0 1116 0A8 8 0 010 8zm8-2a2 2 0 100 4 2 2 0 000-4z" clipRule="evenodd" />
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 flex-shrink-0">
    <path fillRule="evenodd" d="M1 2.5A1.5 1.5 0 012.5 1h8A1.5 1.5 0 0112 2.5v3.563a3.5 3.5 0 00-1.5-.063V2.5h-8v11h4.5v-1.5a1.5 1.5 0 011.5-1.5h2a1.5 1.5 0 011.5 1.5v1.5h.5a.5.5 0 010 1H2.5A1.5 1.5 0 011 13.5v-11zM3.5 4a.5.5 0 000 1h6a.5.5 0 000-1h-6zm-.5 3.5A.5.5 0 013.5 7h6a.5.5 0 010 1h-6a.5.5 0 01-.5-.5zM3.5 10a.5.5 0 000 1H5a.5.5 0 000-1H3.5z" clipRule="evenodd" />
    <path d="M11.5 7a2.5 2.5 0 100 5 2.5 2.5 0 000-5zm-3.5 2.5a3.5 3.5 0 116.268 2.14l1.796 1.797a.75.75 0 01-1.06 1.06l-1.797-1.795A3.5 3.5 0 018 9.5z" />
  </svg>
);

const BackIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M9.78 4.22a.75.75 0 010 1.06L7.06 8l2.72 2.72a.75.75 0 11-1.06 1.06L5.47 8.53a.75.75 0 010-1.06l3.25-3.25a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" clipRule="evenodd" />
  </svg>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const EmployeeDetail: React.FC = () => {
  const { id: paramId } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const isProfile = location.pathname === "/profile";
  const id = isProfile ? "admin-001" : paramId; // Auth removed, using mock ID for profile


  const [detail, setDetail] = useState<EmployeeDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"General" | "Job" | "Payroll">(
    "General",
  );

  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    phone: "",
    address: "",
    email: "",
  });
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;

    const fetchEmployeeDetail = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await apiClient.get<EmployeeDetailDTO>(
          `${API_BASE}/${id}/view-detail`,
        );
        setDetail(res.data);
      } catch (err: unknown) {
        if (err instanceof Error && 'response' in err) {
          const axErr = err as { response?: { status: number; statusText: string } };
          setError(
            axErr.response?.status === 404
              ? "Không tìm thấy nhân viên."
              : `Lỗi ${axErr.response?.status}: ${axErr.response?.statusText}`,
          );
        } else {
          setError("Đã xảy ra lỗi không xác định.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchEmployeeDetail();
  }, [id]);

  const startEditing = () => {
    setEditForm({
      phone: detail?.phone || "",
      address: detail?.address || "",
      email: detail?.email || "",
    });
    setEditError(null);
    setEditSuccess(false);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditError(null);
    setEditSuccess(false);
  };

  const handleSave = async () => {
    if (!id) return;
    if (!editForm.phone.trim()) {
      setEditError("Số điện thoại không được để trống.");
      return;
    }

    try {
      setSaving(true);
      setEditError(null);

      const res = await apiClient.put<EmployeeDetailDTO>(
        `/api/employees/${id}/edit`,
        editForm,
      );

      setDetail(res.data);
      setEditSuccess(true);
      setIsEditing(false);

      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: unknown) {
      if (err instanceof Error && 'response' in err) {
        const axErr = err as { response?: { status: number; data?: { message?: string }; statusText: string } };
        setEditError(
          axErr.response?.data?.message ||
          `Lỗi ${axErr.response?.status}: Không thể lưu thay đổi.`,
        );
      } else {
        setEditError("Đã xảy ra lỗi không xác định.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Loading state ──
  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Back button skeleton */}
        <div className="skeleton h-9 w-32 rounded-xl" />
        <div className="grid grid-cols-12 gap-6">
          {/* Profile card skeleton */}
          <div className="col-span-12 lg:col-span-4 xl:col-span-3">
            <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card p-6 space-y-4">
              <div className="flex flex-col items-center gap-3">
                <div className="skeleton w-20 h-20 rounded-full" />
                <div className="skeleton h-5 w-36 rounded" />
                <div className="skeleton h-4 w-24 rounded" />
                <div className="skeleton h-6 w-20 rounded-full" />
              </div>
              <div className="border-t border-border-light dark:border-border-dark pt-4 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-4 h-4 rounded" />
                    <div className="skeleton h-3.5 w-40 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Content skeleton */}
          <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
            <div className="skeleton h-10 w-full rounded-xl" />
            <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card p-6 space-y-4">
              <div className="skeleton h-5 w-32 rounded" />
              <div className="grid grid-cols-2 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="skeleton h-3 w-20 rounded" />
                    <div className="skeleton h-4 w-36 rounded" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──
  if (error) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-surface-light dark:bg-surface-dark p-16 flex flex-col items-center gap-4 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-rose-500">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{error}</p>
          <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark mt-1">
            Không thể tải thông tin nhân viên.
          </p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer btn-primary-action"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const statusCfg = getStatusCfg(detail?.status || "");

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors cursor-pointer"
        >
          <BackIcon />
          Back
        </button>

        {/* Success toast inline */}
        {editSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl animate-slide-up">
            <span className="w-4 h-4 text-emerald-500">
              <CheckIcon />
            </span>
            <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
              Changes saved successfully
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* ── Left Column: Profile Card ── */}
        <div className="col-span-12 lg:col-span-4 xl:col-span-3">
          <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card overflow-hidden sticky top-6 animate-fade-in">
            {/* Hero banner */}
            <div className="h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent" />

            {/* Avatar + identity */}
            <div className="px-6 pb-6 -mt-10 flex flex-col items-center text-center">
              <div className="ring-4 ring-surface-light dark:ring-surface-dark rounded-full mb-3">
                <Avatar name={detail?.fullName || "?"} url={detail?.avatarUrl} size="xl" />
              </div>

              <h2 className="text-base font-bold text-text-primary-light dark:text-text-primary-dark leading-tight">
                {detail?.fullName || "—"}
              </h2>
              <p className="text-xs text-text-secondary-light dark:text-text-secondary-dark mt-0.5 mb-3">
                {detail?.positionTitle || "—"}
              </p>

              {/* Status badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold ${statusCfg.text} ${statusCfg.bg}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                {detail?.status || "—"}
              </span>

              {/* Employee code */}
              <p className="mt-3 text-[11px] font-mono text-text-muted-light dark:text-text-muted-dark bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                {detail?.employeeCode || "—"}
              </p>
            </div>

            {/* Contact info */}
            <div className="border-t border-border-light dark:border-border-dark px-6 py-5 space-y-3.5">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  <MailIcon />
                </span>
                <span className="text-text-primary-light dark:text-text-primary-dark font-medium truncate text-xs">
                  {detail?.email || "—"}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark">
                  <PhoneIcon />
                </span>
                <span className="text-text-primary-light dark:text-text-primary-dark font-medium text-xs">
                  {detail?.phone || "—"}
                </span>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <span className="text-text-secondary-light dark:text-text-secondary-dark mt-0.5">
                  <LocationIcon />
                </span>
                <span className="text-text-primary-light dark:text-text-primary-dark font-medium text-xs leading-relaxed">
                  {detail?.address || "—"}
                </span>
              </div>
            </div>

            {/* Org info */}
            <div className="border-t border-border-light dark:border-border-dark px-6 py-5 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Department
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-text-secondary-light dark:text-text-secondary-dark">
                    <BuildingIcon />
                  </span>
                  <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                    {detail?.deptName || "—"}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1">
                  Role
                </p>
                <span className="inline-flex items-center text-xs font-medium text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                  {detail?.role || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Column: Tabs + Content ── */}
        <div className="col-span-12 lg:col-span-8 xl:col-span-9 space-y-6">
          {/* Tab navigation */}
          <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card px-6 animate-fade-in">
            <nav
              aria-label="Employee detail tabs"
              className="flex space-x-1 overflow-x-auto no-scrollbar"
            >
              {(["General", "Job", "Payroll"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`whitespace-nowrap py-4 px-4 border-b-2 text-sm font-semibold transition-colors cursor-pointer ${activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-text-secondary-light dark:text-text-secondary-dark hover:text-text-primary-light dark:hover:text-text-primary-dark hover:border-gray-300 dark:hover:border-gray-600"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* ── Tab: General ── */}
          {activeTab === "General" && (
            <>
              {/* Personal Info Card */}
              <SectionCard
                title="Personal Information"
                action={
                  !isEditing ? (
                    <IconButton
                      onClick={startEditing}
                      title="Edit personal info"
                      variant="default"
                    >
                      <EditIcon />
                    </IconButton>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={cancelEditing}
                        disabled={saving}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-gray-100 dark:bg-gray-800 text-text-secondary-light dark:text-text-secondary-dark hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer disabled:opacity-50 btn-primary-action"
                      >
                        {saving && (
                          <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        {saving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  )
                }
              >
                {/* Error alert */}
                {editError && (
                  <div className="mb-5 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-xl flex items-start gap-2.5 animate-slide-up">
                    <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5">
                      <path fillRule="evenodd" d="M8 15A7 7 0 108 1a7 7 0 000 14zm0-11a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 018 4zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs font-medium text-rose-700 dark:text-rose-400">
                      {editError}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                  {/* Non-editable fields */}
                  <InfoRow label="Full Name" value={detail?.fullName} />
                  <InfoRow label="Gender" value={detail?.gender} />
                  <InfoRow label="Date of Birth" value={formatDate(detail?.dateOfBirth)} />
                  <InfoRow label="Citizen ID" value={detail?.citizenId} />
                  <InfoRow label="Employee Code" value={detail?.employeeCode} />
                  <InfoRow label="Tax Code" value={detail?.taxCode} />
                  <InfoRow label="Username" value={detail?.username} />
                  <InfoRow label="Date of Joining" value={formatDate(detail?.dateOfJoining)} />

                  {/* Editable fields */}
                  {(
                    [
                      { label: "Email Address", field: "email" as const, type: "email", required: false },
                      { label: "Phone Number", field: "phone" as const, type: "tel", required: true },
                      { label: "Address", field: "address" as const, type: "text", required: false },
                    ] as const
                  ).map(({ label, field, type, required }) => (
                    <div key={field} className={field === "address" ? "md:col-span-2" : ""}>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark mb-1">
                        {label}
                        {required && isEditing && (
                          <span className="text-rose-500 ml-0.5">*</span>
                        )}
                      </p>
                      {isEditing ? (
                        <input
                          type={type}
                          value={editForm[field]}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              [field]: e.target.value,
                            }))
                          }
                          placeholder={label}
                          className="w-full px-3 py-2 text-sm rounded-xl border border-border-light dark:border-border-dark bg-white dark:bg-gray-900 text-text-primary-light dark:text-text-primary-dark placeholder:text-text-muted-light dark:placeholder:text-text-muted-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
                        />
                      ) : (
                        <p className="text-sm font-medium text-text-primary-light dark:text-text-primary-dark">
                          {detail?.[field] || "—"}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>

              {/* Emergency Contact Card */}
              <SectionCard
                title="Emergency Contact"
                action={
                  <IconButton title="Edit emergency contact" variant="default">
                    <EditIcon />
                  </IconButton>
                }
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                  <InfoRow label="Full Name" value="Albert Johnson" />
                  <InfoRow label="Phone Number" value="089372143811" />
                </div>
              </SectionCard>
            </>
          )}

          {/* ── Tab: Job ── */}
          {activeTab === "Job" && (
            <SectionCard
              title="Job Information"
              action={
                <IconButton title="Edit job info" variant="default">
                  <EditIcon />
                </IconButton>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-10">
                <InfoRow label="Role" value={detail?.role} />
                <InfoRow label="Position" value={detail?.positionTitle} />
                <InfoRow label="Department" value={detail?.deptName} />
                <InfoRow
                  label="Status"
                  value={
                    detail?.statusPos ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold text-text-secondary-light dark:text-text-secondary-dark bg-gray-100 dark:bg-gray-800">
                        {detail.statusPos}
                      </span>
                    ) : (
                      "—"
                    )
                  }
                />
              </div>
            </SectionCard>
          )}

          {/* ── Tab: Payroll ── */}
          {activeTab === "Payroll" && (
            <div className="rounded-2xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark shadow-card animate-fade-in">
              <div className="py-20 flex flex-col items-center gap-3 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-6 h-6 text-gray-400">
                    <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">
                  No payroll data yet
                </p>
                <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">
                  Payroll information will appear here once configured.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetail;
