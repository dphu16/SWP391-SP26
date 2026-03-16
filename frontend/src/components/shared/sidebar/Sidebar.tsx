import React, { useState } from "react";
import { Icons } from "./Icons";
import SidebarItem from "./SidebarItem";
import SidebarGroup from "./SidebarGroup";
import { sidebarConfig } from "./sidebarConfig";
import { isMenuGroup } from "./types";
import { useAuth } from "../../../hooks/useAuth";
import { useScheduleCount } from "../../../hooks/useScheduleCount";

const SectionLabel: React.FC<{ label: string; isCollapsed: boolean }> = ({
  label,
  isCollapsed,
}) =>
  isCollapsed ? (
    <div className="my-2 border-t border-border-light mx-2" />
  ) : (
    <div className="px-3 pt-4 pb-1.5 text-[10px] font-bold uppercase tracking-widest text-text-muted-light">
      {label}
    </div>
  );

const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();
  const { count: scheduleCount } = useScheduleCount();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const badges = {
    schedules: scheduleCount,
  };

  return (
    <aside
      className={`sidebar-transition relative z-50 bg-surface-light border-r border-border-light flex flex-col shrink-0 h-full
        ${isCollapsed ? "w-18" : "w-64"}`}
    >
      {/* ── Header ── */}
      <div
        className={`h-16 flex items-center shrink-0 border-b border-border-light
          ${isCollapsed ? "justify-center px-4" : "justify-between px-5"}`}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <svg viewBox="0 0 20 20" fill="white" className="w-4 h-4">
                <path d="M7 8a3 3 0 100-6 3 3 0 000 6zM14.5 9a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1.615 16.428a1.224 1.224 0 01-.569-1.175 6.002 6.002 0 0111.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 017 17a9.953 9.953 0 01-5.385-1.572zM14.5 16h-.106c.07-.297.088-.611.048-.933a7.47 7.47 0 00-1.588-3.755 4.502 4.502 0 015.874 2.636.818.818 0 01-.36.98A7.465 7.465 0 0114.5 16z" />
              </svg>
            </div>
            <span className="text-[15px] font-bold tracking-tight text-text-primary-light font-heading">
              HRM
            </span>
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
          className="absolute -right-3 top-13 w-6 h-6 rounded-full bg-surface-light border border-border-light flex items-center justify-center text-text-secondary-light hover:text-primary shadow-sm transition-colors cursor-pointer z-10"
          aria-label="Expand sidebar"
        >
          {Icons.chevronRight}
        </button>
      )}

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-0.5">
        {sidebarConfig
          .filter((section) => !section.roles || hasRole(...section.roles))
          .map((section) => {
            // Filter items by role
            const visibleItems = section.items.filter(
              (item) => !item.roles || hasRole(...item.roles),
            );
            if (visibleItems.length === 0) return null;

            return (
              <React.Fragment key={section.key}>
                <SectionLabel
                  label={section.sectionLabel}
                  isCollapsed={isCollapsed}
                />
                {visibleItems.map((item) =>
                  isMenuGroup(item) ? (
                    <SidebarGroup
                      key={item.key}
                      group={item}
                      isCollapsed={isCollapsed}
                      onExpandSidebar={() => setIsCollapsed(false)}
                      hasRole={hasRole}
                      badges={badges}
                    />
                  ) : (
                    <SidebarItem
                      key={item.key}
                      item={{
                        ...item,
                        badge: (badges as Record<string, number>)[item.key],
                      }}
                      isCollapsed={isCollapsed}
                    />
                  ),
                )}
              </React.Fragment>
            );
          })}
      </nav>
    </aside>
  );
};

export default Sidebar;
