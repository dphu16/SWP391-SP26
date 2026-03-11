export const OFFBOARDING_REQUEST_STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string; border: string; label: string }
> = {
  PENDING: {
    dot: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border border-amber-200",
    label: "Pending",
  },
  MANAGER_APPROVED: {
    dot: "bg-blue-500",
    text: "text-blue-700",
    bg: "bg-blue-50",
    border: "border border-blue-200",
    label: "Approved",
  },
  HR_CONFIRMED: {
    dot: "bg-primary",
    text: "text-primary",
    bg: "bg-primary/5",
    border: "border border-primary/20",
    label: "HR Confirmed",
  },
  CANCELLED: {
    dot: "bg-gray-400",
    text: "text-gray-600",
    bg: "bg-gray-100",
    border: "border border-gray-200",
    label: "Cancelled",
  },
  COMPLETED: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border border-emerald-200",
    label: "Completed",
  },
};

export const TYPE_LABELS: Record<string, string> = {
  RESIGNATION: "Resignation",
  TERMINATED: "Terminated",
  CONTRACT_EXPIRED: "Contract Expired",
};
