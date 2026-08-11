import { useCallback, useEffect, useState } from 'react';
import { authService } from '@/services';

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

  const login = useCallback(() => setIsAuthenticated(true), []);

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
  }, []);

  return { isAuthenticated, checking, refresh: check, login, logout };
}
