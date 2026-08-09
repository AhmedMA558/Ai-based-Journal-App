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

// Request Interceptor: Attach JWT Token from Cookie or localStorage
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('jwt_token') || localStorage.getItem('jwt_token');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Format Error Messages cleanly without clearing session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const serverMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          (typeof error.response?.data === 'string' ? error.response.data : null) || 
                          error.message || 
                          'Network error connecting to Gateway.';

    return Promise.reject(new Error(serverMessage));
  }
);

export default api;
