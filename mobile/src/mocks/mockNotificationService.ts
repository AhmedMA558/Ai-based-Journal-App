// Pass A has no backend for push notifications either - no-ops resolving
// immediately, same signatures as services/notificationService.ts.
export const mockNotificationService = {
  async registerDeviceToken(_expoPushToken: string): Promise<void> {},
  async unregisterDeviceToken(_expoPushToken: string): Promise<void> {},
};
