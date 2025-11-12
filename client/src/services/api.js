// client/src/services/api.js
import axios from 'axios';

const API_ROOT = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Normalize base: if user set VITE_API_URL to include /api already, keep it.
// If not, append /api so you can keep using endpoints like '/auth/login'
const API_BASE_URL = API_ROOT.endsWith('/api') ? API_ROOT : `${API_ROOT.replace(/\/$/, '')}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // If your backend uses cookies (httpOnly refresh token), set this to true:
  // withCredentials: true,
  timeout: 15000,
});

// attach access token from localStorage (if present)
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // ignore localStorage read errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// SINGLE refresh promise to prevent concurrent refresh calls
let refreshPromise = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Safety: if no originalRequest or no response, just reject
    if (!originalRequest || !error.response) return Promise.reject(error);

    const status = error.response.status;

    // only attempt refresh on 401 and if we haven't retried this request already
    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // if a refresh is already underway, wait for it
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            // prefer using the same api instance but avoid infinite loop by using axios directly
            const refreshToken = localStorage.getItem('refreshToken');
            if (!refreshToken) throw new Error('No refresh token available');

            const resp = await axios.post(
              `${API_BASE_URL}/auth/refresh-token`,
              { refreshToken },
              { headers: { 'Content-Type': 'application/json' } }
            );

            // adapt this access if your backend returns different shape
            const newAccess = resp?.data?.data?.accessToken || resp?.data?.accessToken || resp?.data?.token;
            const newRefresh = resp?.data?.data?.refreshToken || resp?.data?.refreshToken || null;

            if (!newAccess) throw new Error('No access token in refresh response');

            localStorage.setItem('accessToken', newAccess);
            if (newRefresh) localStorage.setItem('refreshToken', newRefresh);

            return newAccess;
          } catch (err) {
            // cleanup on failure
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            throw err;
          } finally {
            // will be cleared by caller
          }
        })();
      }

      try {
        const newToken = await refreshPromise;
        refreshPromise = null;

        // attach new token and retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (refreshErr) {
        refreshPromise = null;
        // redirect to login on refresh failure
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken }),
  updateProfile: (data) => api.put('/auth/me', data), 
};

// Plans API
export const plansAPI = {
  getAll: () => api.get('/plans'),
  getOne: (id) => api.get(`/plans/${id}`),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  delete: (id) => api.delete(`/plans/${id}`),
};

// Subscriptions API
export const subscriptionsAPI = {
  subscribe: (planId) => api.post(`/subscribe/${planId}`),
  getMy: () => api.get('/my-subscription'),
  cancel: () => api.put('/subscription/cancel'),
  upgrade: (newPlanId) => api.put('/subscription/upgrade', { newPlanId }),
  getAll: (params) => api.get('/admin/subscriptions', { params }),
};

export default api;
