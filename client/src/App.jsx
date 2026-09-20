import { createBrowserRouter, createHashRouter } from 'react-router-dom';

// The public demo is served as a static single page, so it routes on the hash.
// A normal deployment (Vercel rewrite in vercel.json) uses history routing.
const createRouter = import.meta.env.VITE_DEMO === 'true' ? createHashRouter : createBrowserRouter;
import { ShopLayout } from './layouts/ShopLayout';
import { AdminLayout } from './layouts/AdminLayout';
import { RequireAuth, RequireAdmin } from './components/RouteGuards';
import { ErrorBoundaryPage } from './pages/ErrorBoundaryPage';
import { NotFound } from './pages/NotFound';

import Home from './pages/shop/Home';
import Products from './pages/shop/Products';
import ProductDetail from './pages/shop/ProductDetail';
import CartPage from './pages/shop/CartPage';
import Checkout from './pages/shop/Checkout';
import OrderConfirmation from './pages/shop/OrderConfirmation';
import Orders from './pages/shop/Orders';
import OrderDetail from './pages/shop/OrderDetail';
import Wishlist from './pages/shop/Wishlist';
import Profile from './pages/shop/Profile';
import Login from './pages/shop/Login';
import Register from './pages/shop/Register';

import AdminLogin from './pages/admin/AdminLogin';
import Dashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/AdminProducts';
import ProductForm from './pages/admin/ProductForm';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminSettings from './pages/admin/AdminSettings';

export const router = createRouter([
  {
    element: <ShopLayout />,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/products', element: <Products /> },
      { path: '/products/:slug', element: <ProductDetail /> },
      { path: '/cart', element: <CartPage /> },
      { path: '/login', element: <Login /> },
      { path: '/register', element: <Register /> },
      { path: '/wishlist', element: <RequireAuth><Wishlist /></RequireAuth> },
      { path: '/checkout', element: <RequireAuth><Checkout /></RequireAuth> },
      { path: '/orders', element: <RequireAuth><Orders /></RequireAuth> },
      { path: '/orders/:id', element: <RequireAuth><OrderDetail /></RequireAuth> },
      { path: '/order-confirmation/:id', element: <RequireAuth><OrderConfirmation /></RequireAuth> },
      { path: '/profile', element: <RequireAuth><Profile /></RequireAuth> },
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/admin/login', element: <AdminLogin /> },
  {
    path: '/admin',
    element: <RequireAdmin><AdminLayout /></RequireAdmin>,
    errorElement: <ErrorBoundaryPage />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: 'products', element: <AdminProducts /> },
      { path: 'products/new', element: <ProductForm /> },
      { path: 'products/:id/edit', element: <ProductForm /> },
      { path: 'orders', element: <AdminOrders /> },
      { path: 'orders/:id', element: <AdminOrderDetail /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'settings', element: <AdminSettings /> },
    ],
  },
]);
