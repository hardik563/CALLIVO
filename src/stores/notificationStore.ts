import { create } from 'zustand';
import { AppNotification } from '../types';
import { notificationsApi } from '../lib/api';

interface NotificationState {
  notifications: AppNotification[];
  isDrawerOpen: boolean;
  isLoading: boolean;

  setDrawerOpen: (isOpen: boolean) => void;
  loadNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Omit<AppNotification, 'id' | 'time' | 'isRead'>) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  isDrawerOpen: false,
  isLoading: false,

  setDrawerOpen: (isDrawerOpen) => {
    set({ isDrawerOpen });
    if (isDrawerOpen) {
      get().loadNotifications();
    }
  },

  loadNotifications: async () => {
    try {
      set({ isLoading: true });
      const res = await notificationsApi.list();
      if (res.success && Array.isArray(res.notifications)) {
        const formatted: AppNotification[] = res.notifications.map((n: any) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          time: new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: (n.type as any) || 'system',
          isRead: Boolean(n.isRead),
          actionUrl: n.link || undefined,
        }));
        set({ notifications: formatted, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  markAsRead: async (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n
      ),
    }));
    try {
      await notificationsApi.markAsRead(id);
    } catch {}
  },

  markAllAsRead: async () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
    }));
    try {
      await notificationsApi.markAllAsRead();
    } catch {}
  },

  addNotification: (notif) => {
    const newNotif: AppNotification = {
      ...notif,
      id: 'notif-' + Date.now(),
      time: 'Just now',
      isRead: false,
    };
    set((state) => ({ notifications: [newNotif, ...state.notifications] }));
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),
}));
