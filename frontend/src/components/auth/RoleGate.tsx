import React from "react";
import { useAuth, type UserRole } from "../../hooks/useAuth";

interface RoleGateProps {
  /** Roles allowed to see the children */
  allowed: UserRole[];
  /** Optional fallback when role is denied (default: render nothing) */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

const RoleGate: React.FC<RoleGateProps> = ({ allowed, fallback = null, children }) => {
  const { hasRole } = useAuth();

  if (!hasRole(...allowed)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default RoleGate;
