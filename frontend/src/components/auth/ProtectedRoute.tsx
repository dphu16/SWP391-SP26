import React, { useSyncExternalStore, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  getToken,
  getRefreshToken,
  removeToken,
  saveToken,
  saveRefreshToken,
  refreshAccessToken,
} from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";
import type { UserRole } from "../../hooks/useAuth";
import { canAccessPath } from "../shared/sidebar/roleCapabilities";

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
  const rawRoles = payload?.roles ?? (payload?.role ? [payload.role] : []);
  const resolvedRoles = rawRoles
    .map(normalizeRole)
    .filter((role: UserRole | null): role is UserRole => role !== null);

  const [isRefreshing, setIsRefreshing] = useState(false);

  // When the access token is missing or invalid, try to restore session
  // using the refresh token before forcing a redirect to login.
  useEffect(() => {
    if (!payload && !isRefreshing) {
      const refreshToken = getRefreshToken();
      if (refreshToken) {
        setIsRefreshing(true);
        refreshAccessToken(refreshToken)
          .then((data) => {
            saveToken(data.accessToken);
            if (data.refreshToken) {
              const isPersistent =
                localStorage.getItem("remember_me") === "true";
              saveRefreshToken(data.refreshToken, isPersistent);
            }
          })
          .catch(() => {
            removeToken();
          })
          .finally(() => {
            setIsRefreshing(false);
          });
      }
    }
  }, [payload, isRefreshing]);

  // While refreshing, show nothing (or a spinner) instead of redirecting
  if (isRefreshing) {
    return null;
  }

  if (!token || !payload) {
    // No token at all, or token expired and no refresh token available
    const refreshToken = getRefreshToken();
    if (refreshToken && !isRefreshing) {
      // There's a refresh token — the useEffect above will handle it.
      // Return null to avoid flashing the login redirect.
      return null;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (
    resolvedRoles.length === 0 ||
    !canAccessPath(resolvedRoles, location.pathname)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;