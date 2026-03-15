export interface ContractDTO {
  contractId: string;
  contractNumber: string;
  contractType: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface FieldCooldownDTO {
  fieldName: string;
  changedAt: string | null;
  cooldownUntil: string | null;
  locked: boolean;
}

export interface EmployeeDetailDTO {
  employeeId: string;
  employeeCode: string;
  avatarUrl: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  citizenId: string;
  taxCode: string;
  dateOfBirth: string;
  dateOfJoining: string;
  roles: string[];
  positionTitle: string;
  deptName: string;
  statusEmp: string;
  status: string;
  contracts?: ContractDTO[];
}

export interface DependentDTO {
  id: string;
  fullName: string;
  relationship: string;
  phone: string;
  address: string;
  status: string | null;
}

export const API_BASE = "/api/employee";

export const STATUS_CONFIG: Record<
  string,
  { dot: string; text: string; bg: string }
> = {
  ACTIVE: {
    dot: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
  },
  INACTIVE: { dot: "bg-rose-500", text: "text-rose-700", bg: "bg-rose-50" },
};

export const getStatusCfg = (status: string) => {
  const key = status?.toUpperCase() ?? "";
  return STATUS_CONFIG[key] ?? STATUS_CONFIG["INACTIVE"];
};

export const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
};
