import { api } from './api';

export const productService = {
  list: (params) => api.get('/products', { params }),
  facets: () => api.get('/products/facets').then((r) => r.data),
  detail: (idOrSlug) => api.get(`/products/${idOrSlug}`).then((r) => r.data),
  reviews: (productId) => api.get(`/products/${productId}/reviews`).then((r) => r.data),
  addReview: (productId, payload) => api.post(`/products/${productId}/reviews`, payload).then((r) => r.data),
};
