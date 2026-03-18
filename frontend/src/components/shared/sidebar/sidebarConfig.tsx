import { Icons } from "./Icons";
import type { SidebarSection } from "./types";

import type { UserRole } from "../../../hooks/useAuth";

export const sidebarConfig: SidebarSection[] = [
  // ═══════════════════════════════════════════════════
  //  CORE
  // ═══════════════════════════════════════════════════
  {
    key: "core",
    sectionLabel: "Core",
    items: [
      {
        key: "dashboard",
        label: "Dashboard",
        path: "/dashboard",
        icon: Icons.dashboard,
      },
      {
        key: "candidate",
        label: "Candidate",
        path: "/onboarding/hired",
        icon: Icons.recruitment,
      },
      {
        key: "employees",
        label: "Employees",
        icon: Icons.people,
        roles: ["HR", "MANAGER"] as UserRole[],
        children: [
          {
            key: "directory",
            label: "Directory",
            path: "/employees",
            roles: ["HR", "MANAGER"] as UserRole[],
          },
          {
            key: "onboarding",
            label: "Onboarding",
            path: "/onboarding/progress",
            roles: ["HR"] as UserRole[],
          },
          {
            key: "offboarding",
            label: "Offboarding",
            path: "/offboarding/requests",
            roles: ["HR", "MANAGER"] as UserRole[],
            activeMatchPaths: ["/offboarding/history"],
          },
        ],
      },
      {
        key: "request",
        label: "Request",
        icon: Icons.checklist,
        children: [
          {
            key: "create-request",
            label: "Create Request",
            path: "/attendance/applications",
          },
          {
            key: "review-request",
            label: "Review Request",
            path: "/attendance/review",
          },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  MANAGEMENT
  // ═══════════════════════════════════════════════════
  {
    key: "management",
    sectionLabel: "Management",
    items: [
      {
        key: "attendance",
        label: "Attendance",
        icon: Icons.attendance,
        children: [
          {
            key: "view-schedule",
            label: "View Schedule",
            path: "/attendance/view-schedule",
          },
          {
            key: "create-schedule",
            label: "Create Schedule",
            path: "/attendance/create-schedule",
          },
          {
            key: "att-summary",
            label: "Attendance Summary",
            path: "/attendance/summary",
          },
        ],
      },
      {
        key: "check-in-out",
        label: "Check-in/Out",
        path: "/attendance/check-in-out",
        icon: Icons.timeoff,
        badge: 3,
      },
      {
        key: "payroll",
        label: "Payroll",
        icon: Icons.payroll,
        roles: ["HR", "MANAGER", "FINANCE", "EMPLOYEE"] as UserRole[],
        children: [
          {
            key: "my-payslips",
            label: "My Payslips",
            path: "/payroll/employee",
            roles: ["HR", "MANAGER", "FINANCE", "EMPLOYEE"] as UserRole[],
          },
          {
            key: "my-trs",
            label: "My Benefits",
            path: "/payroll/my-trs",
            roles: ["HR", "MANAGER", "EMPLOYEE", "FINANCE", "MENTOR", "INTERN", "PROBATION"] as UserRole[],
          },
          {
            key: "hr-payroll",
            label: "Payroll Management",
            path: "/payroll/hr",
            roles: ["HR", "MANAGER"] as UserRole[],
          },
          {
            key: "tax-insurance",
            label: "Tax & Insurance Report",
            path: "/payroll/tax-report",
            roles: ["HR", "MANAGER"] as UserRole[],
          },
          {
            key: "finance-payment",
            label: "Finance Payment",
            path: "/payroll/finance",
            roles: ["MANAGER", "FINANCE"] as UserRole[],
          },
          {
            key: "cnb-manager",
            label: "C&B Manager",
            path: "/payroll/cnb-manager",
            roles: ["HR", "MANAGER"] as UserRole[],
          },
        ],
      },
      {
        key: "performance",
        label: "Performance",
        path: "/performance",
        icon: Icons.performance,
        roles: ["HR", "MANAGER", "FINANCE"] as UserRole[],
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  GROWTH
  // ═══════════════════════════════════════════════════
  {
    key: "growth",
    sectionLabel: "Growth",
    roles: ["HR", "MANAGER"] as UserRole[],
    items: [
      {
        key: "recruitment",
        label: "Recruitment",
        icon: Icons.recruitment,
        roles: ["HR", "MANAGER"] as UserRole[],
        children: [
          {
            key: "job-requests",
            label: "Job Requests",
            path: "/recruitment/job-requests",
          },
          {
            key: "job-openings",
            label: "Job Openings",
            path: "/recruitment/jobs",
            roles: ["HR"] as UserRole[],
          },
          {
            key: "schedules",
            label: "Schedules",
            path: "/recruitment/schedules",
          },
        ],
      },
    ],
  },
];
