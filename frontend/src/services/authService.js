import api from './api';
import Cookies from 'js-cookie';

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 Minutes in milliseconds
const COOKIE_EXPIRES_DAYS = 10 / (24 * 60); // 10 Minutes in days (10/1440)

export const authService = {
  // Login user and set 10-minute session expiry
  login: async (usernameOrEmail, password) => {
    const res = await api.post('/api/v1/auth/login', { usernameOrEmail, password });
    const authData = res?.data?.data;
    if (authData?.accessToken) {
      authService.setSession(authData.accessToken, authData.userId, authData.username || usernameOrEmail);
    }
    return res;
  },

  // Register user with 10-minute session
  register: async (username, email, password, fullName) => {
    const res = await api.post('/api/v1/auth/register', { username, email, password, fullName });
    const authData = res?.data?.data;
    if (authData?.accessToken) {
      authService.setSession(authData.accessToken, authData.userId, authData.username || username);
    }
    return res;
  },

  // Complete a login that returned an MFA challenge - send either a 6-digit
  // TOTP code or a recovery code, not both.
  verifyMfa: async (challengeToken, code, recoveryCode) => {
    const res = await api.post('/api/v1/auth/mfa/verify', { challengeToken, code, recoveryCode });
    const authData = res?.data?.data;
    if (authData?.accessToken) {
      authService.setSession(authData.accessToken, authData.userId, authData.username);
    }
    return res;
  },

  // Get the authenticated user's real identity (username/email/fullName) -
  // the source of truth, since user-service's profile has no email field.
  getCurrentUser: async () => (await api.get('/api/v1/auth/me'))?.data?.data,

  changePassword: async (currentPassword, newPassword) =>
    (await api.put('/api/v1/auth/password', { currentPassword, newPassword }))?.data?.data,

  getMfaStatus: async () => (await api.get('/api/v1/auth/mfa/status'))?.data?.data,

  // Generates (and persists, but does not yet enable) a new TOTP secret -
  // returns {secret, otpAuthUri} for QR code rendering.
  setupMfa: async () => (await api.post('/api/v1/auth/mfa/setup'))?.data?.data,

  // Confirms enrollment with a 6-digit code - returns {mfaEnabled, recoveryCodes}.
  // recoveryCodes are plaintext and shown exactly once.
  enableMfa: async (code) => (await api.post('/api/v1/auth/mfa/enable', { code }))?.data?.data,

  disableMfa: async (password, code) =>
    (await api.post('/api/v1/auth/mfa/disable', { password, code }))?.data?.data,

  // Set active session tokens with strict 10-minute expiration
  setSession: (token, userId, username) => {
    const expiryTime = Date.now() + SESSION_DURATION_MS;
    Cookies.set('jwt_token', token, { expires: COOKIE_EXPIRES_DAYS, sameSite: 'Lax' });
    localStorage.setItem('jwt_token', token);
    localStorage.setItem('user_id', String(userId || '1'));
    localStorage.setItem('user_name', username || 'Journaler');
    localStorage.setItem('session_expiry', String(expiryTime));
  },

  // Refresh 10-minute activity timer on user interaction
  touchSession: () => {
    const expiry = localStorage.getItem('session_expiry');
    if (expiry && Date.now() < parseInt(expiry)) {
      const newExpiry = Date.now() + SESSION_DURATION_MS;
      localStorage.setItem('session_expiry', String(newExpiry));
      const token = localStorage.getItem('jwt_token');
      if (token) {
        Cookies.set('jwt_token', token, { expires: COOKIE_EXPIRES_DAYS, sameSite: 'Lax' });
      }
    }
  },

  // Logout user and clear tokens
  logout: () => {
    Cookies.remove('jwt_token');
    localStorage.removeItem('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('session_expiry');
  },

  // Get active JWT Token if not expired
  getToken: () => {
    if (!authService.isAuthenticated()) return null;
    return Cookies.get('jwt_token') || localStorage.getItem('jwt_token');
  },

  // Check if session is valid (must be within 10 minutes)
  isAuthenticated: () => {
    const token = Cookies.get('jwt_token') || localStorage.getItem('jwt_token');
    const expiry = localStorage.getItem('session_expiry');

    if (!token || !expiry) {
      return false;
    }

    // Check if 10 minutes have elapsed
    if (Date.now() > parseInt(expiry)) {
      authService.logout();
      return false;
    }

    return true;
  },
};
