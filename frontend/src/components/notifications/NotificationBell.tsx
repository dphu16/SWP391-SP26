import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../hooks/useNotifications";
import NotificationDropdown from "./NotificationDropdown";
import type { Notification } from "../../services/notificationService";

// ─── Entity navigation map ─────────────────────────────────────
function getNavigationPath(notification: Notification): string | null {
  if (!notification.entityType || !notification.entityId) return null;

  const map: Record<string, (id: string) => string> = {
    REQUEST: (id) => `/requests/${id}`,
  };

  const resolver = map[notification.entityType];
  return resolver ? resolver(notification.entityId) : null;
}

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, markOneRead, markAllRead } =
    useNotifications();

  // ── Close on outside click ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // ── Close on Escape ──
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const handleNavigate = useCallback(
    (notification: Notification) => {
      const path = getNavigationPath(notification);
      if (path) {
        setOpen(false);
        navigate(path);
      }
    },
    [navigate],
  );

  return (
    <div className="relative" ref={containerRef}>
      {/* Bell button */}
      <button
        className="relative p-2 rounded-lg text-text-secondary-light hover:bg-gray-100 hover:text-text-primary-light transition-colors cursor-pointer"
        aria-label="Notifications"
        onClick={() => setOpen((o) => !o)}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="w-[18px] h-[18px]"
        >
          <path
            fillRule="evenodd"
            d="M4 8a6 6 0 1112 0c0 1.887.454 3.665 1.257 5.234a.75.75 0 01-.515 1.076 32.91 32.91 0 01-3.256.508 3.5 3.5 0 01-6.972 0 32.903 32.903 0 01-3.256-.508.75.75 0 01-.515-1.076A11.448 11.448 0 004 8zm6 7c-.655 0-1.305-.02-1.95-.057a2 2 0 003.9 0c-.645.038-1.295.057-1.95.057z"
            clipRule="evenodd"
          />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 flex items-center justify-center bg-rose-500 text-white text-[10px] font-bold rounded-full px-0.5 border border-surface-light animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      <NotificationDropdown
        open={open}
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkOneRead={markOneRead}
        onMarkAllRead={markAllRead}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default NotificationBell;
