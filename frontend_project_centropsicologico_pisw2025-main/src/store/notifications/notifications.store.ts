import { create } from "zustand";
import { createElement } from "react";
import { Bell } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import api from "@/api/api";
import { connectSocket, disconnectSocket } from "@/lib/socketClient";

const notificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: z.string(),
  isRead: z.boolean(),
  createdAt: z.string().datetime({ offset: true }),
});
const responseSchema = z.object({ data: z.array(notificationSchema) });
export type Notification = z.infer<typeof notificationSchema>;

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  initSession: (token: string, userId: string) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearSession: () => void;
}

let activeUserId: string | null = null;
let sessionVersion = 0;
let requests: AbortController | null = null;
let fetching: Promise<void> | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const pendingReads = new Set<string>();
let markingAll = false;

function unread(notifications: Notification[]) {
  return notifications.filter((notification) => !notification.isRead).length;
}

// Controls connection lifetime. The API and Socket.IO validate credentials.
function tokenExpiry(token: string): number | undefined {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded: unknown = JSON.parse(atob(payload));
    const parsed = z.object({ exp: z.number().finite() }).safeParse(decoded);
    return parsed.success ? parsed.data.exp * 1000 : undefined;
  } catch {
    return undefined;
  }
}

export const useNotifications = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isInitialized: false,
  error: null,

  fetchNotifications: () => {
    if (!activeUserId || !requests) return Promise.resolve();
    if (fetching) return fetching;
    const version = sessionVersion;
    const signal = requests.signal;
    set({ isLoading: true, error: null });
    fetching = (async () => {
      try {
        const response = await api.get("/api/v1/notifications", { params: { take: 20 }, signal });
        const incoming = responseSchema.parse(response.data).data;
        if (version !== sessionVersion) return;
        // Preserve a live arrival or a confirmed read that happened while loading.
        const merged = new Map(incoming.map((notification) => [notification.id, notification]));
        for (const current of get().notifications) {
          const saved = merged.get(current.id);
          merged.set(current.id, saved ? { ...saved, isRead: saved.isRead || current.isRead } : current);
        }
        const notifications = [...merged.values()].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
        set({ notifications, unreadCount: unread(notifications) });
      } catch {
        if (version === sessionVersion && !signal.aborted) {
          set({ error: "No se pudieron cargar las notificaciones." });
        }
      } finally {
        if (version === sessionVersion) {
          fetching = null;
          set({ isLoading: false });
        }
      }
    })();
    return fetching;
  },

  initSession: (token, userId) => {
    const expiresAt = tokenExpiry(token);
    if (expiresAt !== undefined && expiresAt <= Date.now()) {
      get().clearSession();
      return Promise.resolve();
    }
    if (expiryTimer) clearTimeout(expiryTimer);
    if (expiresAt !== undefined) {
      expiryTimer = setTimeout(() => get().clearSession(), Math.min(expiresAt - Date.now(), 2_147_483_647));
    }
    if (activeUserId === userId && get().isInitialized) {
      connectSocket(token);
      return fetching ?? Promise.resolve();
    }
    // Clear a previous account before establishing another person's session.
    if (activeUserId !== null) {
      get().clearSession();
      return get().initSession(token, userId);
    }
    activeUserId = userId;
    requests = new AbortController();
    const version = sessionVersion;
    const socket = connectSocket(token);
    let connectedOnce = false;
    socket.on("connect", () => {
      if (version !== sessionVersion) return;
      if (connectedOnce) void get().fetchNotifications();
      connectedOnce = true;
    });
    socket.on("new_notification", (payload: unknown) => {
      if (version !== sessionVersion) return;
      const result = notificationSchema.safeParse(payload);
      if (!result.success) return;
      const notification = result.data;
      if (get().notifications.some((item) => item.id === notification.id)) return;
      const notifications = [notification, ...get().notifications];
      set({ notifications, unreadCount: unread(notifications) });
      toast("Nueva notificación", {
        description: notification.title,
        icon: createElement(Bell, { className: "text-senses-primary" }),
      });
    });
    set({ isInitialized: true });
    return get().fetchNotifications();
  },

  markAsRead: async (id) => {
    if (!activeUserId || !requests || pendingReads.has(id)) return;
    if (!get().notifications.some((item) => item.id === id && !item.isRead)) return;
    const version = sessionVersion;
    const signal = requests.signal;
    pendingReads.add(id);
    try {
      await api.patch(`/api/v1/notifications/${encodeURIComponent(id)}/read`, {}, { signal });
      if (version !== sessionVersion) return;
      const notifications = get().notifications.map((item) => item.id === id ? { ...item, isRead: true } : item);
      set({ notifications, unreadCount: unread(notifications) });
    } catch {
      if (version === sessionVersion && !signal.aborted) toast.error("No se pudo marcar la notificación como leída.");
    } finally {
      if (version === sessionVersion) pendingReads.delete(id);
    }
  },

  markAllAsRead: async () => {
    if (!activeUserId || !requests || markingAll) return;
    const version = sessionVersion;
    const signal = requests.signal;
    const ids = new Set(get().notifications.map((item) => item.id));
    markingAll = true;
    try {
      await api.patch("/api/v1/notifications/read-all", {}, { signal });
      if (version !== sessionVersion) return;
      const notifications = get().notifications.map((item) => ids.has(item.id) ? { ...item, isRead: true } : item);
      set({ notifications, unreadCount: unread(notifications) });
      toast.success("Todas marcadas como leídas");
    } catch {
      if (version === sessionVersion && !signal.aborted) toast.error("No se pudieron marcar las notificaciones como leídas.");
    } finally {
      if (version === sessionVersion) markingAll = false;
    }
  },

  clearSession: () => {
    sessionVersion++;
    activeUserId = null;
    requests?.abort();
    requests = null;
    fetching = null;
    pendingReads.clear();
    markingAll = false;
    if (expiryTimer) clearTimeout(expiryTimer);
    expiryTimer = undefined;
    disconnectSocket();
    set({ notifications: [], unreadCount: 0, isLoading: false, isInitialized: false, error: null });
  },
}));
