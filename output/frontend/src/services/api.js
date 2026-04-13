import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => Promise.reject(error));

api.interceptors.response.use((response) => response, (error) => {
  if (error.response.status === 401 || error.response.status === 403) {
    localStorage.removeItem('token');
    const navigate = useNavigate();
    navigate('/login');
  }
  return Promise.reject(error);
});

export async function getServices() {
  const response = await api.get('/services');
  return response.data;
}

export async function getStaff(branchId) {
  const response = await api.get(`/staff?branch=${branchId}`);
  return response.data;
}

export async function getAvailability(staffId, date, serviceId) {
  const response = await api.get(`/availability?staff=${staffId}&date=${date}&service=${serviceId}`);
  return response.data;
}

export async function createAppointment(data) {
  const response = await api.post('/appointments', data);
  return response.data;
}

export async function validateOffer(code, amount) {
  const response = await api.get(`/offers?code=${code}&amount=${amount}`);
  return response.data;
}

export async function getAnalytics(from, to) {
  const response = await api.get(`/analytics?from=${from}&to=${to}`);
  return response.data;
}