import { Icons } from "./Icons";
import type { SidebarSection } from "./types";
import { allow } from "./roleCapabilities";

/**
 * Sidebar navigation config — role-based visibility derived from backend @PreAuthorize.
 *
 * Role mapping (from backend EmployeeRole enum):
 *   HR       — full access to all modules
 *   MANAGER  — employee directory (view), offboarding, attendance, schedules, requests review,
 *              recruitment, job requests, performance
 *   EMPLOYEE — self-service: own attendance, own requests, own schedule, check-in/out, performance (own)
 *   MENTOR   — performance (mentor features)
 *   FINANCE  — payroll / finance endpoints
 *   INTERN   — self-service: same as EMPLOYEE (limited)
 *   PROBATION— self-service: same as EMPLOYEE (limited)
 */
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
        // All authenticated users can see the dashboard
      },
      {
        key: "candidate",
        label: "Candidate",
        path: "/onboarding/hired",
        icon: Icons.recruitment,
        // GET /api/applications/hired
      },
      {
        key: "employees",
        label: "Employees",
        icon: Icons.people,
        roles: allow("employees:view"),
        children: [
          {
            key: "directory",
            label: "Directory",
            path: "/employees",
            roles: allow("employees:view"),
          },
          {
            key: "onboarding",
            label: "Onboarding",
            path: "/onboarding/progress",
            roles: allow("onboarding:manage"),
          },
          {
            key: "offboarding",
            label: "Offboarding",
            path: "/offboarding/requests",
            roles: allow("offboarding:manage"),
          },
        ],
      },
      {
        key: "request",
        label: "Request",
        icon: Icons.checklist,
        // All authenticated users can submit requests; HR/MANAGER can review
        children: [
          {
            key: "create-request",
            label: "Create Request",
            path: "/attendance/applications",
            // POST /api/v1/requests → any authenticated
          },
          {
            key: "review-request",
            label: "Review Request",
            path: "/attendance/review",
            roles: allow("request:review"),
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
            roles: allow("attendance:manage"),
          },
          {
            key: "att-summary",
            label: "Attendance Summary",
            path: "/attendance/summary",
            roles: allow("attendance:manage"),
          },
        ],
      },
      {
        key: "payroll",
        label: "Payroll",
        icon: Icons.payroll,
        roles: allow("payroll:group"),
        // Payroll visible for HR/FINANCE group; tax report is limited to HR/MANAGER
        children: [
          {
            key: "my-payslips",
            label: "My Payslips",
            path: "/payroll/employee",
            // Self-service — any authenticated
          },
          {
            key: "finance-payment",
            label: "Finance Payment",
            path: "/payroll/finance",
            roles: allow("payroll:finance"),
          },
          {
            key: "hr-payroll",
            label: "Payroll Management",
            path: "/payroll/hr",
            roles: allow("payroll:hr"),
          },
          {
            key: "tax-insurance",
            label: "Tax & Insurance Reports",
            path: "/payroll/tax-report",
            roles: allow("payroll:tax"),
          },
        ],
      },
      {
        key: "check-in-out",
        label: "Check-in/Out",
        path: "/attendance/check-in-out",
        icon: Icons.timeoff,
        // POST /api/v1/attendance/check-in → any authenticated (self-service)
      },
      {
        key: "performance",
        label: "Performance",
        path: "/performance",
        icon: Icons.performance,
        roles: allow("performance:view"),
      },
    ],
  },

  // ═══════════════════════════════════════════════════
  //  GROWTH
  // ═══════════════════════════════════════════════════
  {
    key: "growth",
    sectionLabel: "Growth",
    roles: allow("recruitment:view"),
    items: [
      {
        key: "recruitment",
        label: "Recruitment",
        icon: Icons.recruitment,
        roles: allow("recruitment:view"),
        children: [
          {
            key: "job-requests",
            label: "Job Requests",
            path: "/recruitment/job-requests",
            roles: allow("recruitment:view"),
          },
          {
            key: "job-openings",
            label: "Job Openings",
            path: "/recruitment/jobs",
            roles: allow("recruitment:manage"),
          },
          {
            key: "schedules",
            label: "Schedules",
            path: "/recruitment/schedules",
            roles: allow("recruitment:view"),
          },
        ],
      },
    ],
  },
];
