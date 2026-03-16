import apiClient from "./apiClient";

// ──────────────────────────── Types ────────────────────────────

export interface Notification {
  notificationId: string;
  title: string | null;
  message: string;
  type: string;
  entityType: string | null;
  entityId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

// ──────────────────────────── API ──────────────────────────────

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiClient.get<Notification[]>("/api/notifications");
  return res.data;
}

export async function getUnreadCount(): Promise<number> {
  const res = await apiClient.get<UnreadCountResponse>(
    "/api/notifications/unread-count",
  );
  return res.data.count;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.put(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put("/api/notifications/read-all");
}
