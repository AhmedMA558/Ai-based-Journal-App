import api from './api';
import Cookies from 'js-cookie';

export const authService = {
  // Login user and store token in browser cookies with 1-Hour expiration
  login: async (usernameOrEmail, password) => {
    const res = await api.post('/api/v1/auth/login', { usernameOrEmail, password });
    if (res && res.data && res.data.accessToken) {
      const token = res.data.accessToken;
      // 1 Hour = 1/24 days in js-cookie
      Cookies.set('jwt_token', token, { expires: 1 / 24, sameSite: 'Lax' });
      
      if (res.data.userId) {
        localStorage.setItem('user_id', res.data.userId);
      }
      if (res.data.username) {
        localStorage.setItem('user_name', res.data.username);
      }
    }
    return res;
  },

  // Register user and store token in browser cookies
  register: async (username, email, password, fullName) => {
    const res = await api.post('/api/v1/auth/register', { username, email, password, fullName });
    if (res && res.data && res.data.accessToken) {
      const token = res.data.accessToken;
      // 1 Hour expiration
      Cookies.set('jwt_token', token, { expires: 1 / 24, sameSite: 'Lax' });
      
      if (res.data.userId) {
        localStorage.setItem('user_id', res.data.userId);
      }
      if (res.data.username) {
        localStorage.setItem('user_name', res.data.username);
      }
    }
    return res;
  },

  // Logout user and remove cookies
  logout: () => {
    Cookies.remove('jwt_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
  },

  // Get active JWT Token from Browser Cookie
  getToken: () => Cookies.get('jwt_token'),

  // Check if user is authenticated
  isAuthenticated: () => !!Cookies.get('jwt_token'),
};
