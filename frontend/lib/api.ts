import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

if (!rawBaseUrl && process.env.NODE_ENV === 'production') {
  throw new Error('NEXT_PUBLIC_API_URL is missing. Set it to your deployed backend URL before building the frontend.');
}

const baseURL = (rawBaseUrl || 'http://localhost:5000').replace(/\/$/, '');

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    throw error;
  }
);

// Response interceptor
let isRefreshing = false;
type QueueEntry = {
  resolve: (token: string | null) => void;
  reject: (error: unknown) => void;
};

let failedQueue: QueueEntry[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            throw err;
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuthStore.getState().refreshToken;

      if (!refreshToken) {
        useAuthStore.getState().logout();
        isRefreshing = false;
        throw error;
      }

      try {
        const res = await axios.post(`${api.defaults.baseURL}/api/auth/refresh`, {
          refreshToken,
        });

        const { token, refreshToken: newRefreshToken, user } = res.data;
        
        useAuthStore.getState().setAuth(user, token, newRefreshToken);
        
        processQueue(null, token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        useAuthStore.getState().logout();
        throw refreshError;
      } finally {
        isRefreshing = false;
      }
    }

    throw error;
  }
);

export default api;
