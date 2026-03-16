import React from "react";
import type { Notification } from "../../services/notificationService";
import NotificationItem from "./NotificationItem";

interface NotificationDropdownProps {
  open: boolean;
  notifications: Notification[];
  unreadCount: number;
  onMarkOneRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (notification: Notification) => void;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  open,
  notifications,
  unreadCount,
  onMarkOneRead,
  onMarkAllRead,
  onNavigate,
}) => {
  return (
    <div
      className={`absolute right-0 top-full mt-2 w-[340px] bg-surface-light rounded-2xl border border-border-light shadow-dropdown overflow-hidden transition-all duration-200 origin-top-right z-50 ${
        open
          ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
          : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
        <span className="text-sm font-semibold text-text-primary-light">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-1.5 inline-flex items-center justify-center bg-rose-100 text-rose-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-96 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="text-3xl mb-2">🔔</div>
            <p className="text-sm text-text-secondary-light">
              No notifications yet
            </p>
            <p className="text-[11px] text-text-muted-light mt-0.5">
              You'll see updates here when they arrive
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <NotificationItem
              key={n.notificationId}
              notification={n}
              onMarkRead={onMarkOneRead}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationDropdown;
