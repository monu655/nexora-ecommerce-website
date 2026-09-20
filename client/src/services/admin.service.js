import { api } from './api';

export const adminService = {
  dashboard: (range = 30) => api.get('/admin/analytics/dashboard', { params: { range } }).then((r) => r.data),
  revenue: (range = 30) => api.get('/admin/analytics/revenue', { params: { range } }).then((r) => r.data),

  products: (params) => api.get('/admin/products', { params }),
  createProduct: (payload) => api.post('/admin/products', payload).then((r) => r.data),
  updateProduct: (id, payload) => api.patch(`/admin/products/${id}`, payload).then((r) => r.data),
  updateStock: (id, payload) => api.patch(`/admin/products/${id}/stock`, payload).then((r) => r.data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`).then((r) => r.data),
  restoreProduct: (id) => api.post(`/admin/products/${id}/restore`).then((r) => r.data),

  orders: (params) => api.get('/admin/orders', { params }),
  order: (id) => api.get(`/admin/orders/${id}`).then((r) => r.data),
  updateOrderStatus: (id, status, note) =>
    api.patch(`/admin/orders/${id}/status`, { status, note }).then((r) => r.data),

  customers: (params) => api.get('/admin/customers', { params }),
  setCustomerStatus: (id, isActive) =>
    api.patch(`/admin/customers/${id}/status`, { isActive }).then((r) => r.data),
};
