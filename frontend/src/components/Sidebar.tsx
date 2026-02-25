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
  chevronLeft: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
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
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer
      ${indent && !isCollapsed ? "pl-10" : ""}
      ${isActive ? "bg-primary/10 text-primary" : "text-text-secondary-light hover:bg-gray-100 hover:text-text-primary-light"}
      ${isCollapsed ? "justify-center" : ""}
    `}
    >
      <span className="flex-shrink-0">{icon}</span>
      {!isCollapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!isCollapsed && badge !== undefined && badge > 0 && (
          <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
        {badge}
      </span>
      )}
    </button>
);

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  // State quản lý mở rộng Submenu
  const [employeesExpanded, setEmployeesExpanded] = useState(true);
  const [requestExpanded, setRequestExpanded] = useState(true);
  const [attendanceExpanded, setAttendanceExpanded] = useState(true);

  const isPath = (path: string) => location.pathname === path || location.pathname.startsWith(path + "/");

  return (
      <aside className={`relative bg-surface-light border-r border-border-light flex flex-col h-full ${isCollapsed ? "w-[72px]" : "w-64"}`}>
        {/* ── Navigation ── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">

          <NavItem icon={Icons.dashboard} label="Dashboard" isActive={isPath("/dashboard")} isCollapsed={isCollapsed} onClick={() => navigate("/dashboard")} />

          {/* 1. Submenu: Employees */}
          <div>
            <button onClick={() => !isCollapsed && setEmployeesExpanded(!employeesExpanded)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isPath("/employees") || isPath("/onboarding") ? "text-primary bg-primary/10" : "text-text-secondary-light hover:bg-gray-100"}`}>
              <span>{Icons.people}</span>
              {!isCollapsed && <><span className="flex-1 text-left">Employees</span><span className={`transition-transform ${employeesExpanded ? "rotate-180" : ""}`}>{Icons.chevronDown}</span></>}
            </button>
            {!isCollapsed && employeesExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {[ { label: "Directory", path: "/employees" }, { label: "Onboarding", path: "/onboarding" }, { label: "Offboarding", path: "/offboarding" } ].map((item) => (
                      <NavItem key={item.path} icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />} label={item.label} isActive={location.pathname === item.path} isCollapsed={false} indent onClick={() => navigate(item.path)} />
                  ))}
                </div>
            )}
          </div>

          {/* 2. Submenu: Request (CHỨA APPLICATIONS VÀ REVIEW) */}
          <div>
            <button onClick={() => !isCollapsed && setRequestExpanded(!requestExpanded)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isPath("/requests") || isPath("/attendance/applications") ? "text-primary bg-primary/10" : "text-text-secondary-light hover:bg-gray-100"}`}>
              <span>{Icons.checklist}</span>
              {!isCollapsed && <><span className="flex-1 text-left">Request</span><span className={`transition-transform ${requestExpanded ? "rotate-180" : ""}`}>{Icons.chevronDown}</span></>}
            </button>
            {!isCollapsed && requestExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {[
                    { label: "Personal Info", path: "/requests/new" },
                    { label: "My Requests", path: "/requests/my-requests" },
                    { label: "Applications", path: "/attendance/applications" }, // Đã chuyển về đây
                    { label: "Review Requests", path: "/attendance/review" },     // Đã chuyển về đây
                  ].map((item) => (
                      <NavItem key={item.path} icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />} label={item.label} isActive={location.pathname === item.path} isCollapsed={false} indent onClick={() => navigate(item.path)} />
                  ))}
                </div>
            )}
          </div>

          {/* 3. Submenu: Attendance (CHỈ CÒN XẾP LỊCH & CHECKIN) */}
          <div>
            <button onClick={() => !isCollapsed && setAttendanceExpanded(!attendanceExpanded)} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${isPath("/attendance/view-schedule") || isPath("/attendance/create-schedule") || isPath("/attendance/check-in-out") ? "text-primary bg-primary/10" : "text-text-secondary-light hover:bg-gray-100"}`}>
              <span>{Icons.attendance}</span>
              {!isCollapsed && <><span className="flex-1 text-left">Attendance</span><span className={`transition-transform ${attendanceExpanded ? "rotate-180" : ""}`}>{Icons.chevronDown}</span></>}
            </button>
            {!isCollapsed && attendanceExpanded && (
                <div className="mt-0.5 space-y-0.5">
                  {[
                    { label: "View Schedule", path: "/attendance/view-schedule" },
                    { label: "Create Schedule", path: "/attendance/create-schedule" },
                    { label: "Check-in / Out", path: "/attendance/check-in-out" },
                  ].map((item) => (
                      <NavItem key={item.path} icon={<span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />} label={item.label} isActive={location.pathname === item.path} isCollapsed={false} indent onClick={() => navigate(item.path)} />
                  ))}
                </div>
            )}
          </div>
        </nav>
      </aside>
  );
};

export default Sidebar;