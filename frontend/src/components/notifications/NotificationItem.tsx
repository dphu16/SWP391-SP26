import React from "react";
import type { Notification } from "../../services/notificationService";

// ─── Icon map for notification types ─────────────────────────
const typeIcons: Record<string, string> = {
  REQUEST_SENT: "📨",
  REQUEST_RECEIVED: "📥",
};

function getIcon(type: string | null): string {
  if (!type) return "🔔";
  return typeIcons[type] ?? "🔔";
}

function formatTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

interface NotificationItemProps {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onNavigate?: (notification: Notification) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification: n,
  onMarkRead,
  onNavigate,
}) => {
  const handleClick = () => {
    if (!n.isRead) {
      onMarkRead(n.notificationId);
    }
    if (onNavigate) {
      onNavigate(n);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 border-b border-border-light last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer ${
        !n.isRead ? "bg-primary/5" : ""
      }`}
    >
      <div className="flex items-start gap-2.5">
        {/* Type icon */}
        <span className="mt-0.5 text-base flex-shrink-0 leading-none">
          {getIcon(n.type)}
        </span>

        <div className="flex-1 min-w-0">
          {/* Title */}
          {n.title && (
            <p
              className={`text-xs leading-tight mb-0.5 ${
                !n.isRead
                  ? "font-semibold text-text-primary-light"
                  : "font-medium text-text-secondary-light"
              }`}
            >
              {n.title}
            </p>
          )}

          {/* Message */}
          <p
            className={`text-[11px] leading-relaxed ${
              !n.isRead
                ? "text-text-primary-light"
                : "text-text-secondary-light"
            }`}
          >
            {n.message}
          </p>

          {/* Time */}
          <div className="mt-1">
            <span className="text-[10px] text-text-muted-light">
              {formatTime(n.createdAt)}
            </span>
          </div>
        </div>

        {/* Unread dot */}
        {!n.isRead && (
          <span className="mt-2 w-2 h-2 flex-shrink-0 bg-primary rounded-full" />
        )}
      </div>
    </button>
  );
};

export default NotificationItem;

