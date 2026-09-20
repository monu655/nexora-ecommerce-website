import { api } from './api';

export const authService = {
  register: (payload) => api.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => api.post('/auth/login', payload).then((r) => r.data),
  adminLogin: (payload) => api.post('/auth/admin/login', payload).then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data.user),
  updateProfile: (payload) => api.patch('/users/profile', payload).then((r) => r.data.user),
  changePassword: (payload) => api.post('/users/change-password', payload),
  addAddress: (payload) => api.post('/users/addresses', payload).then((r) => r.data),
  updateAddress: (id, payload) => api.patch(`/users/addresses/${id}`, payload).then((r) => r.data),
  deleteAddress: (id) => api.delete(`/users/addresses/${id}`).then((r) => r.data),
};
