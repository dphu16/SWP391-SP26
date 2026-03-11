import React, { useSyncExternalStore, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";
import type { UserRole } from "../../hooks/useAuth";
import { canAccessPath } from "../shared/sidebar";

/**
 * Subscribe to localStorage changes so ProtectedRoute re-renders
 * when the token is removed (e.g. explicit logout or expired token cleanup).
 */
function subscribeToStorage(callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === "access_token" || e.key === null) callback();
  };
  window.addEventListener("storage", handler);
  window.addEventListener("auth-change", callback);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener("auth-change", callback);
  };
}

function getSnapshot() {
  return getToken();
}

interface ProtectedRouteProps {
  children: React.ReactNode;
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

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = useSyncExternalStore(subscribeToStorage, getSnapshot);
  const payload = token ? decodeJwt(token) : null;
  const resolvedRole =
    normalizeRole(payload?.role) ?? normalizeRole(payload?.roles?.[0]);

  // Clean up corrupt/expired tokens in an effect (not during render)
  useEffect(() => {
    if (token && !decodeJwt(token)) {
      removeToken();
    }
  }, [token]);

  if (!token || !payload) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!resolvedRole || !canAccessPath(resolvedRole, location.pathname)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
