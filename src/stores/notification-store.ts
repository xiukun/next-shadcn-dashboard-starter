/**
 * 通知状态管理 Store
 * 使用 Zustand 管理通知列表和未读数量
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Notification } from '@/constants/notifications';
import { mockNotifications } from '@/constants/notifications';

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  markAsRead: (id: string) => void;
  deleteNotification: (id: string) => void;
  clearAll: () => void;
  // Computed
  getUnreadCount: () => number;
}

export const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: mockNotifications,
      unreadCount: mockNotifications.filter((n) => !n.isRead).length,

      setNotifications: (notifications) => {
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      markAsRead: (id) => {
        const notifications = get().notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        );
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      deleteNotification: (id) => {
        const notifications = get().notifications.filter((n) => n.id !== id);
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        set({ notifications, unreadCount });
      },

      clearAll: () => {
        set({ notifications: [], unreadCount: 0 });
      },

      getUnreadCount: () => {
        return get().notifications.filter((n) => !n.isRead).length;
      }
    }),
    {
      name: 'notification-storage',
      skipHydration: true // 避免 SSR 不匹配
    }
  )
);
