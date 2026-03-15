export interface StatusStyle {
  dot: string;
  text: string;
  bg: string;
  border?: string;
  label?: string;
}

/** Employee status (OFFICIAL, INTERN, PROBATION, TERMINATED, RESIGNED, INACTIVE) */
export const EMPLOYEE_STATUS_CONFIG: Record<string, StatusStyle> = {
  OFFICIAL: {
    dot: "bg-emerald-400",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  PROBATION: { dot: "bg-blue-400", text: "text-blue-700", bg: "bg-blue-50" },
  INTERN: { dot: "bg-purple-400", text: "text-purple-700", bg: "bg-purple-50" },
  TERMINATED: { dot: "bg-red-400", text: "text-red-700", bg: "bg-red-50" },
  RESIGNED: {
    dot: "bg-orange-400",
    text: "text-orange-700",
    bg: "bg-orange-50",
  },
  INACTIVE: { dot: "bg-gray-400", text: "text-gray-700", bg: "bg-gray-50" },
};

/** Employee detail page status (ACTIVE / INACTIVE) */
export const DETAIL_STATUS_CONFIG: Record<string, StatusStyle> = {
  ACTIVE: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  INACTIVE: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
};

/** Offboarding employee status (TERMINATED, RESIGNED, PENDING_OFFBOARD) */
export const OFFBOARDING_EMP_STATUS_CONFIG: Record<string, StatusStyle> = {
  TERMINATED: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
  RESIGNED: { dot: "bg-gray-400", text: "text-gray-600", bg: "bg-gray-100" },
  PENDING_OFFBOARD: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
  },
};

/** Offboarding request status */
export const OFFBOARDING_REQUEST_STATUS_CONFIG: Record<string, StatusStyle> = {
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

/** Offboarding approval status (subset for OffboardingApproval page) */
export const APPROVAL_STATUS_CONFIG: Record<string, StatusStyle> = {
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

/** Onboarding progress status */
export const PROGRESS_STATUS_CONFIG: Record<
  string,
  StatusStyle & { label: string }
> = {
  PENDING_REVIEW: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
    label: "Review",
  },
  PENDING_VERIFY: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    label: "Verify",
  },
  PENDING_ACTIVATION: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    label: "Activation",
  },
  PASSWORD_CREATED: {
    dot: "bg-indigo-500",
    text: "text-indigo-700",
    bg: "bg-indigo-50",
    label: "Password Set",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    label: "Done",
  },
  REJECTED: {
    dot: "bg-rose-500",
    text: "text-rose-700",
    bg: "bg-rose-50",
    label: "Rejected",
  },
};

export const OFFBOARDING_TYPE_LABELS: Record<string, string> = {
  RESIGNATION: "Nghỉ tự nguyện",
  TERMINATED: "Sa thải",
  CONTRACT_EXPIRED: "Hết hạn HĐ",
};

export function getStatusStyle(
  config: Record<string, StatusStyle>,
  status: string,
  fallbackKey = "INACTIVE",
): StatusStyle {
  const key = status?.toUpperCase().replace(/\s+/g, "") ?? "";
  return (
    config[key] ??
    config[fallbackKey] ?? {
      dot: "bg-gray-400",
      text: "text-gray-600",
      bg: "bg-gray-100",
    }
  );
}
