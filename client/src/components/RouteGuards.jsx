import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/** Signed-in customers only; remembers where they were headed. */
export function RequireAuth({ children }) {
  const { accessToken } = useAuthStore();
  const location = useLocation();
  if (!accessToken) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  return children;
}

/** Admin console. Authorisation is enforced server-side too — this is UX. */
export function RequireAdmin({ children }) {
  const { accessToken, user } = useAuthStore();
  if (!accessToken) return <Navigate to="/admin/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}
