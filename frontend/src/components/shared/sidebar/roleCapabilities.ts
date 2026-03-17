import type { UserRole } from "../../../hooks/useAuth";

export type SidebarCapability =
  | "candidate:view"
  | "employees:view"
  | "onboarding:manage"
  | "offboarding:manage"
  | "request:review"
  | "attendance:manage"
  | "payroll:group"
  | "payroll:finance"
  | "payroll:hr"
  | "payroll:tax"
  | "performance:view"
  | "recruitment:view"
  | "recruitment:manage";

const allAuthenticatedRoles: UserRole[] = [
  "HR",
  "MANAGER",
  "EMPLOYEE",
  "FINANCE",
  "MENTOR",
  "INTERN",
  "PROBATION",
];

const capabilityRoles: Record<SidebarCapability, UserRole[]> = {
  "candidate:view": allAuthenticatedRoles,
  "employees:view": ["HR", "MANAGER"],
  "onboarding:manage": ["HR"],
  "offboarding:manage": ["HR", "MANAGER"],
  "request:review": ["MANAGER"],
  "attendance:manage": ["MANAGER"],
  "payroll:group": ["HR", "FINANCE"],
  "payroll:finance": ["FINANCE"],
  "payroll:hr": ["HR", "MANAGER"],
  "payroll:tax": ["HR", "MANAGER"],
  "performance:view": ["HR", "MANAGER", "EMPLOYEE", "MENTOR"],
  "recruitment:view": ["HR", "MANAGER"],
  "recruitment:manage": ["HR"],
};

const routeCapabilityMap: Array<{
  prefix: string;
  capability: SidebarCapability;
}> = [
    { prefix: "/onboarding/hired", capability: "candidate:view" },
    { prefix: "/onboarding/progress", capability: "onboarding:manage" },
    { prefix: "/employees", capability: "employees:view" },
    { prefix: "/offboarding/requests", capability: "offboarding:manage" },
    { prefix: "/offboarding/approval", capability: "offboarding:manage" },
    { prefix: "/attendance/review", capability: "request:review" },
    { prefix: "/attendance/create-schedule", capability: "attendance:manage" },
    { prefix: "/attendance/summary", capability: "attendance:manage" },
    { prefix: "/payroll/employee", capability: "payroll:group" },
    { prefix: "/payroll/finance", capability: "payroll:finance" },
    { prefix: "/payroll/hr", capability: "payroll:hr" },
    { prefix: "/payroll/tax-report", capability: "payroll:tax" },
    { prefix: "/performance", capability: "performance:view" },
    { prefix: "/recruitment", capability: "recruitment:view" },
    { prefix: "/recruitment/jobs", capability: "recruitment:manage" },
    { prefix: "/recruitment/job-requests", capability: "recruitment:view" },
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
  return roles.some((role) => allowedRoles.includes(role));
}

export const sidebarRoleCapabilities = capabilityRoles;
export const protectedRouteCapabilities = routeCapabilityMap;
