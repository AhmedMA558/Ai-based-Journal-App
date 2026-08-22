import type { NotificationItem } from '@/types';

// Pass A has no backend for push notifications either - no-ops resolving
// immediately, same signatures as services/notificationService.ts.
let mockNotifications: NotificationItem[] = [
  { id: 1, type: 'ACCOUNT_SECURITY', message: 'Your password was changed.', read: false, createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
  { id: 2, type: 'ACCOUNT_SECURITY', message: 'Two-factor authentication was enabled.', read: false, createdAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString() },
];

export const mockNotificationService = {
  async registerDeviceToken(_expoPushToken: string): Promise<void> {},
  async unregisterDeviceToken(_expoPushToken: string): Promise<void> {},

  async list(): Promise<NotificationItem[]> {
    return mockNotifications;
  },

  async markAllRead(): Promise<void> {
    mockNotifications = mockNotifications.map((n) => ({ ...n, read: true }));
  },
};
