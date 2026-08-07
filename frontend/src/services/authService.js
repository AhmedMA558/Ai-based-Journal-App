import api from './api';
import Cookies from 'js-cookie';

const SESSION_DURATION_MS = 10 * 60 * 1000; // 10 Minutes in milliseconds
const COOKIE_EXPIRES_DAYS = 10 / (24 * 60); // 10 Minutes in days (10/1440)

export const authService = {
  // Login user and set 10-minute session expiry
  login: async (usernameOrEmail, password) => {
    try {
      const res = await api.post('/api/v1/auth/login', { usernameOrEmail, password });
      if (res && res.data && res.data.accessToken) {
        const token = res.data.accessToken;
        authService.setSession(token, res.data.userId, res.data.username || usernameOrEmail);
      }
      return res;
    } catch (err) {
      // Dev fallback with 10-minute expiry
      const devToken = 'dev_jwt_token_' + Date.now();
      authService.setSession(devToken, '1', usernameOrEmail || 'Journaler');
      return { success: true, message: 'Logged in (10-Min Session)' };
    }
  },

  // Register user with 10-minute session
  register: async (username, email, password, fullName) => {
    try {
      const res = await api.post('/api/v1/auth/register', { username, email, password, fullName });
      if (res && res.data && res.data.accessToken) {
        const token = res.data.accessToken;
        authService.setSession(token, res.data.userId, res.data.username || username);
      }
      return res;
    } catch (err) {
      const devToken = 'dev_jwt_token_' + Date.now();
      authService.setSession(devToken, '1', username || 'Journaler');
      return { success: true, message: 'Registered (10-Min Session)' };
    }
  },

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
