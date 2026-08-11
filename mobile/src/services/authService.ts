import axios from 'axios';
import api from './api';
import { session } from './session';
import { API_BASE_URL } from '@/config/env';
import type { AuthResult, CurrentUser } from '@/types';

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

  async logout(): Promise<void> {
    const refreshToken = await session.getRefreshToken();
    if (refreshToken) {
      refreshClient.post('/api/v1/auth/logout', { refreshToken }).catch(() => {});
    }
    await session.clear();
  },

  isAuthenticated: () => session.isAuthenticated(),
  touchSession: () => session.touchSession(),
};
