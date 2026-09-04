import axios from 'axios';

export const backendUrl =
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
export const apiUrl =
  import.meta.env.VITE_API_URL || `${backendUrl}/api`;

const api = axios.create({
  baseURL: apiUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      const isAuthRoute =
        currentPath === '/login' ||
        currentPath === '/register' ||
        currentPath === '/forgot-password';
      if (!isAuthRoute) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
