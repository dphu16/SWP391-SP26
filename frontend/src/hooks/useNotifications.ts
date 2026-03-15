import { useState, useEffect, useCallback, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { getToken } from "../services/authService";
import { decodeJwt } from "../utils/jwtDecode";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  type Notification,
} from "../services/notificationService";

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  markOneRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  refresh: () => Promise<void>;
  isConnected: boolean;
}

/**
 * Build the WebSocket URL for STOMP.
 * Uses native WebSocket (ws:// or wss://) instead of SockJS
 * to avoid the "global is not defined" error in Vite.
 */
function buildWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/ws`;
}

/**
 * Central hook for the notification system.
 * - Fetches notifications from the REST API on mount.
 * - Connects to WebSocket via STOMP (native WebSocket) for real-time updates.
 * - Subscribes to user-specific notification topic.
 * - Provides methods to mark notifications as read.
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // ── Fetch all notifications from REST API ──
  const refresh = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // silently ignore fetch errors
    }
  }, []);

  // ── Connect to WebSocket ──
  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const payload = decodeJwt(token);
    if (!payload?.sub) return;

    const client = new Client({
      brokerURL: buildWsUrl(),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,

      onConnect: () => {
        setIsConnected(true);

        // Subscribe to user-specific notifications
        client.subscribe(
          "/user/queue/notifications",
          (message) => {
            try {
              const notif: Notification = JSON.parse(message.body);
              setNotifications((prev) => [notif, ...prev]);
            } catch {
              // ignore parse errors
            }
          },
        );
      },

      onDisconnect: () => {
        setIsConnected(false);
      },

      onStompError: (frame) => {
        console.error("STOMP error:", frame.headers.message);
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setIsConnected(false);
    };
  }, []);

  // ── Initial fetch ──
  useEffect(() => {
    refresh();
  }, [refresh]);

  // ── Mark one as read ──
  const markOneRead = useCallback(async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationId === id ? { ...n, isRead: true } : n,
        ),
      );
    } catch {
      // ignore
    }
  }, []);

  // ── Mark all as read ──
  const markAllRead = useCallback(async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  }, []);

  return {
    notifications,
    unreadCount,
    markOneRead,
    markAllRead,
    refresh,
    isConnected,
  };
}
