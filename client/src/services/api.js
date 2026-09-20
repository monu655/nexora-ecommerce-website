import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({ baseURL, timeout: 20000, withCredentials: false });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * Normalises every failure into { status, message, details } so components
 * can render a sentence a customer understands — never a stack trace.
 */
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const payload = error.response?.data;

    let message = payload?.message;
    if (!message) {
      if (error.code === 'ECONNABORTED') message = 'That took too long. Check your connection and try again.';
      else if (!error.response) message = 'We could not reach NEXORA. Check your connection and try again.';
      else if (status >= 500) message = 'Something went wrong on our side. Please try again in a moment.';
      else message = 'That request could not be completed.';
    }

    if (status === 401 && useAuthStore.getState().accessToken) {
      useAuthStore.getState().signOut();
      toast.info('Your session expired. Please sign in again.');
    }

    return Promise.reject({ status, message, details: payload?.details });
  }
);

export const unwrap = (res) => res?.data;
