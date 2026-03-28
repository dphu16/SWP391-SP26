import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { Icons } from "./Icons";
import SidebarItem from "./SidebarItem";
import type { SidebarMenuGroup as SidebarMenuGroupType } from "./types";
import type { UserRole } from "../../../hooks/useAuth";

interface SidebarGroupProps {
  group: SidebarMenuGroupType;
  isCollapsed: boolean;
  onExpandSidebar: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  badges?: Record<string, number>;
}

const SidebarGroup: React.FC<SidebarGroupProps> = ({
  group,
  isCollapsed,
  onExpandSidebar,
  hasRole,
  badges,
}) => {
  const location = useLocation();
  const [expanded, setExpanded] = useState(true);

  // Filter children by role
  const visibleChildren = group.children.filter(
    (child) => !child.roles || hasRole(...child.roles),
  );

  // Don't render at all if no children are visible
  if (visibleChildren.length === 0) return null;

  // Determine if group is "active" — any child path matches current location
  const isGroupActive = visibleChildren.some(
    (child) =>
      location.pathname === child.path ||
      location.pathname.startsWith(child.path + "/") ||
      child.activeMatchPaths?.some((p) => location.pathname.startsWith(p)),
  );

  const handleToggle = () => {
    if (isCollapsed) {
      onExpandSidebar();
      setExpanded(true);
    } else {
      setExpanded((prev) => !prev);
    }
  };

  return (
    <div>
      {/* Group header button */}
      <button
        onClick={handleToggle}
        title={isCollapsed ? group.label : undefined}
        className={`relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring
          ${isCollapsed ? "justify-center" : ""}
          ${isGroupActive
            ? "text-primary"
            : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
          }`}
      >
        <span className="shrink-0">{group.icon}</span>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{group.label}</span>
            <span
              className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
            >
              {Icons.chevronDown}
            </span>
          </>
        )}
      </button>

      {/* Submenu items */}
      {!isCollapsed && expanded && (
        <div className="mt-0.5 space-y-0.5 animate-slide-up">
          {visibleChildren.map((child) => (
            <SidebarItem
              key={child.key}
              item={{ ...child, badge: badges?.[child.key] }}
              isCollapsed={false}
              indent
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SidebarGroup;
