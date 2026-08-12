import { useCallback, useEffect, useState } from 'react';
import { authService, notificationService } from '@/services';
import { registerForPushNotificationsAsync } from '@/lib/pushRegistration';

// RN port of App.jsx's "Active 10-Minute Session Expiry Watcher" - same 10s
// poll interval, adapted to SecureStore's async isAuthenticated() (the web
// version reads a cookie synchronously; RN has no synchronous equivalent).
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  const check = useCallback(async () => {
    const valid = await authService.isAuthenticated();
    setIsAuthenticated(valid);
    return valid;
  }, []);

  useEffect(() => {
    check().finally(() => setChecking(false));
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [check]);

  // Registers a real push token whenever a session becomes active - covers
  // both a fresh login and an already-authenticated app relaunch, since both
  // flow through this same isAuthenticated transition. registerForPush...
  // resolves null (no-op below) rather than throwing when push isn't
  // available (no dev client, permission denied, etc.) - see pushRegistration.ts.
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    registerForPushNotificationsAsync().then((token) => {
      if (!cancelled && token) {
        notificationService.registerDeviceToken(token).catch(() => {});
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const login = useCallback(() => setIsAuthenticated(true), []);

  const logout = useCallback(async () => {
    const token = await registerForPushNotificationsAsync();
    if (token) {
      await notificationService.unregisterDeviceToken(token).catch(() => {});
    }
    await authService.logout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, checking, refresh: check, login, logout };
}
