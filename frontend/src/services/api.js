import axios from 'axios';
import Cookies from 'js-cookie';

// Axios client with fallback to Gateway
const API_BASE_URL = window.location.origin.includes('localhost:3000') || window.location.origin.includes('localhost:5173')
  ? '' // Proxy handles forwarding to localhost:8080
  : 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Request Interceptor: Attach JWT Token from Browser Cookies
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_token');
    const userId = localStorage.getItem('user_id');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    if (userId) {
      config.headers['X-User-Id'] = userId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Unauthorized Expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      Cookies.remove('jwt_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_name');
    }
    return Promise.reject(error.response ? error.response.data : error);
  }
);

export default api;
