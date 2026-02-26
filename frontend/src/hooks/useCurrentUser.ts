import { useMemo } from "react";
import { getToken } from "../services/authService";
import { decodeJwt, type JwtPayload } from "../utils/jwtDecode";

export interface CurrentUser {
    token: string;
    username: string;     // JWT sub — dùng để gọi các API cần username
    employeeId?: string;  // Optional — chỉ có nếu backend đã link user ↔ employee
    fullName: string;
    role: string;
    avatarUrl?: string;
}

/**
 * Reads the current logged-in user from the JWT stored in localStorage.
 * Returns null if no valid token is present.
 */
export function useCurrentUser(): CurrentUser | null {
    return useMemo(() => {
        const token = getToken();
        if (!token) return null;

        const payload: JwtPayload | null = decodeJwt(token);
        if (!payload?.sub) return null;

        return {
            token,
            username: payload.sub,                          // always present in JWT
            employeeId: payload.employeeId ?? undefined,    // present only if linked
            fullName: payload.fullName ?? payload.sub,
            role: payload.role ?? "EMPLOYEE",
            avatarUrl: payload.avatarUrl,
        };
    }, []);
}
