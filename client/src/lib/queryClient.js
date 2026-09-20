import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // Never retry a request the server has already rejected on its merits.
        const status = error?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  products: (params) => ['products', params],
  product: (slug) => ['product', slug],
  facets: ['facets'],
  reviews: (id) => ['reviews', id],
  cart: ['cart'],
  wishlist: ['wishlist'],
  orders: (params) => ['orders', params],
  order: (id) => ['order', id],
  adminDashboard: (range) => ['admin', 'dashboard', range],
  adminProducts: (params) => ['admin', 'products', params],
  adminOrders: (params) => ['admin', 'orders', params],
  adminOrder: (id) => ['admin', 'order', id],
  adminCustomers: (params) => ['admin', 'customers', params],
};
