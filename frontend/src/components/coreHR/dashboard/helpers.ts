import { decodeJwt } from "../../../utils/jwtDecode";
import { getToken } from "../../../services/authService";
import type { Employee } from "../hooks/types";

export interface DashboardStats {
  total: number;
  active: number;
  onboarding: number;
  onLeave: number;
  probation: number;
  inactive: number;
}

export function useCurrentUser() {
  const payload = decodeJwt(getToken());
  return {
    name: payload?.fullName ?? payload?.sub ?? "HR Manager",
    role: payload?.roles?.[0]?.replace("ROLE_", "") ?? "HR",
    avatarUrl: payload?.avatarUrl ?? "",
  };
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function buildStats(employees: Employee[]): DashboardStats {
  return {
    total: employees.length,
    active: employees.filter((e) => e.statusEmp?.toUpperCase() === "OFFICIAL")
      .length,
    onboarding: employees.filter((e) => e.statusEmp?.toUpperCase() === "INTERN")
      .length,
    onLeave: 0,
    probation: employees.filter(
      (e) => e.statusEmp?.toUpperCase() === "PROBATION",
    ).length,
    inactive: employees.filter((e) =>
      ["TERMINATED", "RESIGNED"].includes(e.statusEmp?.toUpperCase() || ""),
    ).length,
  };
}
