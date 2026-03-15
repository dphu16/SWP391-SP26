import { useMemo } from "react";
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
  const token = getToken();

  const user: AuthUser | null = useMemo(() => {
    const payload = decodeJwt(token);
    if (!payload) return null;

        // JWT stores roles as array: ["ROLE_HR"], ["ROLE_EMPLOYEE"], etc.
        // Strip the "ROLE_" prefix and take the first role
        const rawRoles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        const firstRole = rawRoles[0]?.replace(/^ROLE_/, "") as UserRole ?? "EMPLOYEE";

        return {
            username: payload.sub,
            role: firstRole,
            fullName: payload.fullName,
            employeeId: payload.employeeId,
            avatarUrl: payload.avatarUrl,
        };
    }, []);


  const hasRole = useCallback(
    (...roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role);
    },
    [user],
  );

  return { user, hasRole };
}
