import { api } from './api';

export const cartService = {
  get: () => api.get('/cart').then((r) => r.data),
  add: (productId, quantity = 1) => api.post('/cart/items', { productId, quantity }).then((r) => r.data),
  update: (productId, quantity) => api.patch(`/cart/items/${productId}`, { quantity }).then((r) => r.data),
  remove: (productId) => api.delete(`/cart/items/${productId}`).then((r) => r.data),
  clear: () => api.delete('/cart').then((r) => r.data),
  merge: (items) => api.post('/cart/merge', { items }).then((r) => r.data),
};

export const wishlistService = {
  get: () => api.get('/wishlist').then((r) => r.data),
  toggle: (productId) => api.post('/wishlist/toggle', { productId }).then((r) => r.data),
  remove: (productId) => api.delete(`/wishlist/${productId}`).then((r) => r.data),
};

export const orderService = {
  checkout: (payload) => api.post('/orders/checkout', payload).then((r) => r.data),
  list: (params) => api.get('/orders', { params }),
  detail: (id) => api.get(`/orders/${id}`).then((r) => r.data),
  cancel: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};
