import React, { useMemo } from "react";
import { Link, useLocation, matchPath } from "react-router-dom";

type RouteNode = {
  path: string;
  label: string;
  parent?: string;
  isClickable?: boolean;
};

// Deterministic Route Tree covering the entire application
// Based strictly on the routing configuration and nested hierarchy
const ROUTE_TREE: RouteNode[] = [
  { path: "/dashboard", label: "Dashboard", isClickable: true },
  { path: "/profile", label: "My Profile", parent: "/dashboard", isClickable: true },

  // Employee Management
  { path: "/employees", label: "Employees", parent: "/dashboard", isClickable: true },
  { path: "/employee/:id", label: "Employee Detail", parent: "/employees", isClickable: true },

  // Candidate
  { path: "/onboarding/hired", label: "Candidate", parent: "/dashboard", isClickable: true },
  { path: "/onboarding/progress", label: "Onboarding", parent: "/employees", isClickable: true },
  { path: "/onboarding/:applicationId/profile", label: "Candidate Profile", parent: "/onboarding/progress", isClickable: true },

  // Offboarding
  { path: "/offboarding/requests", label: "Offboarding", parent: "/employees", isClickable: true },

  // Requests
  { path: "/attendance/requests", label: "Request", parent: "/dashboard", isClickable: false },
  { path: "/attendance/applications", label: "Create Request", parent: "/attendance/requests", isClickable: true }, 
  { path: "/attendance/review", label: "Review Request", parent: "/attendance/requests", isClickable: true }, 

  // Attendance
  { path: "/attendance-root", label: "Attendance", parent: "/dashboard", isClickable: false },
  { path: "/attendance/view-schedule", label: "View Schedule", parent: "/attendance-root", isClickable: true },
  { path: "/attendance/create-schedule", label: "Create Schedule", parent: "/attendance-root", isClickable: true },
  { path: "/attendance/summary", label: "Attendance Summary", parent: "/attendance-root", isClickable: true },
  { path: "/attendance/check-in-out", label: "Check-in/Out", parent: "/dashboard", isClickable: true },

  // Payroll
  { path: "/payroll", label: "Payroll", parent: "/dashboard", isClickable: false },
  { path: "/payroll/employee", label: "My Payslips", parent: "/payroll", isClickable: true },
  { path: "/payroll/hr", label: "Payroll Management", parent: "/payroll", isClickable: true },
  { path: "/payroll/tax-report", label: "Tax & Insurance", parent: "/payroll", isClickable: true },
  { path: "/payroll/finance", label: "Finance Payment", parent: "/payroll", isClickable: true },
  { path: "/payroll/cnb-manager", label: "C&B Manager", parent: "/payroll", isClickable: true },
  { path: "/payroll/my-trs", label: "My Benefits", parent: "/payroll", isClickable: true },

  // Performance
  { path: "/performance", label: "Performance", parent: "/dashboard", isClickable: true },

  // Recruitment
  { path: "/recruitment", label: "Recruitment", parent: "/dashboard", isClickable: false },
  { path: "/recruitment/jobs", label: "Job Openings", parent: "/recruitment", isClickable: true },
  { path: "/recruitment/jobs/new", label: "New Job", parent: "/recruitment/jobs", isClickable: true },
  { path: "/recruitment/jobs/:id", label: "Job Detail", parent: "/recruitment/jobs", isClickable: true },
  { path: "/recruitment/jobs/edit/:id", label: "Edit Job", parent: "/recruitment/jobs/:id", isClickable: true },
  
  { path: "/recruitment/cvs", label: "CVs", parent: "/recruitment", isClickable: true },
  { path: "/recruitment/cvs/:id", label: "CV Detail", parent: "/recruitment/cvs", isClickable: true },
  
  { path: "/recruitment/schedules", label: "Schedules", parent: "/recruitment", isClickable: true },
  
  { path: "/recruitment/job-requests", label: "Job Requests", parent: "/recruitment", isClickable: true },
  { path: "/recruitment/job-requests/new", label: "New Request", parent: "/recruitment/job-requests", isClickable: true },
  { path: "/recruitment/job-requests/:id", label: "Request Detail", parent: "/recruitment/job-requests", isClickable: true },
  { path: "/recruitment/job-requests/:id/edit", label: "Edit Request", parent: "/recruitment/job-requests/:id", isClickable: true },

  // Settings
  { path: "/settings/account", label: "Settings", parent: "/dashboard", isClickable: true },
];

const Breadcrumb: React.FC = () => {
  const location = useLocation();

  const breadcrumbs = useMemo(() => {
    let currentMatch: RouteNode | undefined;
    let matchParams: Record<string, string | undefined> = {};

    // 1. Find the deepest/most exact matching route definition
    const exactMatches = ROUTE_TREE.map(route => {
      const match = matchPath({ path: route.path, end: true }, location.pathname);
      return { route, match };
    }).filter(x => x.match);

    if (exactMatches.length > 0) {
      currentMatch = exactMatches[0].route;
      matchParams = exactMatches[0].match!.params;
    } else {
      // Fallback: match without end: true (longest prefix)
      const prefixMatches = ROUTE_TREE.map(route => {
        const match = matchPath({ path: route.path, end: false }, location.pathname);
        return { route, match };
      }).filter(x => x.match);

      if (prefixMatches.length > 0) {
        prefixMatches.sort((a, b) => b.route.path.length - a.route.path.length);
        currentMatch = prefixMatches[0].route;
        matchParams = prefixMatches[0].match!.params;
      }
    }

    const trail: { label: string; path: string; isClickable: boolean }[] = [];
    let currentNode = currentMatch;

    // 2. Walk up the node tree mapping back to parents
    while (currentNode) {
      // Build actual path replacing dynamic routing params
      let realPath = currentNode.path;
      for (const [key, value] of Object.entries(matchParams)) {
        if (value) {
          realPath = realPath.replace(`:${key}`, value);
        }
      }

      trail.unshift({
        label: currentNode.label,
        path: realPath,
        isClickable: currentNode.isClickable !== false,
      });

      if (currentNode.parent) {
        // Find parent node
        const pNode = ROUTE_TREE.find(r => r.path === currentNode!.parent);
        currentNode = pNode;
      } else {
        currentNode = undefined;
      }
    }

    // Always ensure Dashboard is the root
    if (trail.length === 0 || trail[0].path !== "/dashboard") {
      trail.unshift({ label: "Dashboard", path: "/dashboard", isClickable: true });
    }

    // Filter duplicates just in case root gets pushed twice
    return trail.filter(
      (crumb, index, self) => index === self.findIndex((t) => t.path === crumb.path)
    );
  }, [location.pathname]);

  // Fast return for Dashboard alone
  if (breadcrumbs.length <= 1 && breadcrumbs[0]?.path === "/dashboard") {
    return (
      <nav aria-label="Breadcrumb" className="animate-fade-in">
        <ol className="flex items-center gap-1.5 text-sm">
          <li>
            <span className="font-semibold text-text-primary-light">Dashboard</span>
          </li>
        </ol>
      </nav>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className="animate-fade-in">
      <ol className="flex items-center gap-1.5 text-sm">
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          return (
            <React.Fragment key={crumb.path}>
              <li>
                {isLast || !crumb.isClickable ? (
                  <span className={`font-semibold ${isLast ? 'text-text-primary-light' : 'text-text-secondary-light'}`}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link
                    to={crumb.path}
                    className="font-medium text-text-secondary-light hover:text-primary transition-colors hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </li>
              {!isLast && (
                <li>
                  <svg
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-3.5 h-3.5 text-text-muted-light"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.22 4.22a.75.75 0 011.06 0l3.25 3.25a.75.75 0 010 1.06l-3.25 3.25a.75.75 0 01-1.06-1.06L8.94 8 6.22 5.28a.75.75 0 010-1.06z"
                      clipRule="evenodd"
                    />
                  </svg>
                </li>
              )}
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

