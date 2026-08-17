import axios from 'axios';
import api from './api';
import { session } from './session';
import { clearOfflineQueue } from '@/lib/offlineQueue';
import { clearOfflineCache } from '@/lib/offlineCache';
import { API_BASE_URL } from '@/config/env';
import type { AuthResult, CurrentUser, MfaSetupData, MfaEnableResult, LoginHistoryPage } from '@/types';

// Dedicated instance for the refresh call - bypasses api.ts's interceptors so a
// refresh failure can't recursively trigger another refresh attempt, matching
// frontend/src/services/authService.js's refreshClient.
const refreshClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

async function persistIfIssued(data: AuthResult, fallbackUsername?: string) {
  if (data?.accessToken) {
    await session.setSession(data.accessToken, data.refreshToken, data.userId, data.username || fallbackUsername);
  }
}

export const authService = {
  async login(usernameOrEmail: string, password: string): Promise<AuthResult> {
    const res = await api.post('/api/v1/auth/login', { usernameOrEmail, password });
    const data: AuthResult = res?.data?.data || {};
    await persistIfIssued(data, usernameOrEmail);
    return data;
  },

  async register(username: string, email: string, password: string, fullName: string): Promise<AuthResult> {
    const res = await api.post('/api/v1/auth/register', { username, email, password, fullName });
    const data: AuthResult = res?.data?.data || {};
    await persistIfIssued(data, username);
    return data;
  },

  async verifyMfa(challengeToken: string, code?: string, recoveryCode?: string): Promise<AuthResult> {
    const res = await api.post('/api/v1/auth/mfa/verify', { challengeToken, code, recoveryCode });
    const data: AuthResult = res?.data?.data || {};
    await persistIfIssued(data);
    return data;
  },

  async refreshAccessToken(): Promise<string> {
    const refreshToken = await session.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const res = await refreshClient.post('/api/v1/auth/refresh', { refreshToken });
    const data: AuthResult = res?.data?.data || {};
    if (!data.accessToken) {
      throw new Error('Refresh response missing an access token');
    }
    await session.setSession(data.accessToken, data.refreshToken, data.userId, data.username);
    return data.accessToken;
  },

  async getCurrentUser(): Promise<CurrentUser> {
    const res = await api.get('/api/v1/auth/me');
    return res?.data?.data;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.put('/api/v1/auth/password', { currentPassword, newPassword });
  },

  async getMfaStatus(): Promise<{ mfaEnabled: boolean }> {
    const res = await api.get('/api/v1/auth/mfa/status');
    return res?.data?.data || { mfaEnabled: false };
  },

  async getLoginHistory(page = 0, size = 10): Promise<LoginHistoryPage> {
    const res = await api.get(`/api/v1/auth/login-history?page=${page}&size=${size}`);
    return res?.data?.data || { content: [] };
  },

  // Generates (and persists, but does not yet enable) a new TOTP secret -
  // returns {secret, otpAuthUri} for QR code rendering.
  async setupMfa(): Promise<MfaSetupData> {
    const res = await api.post('/api/v1/auth/mfa/setup');
    return res?.data?.data;
  },

  // Confirms enrollment with a 6-digit code - returns {mfaEnabled, recoveryCodes}.
  // recoveryCodes are plaintext and shown exactly once.
  async enableMfa(code: string): Promise<MfaEnableResult> {
    const res = await api.post('/api/v1/auth/mfa/enable', { code });
    return res?.data?.data;
  },

  async disableMfa(password: string, code: string): Promise<void> {
    await api.post('/api/v1/auth/mfa/disable', { password, code });
  },

  // Always resolves with the same generic message regardless of whether the
  // email is registered - the backend deliberately never reveals that.
  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/v1/auth/password/forgot', { email });
  },

  async resetPassword(resetCode: string, newPassword: string): Promise<void> {
    await api.post('/api/v1/auth/password/reset', { resetCode, newPassword });
  },

  // Authenticated (not public like password reset) - the caller is always
  // logged in by the time they'd submit a code, since register() issues
  // tokens unconditionally (non-blocking email verification).
  async verifyEmail(code: string): Promise<void> {
    await api.post('/api/v1/auth/verify-email', { code });
  },

  async resendVerificationEmail(): Promise<void> {
    await api.post('/api/v1/auth/verify-email/resend');
  },

  async logout(): Promise<void> {
    const refreshToken = await session.getRefreshToken();
    if (refreshToken) {
      refreshClient.post('/api/v1/auth/logout', { refreshToken }).catch(() => {});
    }
    await session.clear();
    // Any still-unsynced offline journal edit belongs to the account that's
    // logging out - leaving it queued would replay it against whichever
    // account logs into this device next.
    await clearOfflineQueue();
    await clearOfflineCache();
  },

  isAuthenticated: () => session.isAuthenticated(),
  touchSession: () => session.touchSession(),
};
