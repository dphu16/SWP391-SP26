import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const Icons = {
  dashboard: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm6.5-9A2.25 2.25 0 008.5 4.25v2.5A2.25 2.25 0 0010.75 9h2.5A2.25 2.25 0 0015.5 6.75v-2.5A2.25 2.25 0 0013.25 2h-2.5zm0 9a2.25 2.25 0 00-2.25 2.25v2.5a2.25 2.25 0 002.25 2.25h2.5a2.25 2.25 0 002.25-2.25v-2.5a2.25 2.25 0 00-2.25-2.25h-2.5z" clipRule="evenodd" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
    </svg>
  ),
  checklist: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
  ),
  timeoff: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clipRule="evenodd" />
    </svg>
  ),
  attendance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
    </svg>
  ),
  payroll: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M1 4a1 1 0 011-1h16a1 1 0 011 1v8a1 1 0 01-1 1H2a1 1 0 01-1-1V4zm12 4a3 3 0 11-6 0 3 3 0 016 0zM4 9a1 1 0 100-2 1 1 0 000 2zm13-1a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
    </svg>
  ),
  performance: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path fillRule="evenodd" d="M12.577 4.878a.75.75 0 01.919-.53l4.78 1.281a.75.75 0 01.531.919l-1.281 4.78a.75.75 0 01-1.449-.387l.81-3.022a19.407 19.407 0 00-5.594 5.203.75.75 0 01-1.139.093L7 10.06l-4.72 4.72a.75.75 0 01-1.06-1.061l5.25-5.25a.75.75 0 011.06 0l3.074 3.073a20.923 20.923 0 015.545-4.931l-3.042-.815a.75.75 0 01-.53-.918z" clipRule="evenodd" />
    </svg>
  ),
  recruitment: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-[18px] h-[18px]">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
    </svg>
  ),
  chevronLeft: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
      <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06z" clipRule="evenodd" />
    </svg>
  ),
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
  badge?: number;
  indent?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({
  icon, label, isActive, isCollapsed, onClick, badge, indent,
}) => (
  <button
    onClick={onClick}
    title={isCollapsed ? label : undefined}
    className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring group
      ${indent && !isCollapsed ? "pl-10" : ""}
      ${isActive
        ? "bg-primary/10 text-primary"
        : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
      }
      ${isCollapsed ? "justify-center" : ""}
    `}
  >
    {isActive && !isCollapsed && (
      <span className="active-nav-indicator" />
    )}

    <span className={`flex-shrink-0 ${isActive ? "text-primary" : ""}`}>
      {icon}
    </span>
    {!isCollapsed && (
      <span className="flex-1 text-left truncate">{label}</span>
    )}

    {!isCollapsed && badge !== undefined && badge > 0 && (
      <span className="ml-auto flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const SectionLabel: React.FC<{ label: string; isCollapsed: boolean }> = ({ label, isCollapsed }) =>
  isCollapsed ? (
    <div className="my-2 border-t border-border-light mx-2" />
  ) : (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light">
      {label}
    </div>
  );

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const hasRole = (..._args: any[]) => true; // Auth removed
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [employeesExpanded, setEmployeesExpanded] = useState(true);
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [recruitmentExpanded, setRecruitmentExpanded] = useState(true);
  const [attendanceExpanded, setAttendanceExpanded] = useState(true);
  const [payrollExpanded, setPayrollExpanded] = useState(true);


  const isPath = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
    <aside
      className={`sidebar-transition relative bg-surface-light border-r border-border-light flex flex-col flex-shrink-0 h-full
        ${isCollapsed ? "w-[72px]" : "w-64"}
      `}
    >
      <div className={`h-16 flex items-center flex-shrink-0 border-b border-border-light
        ${isCollapsed ? "justify-center px-4" : "justify-between px-5"}
      `}>
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-text-primary-light font-heading">
              HRM</span>
          </div>
        )}

        {isCollapsed && (
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
              <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
            </svg>
          </div>
        )}

        {!isCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light transition-colors cursor-pointer"
            aria-label="Collapse sidebar"
          >
            {Icons.chevronLeft}
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute -right-3 top-[52px] w-6 h-6 rounded-full bg-surface-light border border-border-light flex items-center justify-center text-text-secondary-light hover:text-primary shadow-sm transition-colors cursor-pointer z-10"
          aria-label="Expand sidebar"
        >
          {Icons.chevronRight}
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-0.5">

        {/* Core */}
        <SectionLabel label="Core" isCollapsed={isCollapsed} />

        <NavItem
          icon={Icons.dashboard}
          label="Dashboard"
          isActive={isPath("/dashboard")}
          isCollapsed={isCollapsed}
          onClick={() => navigate("/dashboard")}
        />

        {/* Employees with submenu — HR and MANAGER only */}
        {hasRole("HR", "MANAGER") && (
          <div>
            <button
              onClick={() => {
                if (isCollapsed) {
                  setIsCollapsed(false);
                  setEmployeesExpanded(true);
                } else {
                  setEmployeesExpanded(!employeesExpanded);
                }
              }}
              title={isCollapsed ? "Employees" : undefined}
              className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
              ${isCollapsed ? "justify-center" : ""}
              ${isPath("/employees") || isPath("/onboarding") || isPath("/offboarding")
                  ? "text-primary bg-primary/10"
                  : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
                }
            `}
            >
              <span className="flex-shrink-0">{Icons.people}</span>
              {!isCollapsed && (
                <>
                  <span className="flex-1 text-left">Employees</span>
                  <span className={`transition-transform duration-200 ${employeesExpanded ? "rotate-180" : ""}`}>
                    {Icons.chevronDown}
                  </span>
                </>
              )}
            </button>

            {/* Submenu */}
            {!isCollapsed && employeesExpanded && (
              <div className="mt-0.5 space-y-0.5 animate-slide-up">
                {[
                  { label: "Directory", path: "/employees", roles: ["HR", "MANAGER"] as const },
                  { label: "Onboarding", path: "/onboarding", roles: ["HR"] as const },
                  { label: "Offboarding", path: "/offboarding", roles: ["HR"] as const },
                ]
                  .filter((item) => hasRole(...item.roles))
                  .map((item) => (
                    <NavItem
                      key={item.path}
                      icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />}
                      label={item.label}
                      isActive={location.pathname === item.path}
                      isCollapsed={false}
                      indent
                      onClick={() => navigate(item.path)}
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Request with submenu */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setRequestExpanded(true);
              } else {
                setRequestExpanded(!requestExpanded);
              }
            }}
            title={isCollapsed ? "Request" : undefined}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
              ${isCollapsed ? "justify-center" : ""}
              ${isPath("/requests") || isPath("/attendance/applications") || isPath("/attendance/review")
                ? "text-primary bg-primary/10"
                : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
              }
            `}
          >
            <span className="flex-shrink-0">{Icons.checklist}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Request</span>
                <span className={`transition-transform duration-200 ${requestExpanded ? "rotate-180" : ""}`}>
                  {Icons.chevronDown}
                </span>
              </>
            )}
          </button>

          {/* Submenu */}
          {!isCollapsed && requestExpanded && (
            <div className="mt-0.5 space-y-0.5 animate-slide-up">
              {[
                { label: "My Requests", path: "/requests/my-requests" },
                { label: "Create Request", path: "/attendance/applications" },
                { label: "Review Request", path: "/attendance/review" },
              ].map((item) => (
                <NavItem
                  key={item.path}
                  icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />}
                  label={item.label}
                  isActive={location.pathname === item.path}
                  isCollapsed={false}
                  indent
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Management */}
        <SectionLabel label="Management" isCollapsed={isCollapsed} />

        {/* 3. Submenu: Attendance */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setAttendanceExpanded(true);
              } else {
                setAttendanceExpanded(!attendanceExpanded);
              }
            }}
            title={isCollapsed ? "Attendance" : undefined}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
              ${isCollapsed ? "justify-center" : ""}
              ${isPath("/attendance") && !isPath("/attendance/applications") && !isPath("/attendance/review") && !isPath("/attendance/check-in-out")
                ? "text-primary bg-primary/10"
                : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
              }
            `}
          >
            <span className="flex-shrink-0">{Icons.attendance}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Attendance</span>
                <span className={`transition-transform duration-200 ${attendanceExpanded ? "rotate-180" : ""}`}>
                  {Icons.chevronDown}
                </span>
              </>
            )}
          </button>

          {/* Submenu */}
          {!isCollapsed && attendanceExpanded && (
            <div className="mt-0.5 space-y-0.5 animate-slide-up">
              {[
                { label: "View Schedule", path: "/attendance/view-schedule" },
                { label: "Create Schedule", path: "/attendance/create-schedule" },
                { label: "Attendance Summary", path: "/attendance/summary" },
              ].map((item) => (
                <NavItem
                  key={item.path}
                  icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />}
                  label={item.label}
                  isActive={location.pathname === item.path}
                  isCollapsed={false}
                  indent
                  onClick={() => navigate(item.path)}
                />
              ))}
            </div>
          )}
        </div>

        {/* 4. Submenu: Payroll */}
        <div>
          <button
            onClick={() => {
              if (isCollapsed) {
                setIsCollapsed(false);
                setPayrollExpanded(true);
              } else {
                setPayrollExpanded(!payrollExpanded);
              }
            }}
            title={isCollapsed ? "Payroll" : undefined}
            className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
              ${isCollapsed ? "justify-center" : ""}
              ${isPath("/payroll")
                ? "text-primary bg-primary/10"
                : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
              }
            `}
          >
            <span className="flex-shrink-0">{Icons.payroll}</span>
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">Payroll</span>
                <span className={`transition-transform duration-200 ${payrollExpanded ? "rotate-180" : ""}`}>
                  {Icons.chevronDown}
                </span>
              </>
            )}
          </button>

          {/* Submenu */}
          {!isCollapsed && payrollExpanded && (
            <div className="mt-0.5 space-y-0.5 animate-slide-up">
              {[
                { label: "My Payslips", path: "/payroll/employee" },
                { label: "HR Payroll", path: "/payroll/hr", roles: ["HR", "MANAGER"] as const },
                { label: "Tax & Insurance", path: "/payroll/tax-report", roles: ["HR", "MANAGER", "FINANCE"] as const },
              ]
                .filter((item) => !item.roles || hasRole(...item.roles))
                .map((item) => (
                  <NavItem
                    key={item.path}
                    icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />}
                    label={item.label}
                    isActive={location.pathname === item.path}
                    isCollapsed={false}
                    indent
                    onClick={() => navigate(item.path)}
                  />
                ))}
            </div>
          )}
        </div>

        {[
          { label: "Check-in/Out", icon: Icons.timeoff, path: "/attendance/check-in-out", badge: 3 },
          { label: "Performance", icon: Icons.performance, path: "/performance", roles: ["HR", "MANAGER", "FINANCE"] as const },
        ]
          .filter((item) => !item.roles || hasRole(...item.roles))
          .map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              isActive={item.path ? isPath(item.path) : false}
              isCollapsed={isCollapsed}
              badge={item.badge}
              onClick={item.path ? () => navigate(item.path) : undefined}
            />
          ))}

        {/* Growth — HR only */}
        {hasRole("HR") && (
          <>
            <SectionLabel label="Growth" isCollapsed={isCollapsed} />

            <div>
              <button
                onClick={() => {
                  if (isCollapsed) {
                    setIsCollapsed(false);
                    setRecruitmentExpanded(true);
                  } else {
                    setRecruitmentExpanded(!recruitmentExpanded);
                  }
                }}
                title={isCollapsed ? "Recruitment" : undefined}
                className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
                ${isCollapsed ? "justify-center" : ""}
                ${isPath("/recruitment")
                    ? "text-primary bg-primary/10"
                    : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
                  }
              `}
              >
                <span className="flex-shrink-0">{Icons.recruitment}</span>
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left">Recruitment</span>
                    <span className={`transition-transform duration-200 ${recruitmentExpanded ? "rotate-180" : ""}`}>
                      {Icons.chevronDown}
                    </span>
                  </>
                )}
              </button>

              {/* Submenu */}
              {!isCollapsed && recruitmentExpanded && (
                <div className="mt-0.5 space-y-0.5 animate-slide-up">
                  {[
                    { label: "Job Requests", path: "/recruitment/job-requests" },
                    { label: "Job Openings", path: "/recruitment/jobs" },
                  ].map((item) => (
                    <NavItem
                      key={item.path}
                      icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />}
                      label={item.label}
                      isActive={location.pathname === item.path}
                      isCollapsed={false}
                      indent
                      onClick={() => navigate(item.path)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;