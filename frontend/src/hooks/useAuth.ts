import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

export type UserRole =
  | "HR"
  | "MANAGER"
  | "EMPLOYEE"
  | "FINANCE"
  | "MENTOR"
  | "INTERN"
  | "PROBATION";

export interface AuthUser {
  username: string;
  role: UserRole;
  fullName?: string;
  employeeId?: string;
  avatarUrl?: string;
}

function normalizeRole(rawRole?: string): UserRole | null {
  if (!rawRole) return null;

  const normalized = rawRole.replace("ROLE_", "") as UserRole;
  const allowedRoles: UserRole[] = [
    "HR",
    "MANAGER",
    "EMPLOYEE",
    "FINANCE",
    "MENTOR",
    "INTERN",
    "PROBATION",
  ];

  return allowedRoles.includes(normalized) ? normalized : null;
}

export function useAuth() {
  const payload = decodeJwt(getToken());
  const roleFromSingleClaim = normalizeRole(payload?.role);
  const roleFromArrayClaim = normalizeRole(payload?.roles?.[0]);
  const resolvedRole = roleFromSingleClaim ?? roleFromArrayClaim ?? "EMPLOYEE";

  const user: AuthUser | null = payload
    ? {
        username: payload.sub,
        role: resolvedRole,
        fullName: payload.fullName,
        employeeId: payload.employeeId,
        avatarUrl: payload.avatarUrl,
      }
    : null;

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return { user, hasRole };
}
