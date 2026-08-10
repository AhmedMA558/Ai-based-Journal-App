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

// Request Interceptor: Attach JWT Token from Cookie or localStorage, if present
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

// Response Interceptor: on a 401, the access token has expired or was rejected
// (the gateway rejects with an empty body, so error.response.data is empty and
// the message would otherwise fall through to axios's generic "Request failed
// with status code 401") - try a silent refresh-and-retry once before giving up,
// since a refresh token is issued at login specifically for this. Auth endpoints
// themselves are excluded so a failed login/refresh doesn't recurse into itself.
const AUTH_ENDPOINTS_NO_REFRESH = ['/api/v1/auth/login', '/api/v1/auth/register', '/api/v1/auth/refresh'];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url && AUTH_ENDPOINTS_NO_REFRESH.some((p) => originalRequest.url.includes(p));

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest?._retry) {
      originalRequest._retry = true;
      try {
        // Lazy import avoids a circular-import evaluation-order issue at module load time.
        const { authService } = await import('./authService');
        const newToken = await authService.refreshAccessToken();
        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch {
        const { authService } = await import('./authService');
        authService.logout();
        return Promise.reject(new Error('Your session has expired. Please log in again.'));
      }
    }

    const serverMessage = error.response?.data?.message ||
                          error.response?.data?.error ||
                          (typeof error.response?.data === 'string' ? error.response.data : null) ||
                          error.message ||
                          'Network error connecting to Gateway.';

    return Promise.reject(new Error(serverMessage));
  }
);

export default api;
