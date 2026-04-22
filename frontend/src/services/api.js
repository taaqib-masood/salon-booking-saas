import axios from 'axios';

const api = axios.create({ baseURL: '/api/v1' });

// Inject token from localStorage on every request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, error => Promise.reject(error));

// Auto-logout on 401 — but never redirect if already on /login or /register
api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401) {
    const onAuthPage = ['/login', '/register'].includes(window.location.pathname);
    if (!onAuthPage) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default api;
