import { Platform } from 'react-native';
import api from './api';
import type { NotificationItem } from '@/types';

export const notificationService = {
  async registerDeviceToken(expoPushToken: string): Promise<void> {
    await api.post('/api/v1/notifications/device-token', {
      expoPushToken,
      platform: Platform.OS,
    });
  },

  async unregisterDeviceToken(expoPushToken: string): Promise<void> {
    await api.delete('/api/v1/notifications/device-token', { params: { expoPushToken } });
  },

  // Real in-app notification log, matching web's NotificationsDrawer.tsx -
  // this used to be a fully hardcoded 3-item list on mobile only (a real
  // "looks done but isn't" gap: web's own drawer was fixed to fetch this
  // same backend endpoint a phase ago, mobile was simply never updated).
  async list(page = 0, size = 20): Promise<NotificationItem[]> {
    const res = await api.get(`/api/v1/notifications?page=${page}&size=${size}`);
    const content = res?.data?.data?.content;
    return Array.isArray(content) ? content : [];
  },

  async markAllRead(): Promise<void> {
    await api.put('/api/v1/notifications/read-all');
  },
};
