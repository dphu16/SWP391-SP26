import { useMemo } from "react";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

export type UserRole = "HR" | "MANAGER" | "EMPLOYEE" | "FINANCE" | "MENTOR";

export interface AuthUser {
    username: string;
    role: UserRole;
    fullName?: string;
    employeeId?: string;
    avatarUrl?: string;
}

export function useAuth() {
    const user = useMemo<AuthUser | null>(() => {
        const payload = decodeJwt(getToken());
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

    const hasRole = (...roles: UserRole[]): boolean => {
        if (!user) return false;
        return roles.includes(user.role);
    };

    return { user, hasRole };
}
