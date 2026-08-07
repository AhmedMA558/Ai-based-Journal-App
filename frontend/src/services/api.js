import axios from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token from Browser Cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    const userId = localStorage.getItem('user_id');
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized / Expired Token
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized request or token expired. Clearing session cookies.');
      Cookies.remove('jwt_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
