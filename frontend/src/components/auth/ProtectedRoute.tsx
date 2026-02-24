import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken, removeToken } from "../../services/authService";
import { decodeJwt } from "../../utils/jwtDecode";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const token = getToken();
  const payload = decodeJwt(token);

  // #region agent log
  fetch("http://127.0.0.1:7882/ingest/fefb8f99-cf79-45ff-8e42-7907b7a007d5", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Debug-Session-Id": "9dee00",
    },
    body: JSON.stringify({
      sessionId: "9dee00",
      runId: "initial",
      hypothesisId: "H1",
      location: "src/components/auth/ProtectedRoute.tsx:12",
      message: "ProtectedRoute auth check",
      data: {
        hasToken: !!token,
        hasPayload: !!payload,
        pathname: location.pathname,
      },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion agent log

  if (!token || !payload) {
    // #region agent log
    fetch("http://127.0.0.1:7882/ingest/fefb8f99-cf79-45ff-8e42-7907b7a007d5", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "9dee00",
      },
      body: JSON.stringify({
        sessionId: "9dee00",
        runId: "initial",
        hypothesisId: "H1",
        location: "src/components/auth/ProtectedRoute.tsx:27",
        message: "ProtectedRoute redirecting to /login",
        data: {
          reason: !token ? "no-token" : "no-payload",
          pathname: location.pathname,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion agent log

    if (token && !payload) {
      removeToken();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;

