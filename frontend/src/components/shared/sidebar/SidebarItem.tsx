import React from "react";
import { NavLink } from "react-router-dom";
import type { SidebarMenuItem } from "./types";

interface SidebarItemProps {
  item: SidebarMenuItem;
  isCollapsed: boolean;
  indent?: boolean;
}

const SidebarItem: React.FC<SidebarItemProps> = ({
  item,
  isCollapsed,
  indent,
}) => {
  const dotIcon = (
    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 shrink-0" />
  );

  return (
    <NavLink
      to={item.path}
      end={!item.activeMatchPaths}
      title={isCollapsed ? item.label : undefined}
      className={({ isActive }) => {
        // Also check extra paths
        const extraActive =
          item.activeMatchPaths?.some((p) => location.pathname.startsWith(p)) ??
          false;
        const active = isActive || extraActive;

        return `relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer focus-ring group
          ${indent && !isCollapsed ? "pl-10" : ""}
          ${
            active
              ? "bg-primary/10 text-primary"
              : "text-text-secondary-light hover:bg-gray-50/80 hover:text-text-primary-light"
          }
          ${isCollapsed ? "justify-center" : ""}`;
      }}
    >
      {({ isActive }) => {
        const extraActive =
          item.activeMatchPaths?.some((p) => location.pathname.startsWith(p)) ??
          false;
        const active = isActive || extraActive;

        return (
          <>
            {active && !isCollapsed && (
              <span className="active-nav-indicator" />
            )}
            <span className={`shrink-0 ${active ? "text-primary" : ""}`}>
              {indent ? dotIcon : item.icon}
            </span>
            {!isCollapsed && (
              <span className="flex-1 text-left truncate">{item.label}</span>
            )}
            {!isCollapsed && item.badge !== undefined && item.badge > 0 && (
              <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center justify-center">
                {item.badge}
              </span>
            )}
          </>
        );
      }}
    </NavLink>
  );
};

export default SidebarItem;
