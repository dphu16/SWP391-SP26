import { useMemo } from "react";
import { getToken } from "../services/authService";
import { decodeJwt, type JwtPayload } from "../utils/jwtDecode";

export interface CurrentUser {
    token: string;
    username: string;
    employeeId?: string;
    fullName: string;
    role: string;
    roles: string[];
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

        const rolesList = payload.roles || [];

        return {
            token,
            username: payload.sub,
            employeeId: payload.employeeId ?? undefined,
            fullName: payload.fullName ?? payload.sub,
            role: rolesList[0] ?? "EMPLOYEE",
            roles: rolesList,
            avatarUrl: payload.avatarUrl,
        };
    }, []);
}
