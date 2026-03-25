import type { UserRole } from "../../../hooks/useAuth";

export type SidebarCapability =
  | "candidate:view"
  | "employees:view"
  | "onboarding:manage"
  | "offboarding:manage"
  | "request:review"
  | "attendance:manage"
  | "attendance:view"
  | "payroll:admin"
  | "performance:view"
  | "recruitment:view"
  | "cnb:manage"
  | "cnb:view";

const capabilityRoles: Record<SidebarCapability, UserRole[]> = {
  "candidate:view": ["HR"],
  "employees:view": ["HR", "MANAGER"],
  "onboarding:manage": ["HR"],
  "offboarding:manage": ["HR", "MANAGER"],
  "request:review": ["HR", "MANAGER"],
  "attendance:manage": ["HR", "MANAGER"],
  "attendance:view": ["HR", "MANAGER", "EMPLOYEE", "INTERN", "PROBATION", "FINANCE", "MENTOR"],
  "payroll:admin": ["HR", "MANAGER", "FINANCE"],
  "performance:view": ["HR", "MANAGER", "EMPLOYEE", "MENTOR"],
  "recruitment:view": ["HR", "MANAGER"],
  "cnb:manage": ["HR", "MANAGER"],
  "cnb:view": ["HR", "MANAGER", "EMPLOYEE", "INTERN", "PROBATION", "FINANCE", "MENTOR"],
};

const routeCapabilityMap: Array<{
  prefix: string;
  capability: SidebarCapability;
}> = [
    { prefix: "/onboarding/hired", capability: "candidate:view" },
    { prefix: "/onboarding/progress", capability: "onboarding:manage" },
    { prefix: "/employees", capability: "employees:view" },
    { prefix: "/offboarding/requests", capability: "offboarding:manage" },
    { prefix: "/attendance/review", capability: "request:review" },
    { prefix: "/attendance/view-schedule", capability: "attendance:view" },
    { prefix: "/attendance/create-schedule", capability: "attendance:manage" },
    { prefix: "/attendance/summary", capability: "attendance:manage" },
    { prefix: "/payroll/hr", capability: "payroll:admin" },
    { prefix: "/payroll/tax-report", capability: "payroll:admin" },
    { prefix: "/payroll/cnb-manager", capability: "cnb:manage" },
    { prefix: "/payroll/my-trs", capability: "cnb:view" },
    { prefix: "/performance", capability: "performance:view" },
    { prefix: "/recruitment", capability: "recruitment:view" },
    { prefix: "/recruitment/jobs", capability: "recruitment:view" },
    { prefix: "/recruitment/requests", capability: "recruitment:view" },
    { prefix: "/recruitment/schedules", capability: "recruitment:view" },
  ];

export function allow(capability: SidebarCapability): UserRole[] {
  return capabilityRoles[capability];
}

export function canAccessPath(roles: UserRole[], pathname: string): boolean {
  const matched = routeCapabilityMap.find((item) =>
    pathname.startsWith(item.prefix),
  );
  if (!matched) return true;

  const allowedRoles = allow(matched.capability);
  return roles.some(role => allowedRoles.includes(role));
}

export const sidebarRoleCapabilities = capabilityRoles;
export const protectedRouteCapabilities = routeCapabilityMap;
