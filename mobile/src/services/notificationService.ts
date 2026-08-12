import { Platform } from 'react-native';
import api from './api';

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
};
