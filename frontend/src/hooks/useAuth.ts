import { useMemo, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";

// Giống pattern trong ProtectedRoute.tsx — subscribe localStorage changes
function subscribeToStorage(callback: () => void) {
    window.addEventListener("storage", callback);
    window.addEventListener("auth-change", callback);
    return () => {
        window.removeEventListener("storage", callback);
        window.removeEventListener("auth-change", callback);
    };
}

export type UserRole =
    | "HR" | "MANAGER" | "EMPLOYEE"
    | "FINANCE" | "MENTOR"
    | "INTERN" | "PROBATION";

export interface AuthUser {
    username: string;
    role: UserRole;
    fullName?: string;
    employeeId?: string;
    avatarUrl?: string;
}

export function useAuth() {
    // ✅ Reactive: re-render khi token thay đổi
    const token = useSyncExternalStore(subscribeToStorage, getToken);

    // ✅ token nằm trong dependency array
    const user: AuthUser | null = useMemo(() => {
        const payload = decodeJwt(token);
        if (!payload) return null;

        const rawRoles: string[] = Array.isArray(payload.roles) ? payload.roles : [];
        const firstRole = rawRoles[0]?.replace(/^ROLE_/, "") as UserRole ?? "EMPLOYEE";

        return {
            username: payload.sub,
            role: firstRole,
            fullName: payload.fullName,
            employeeId: payload.employeeId,
            avatarUrl: payload.avatarUrl,
        };
    }, [token]); 

    const hasRole = useCallback(
        (...roles: UserRole[]): boolean => {
            if (!user) return false;
            return roles.includes(user.role);
        },
        [user],
    );

    return { user, hasRole };
}