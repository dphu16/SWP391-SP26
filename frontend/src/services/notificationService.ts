import apiClient from "./apiClient";

export interface Notification {
  notificationId: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const res = await apiClient.get<Notification[]>("/api/notifications");
  return res.data;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  await apiClient.put(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await apiClient.put("/api/notifications/read-all");
}
