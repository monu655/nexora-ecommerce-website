import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Settings, LogOut, Store, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUiStore } from '@/store/cartStore';
import { cn } from '@/lib/cn';

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminSidebar() {
  const { user, signOut } = useAuthStore();
  const { adminSidebarOpen, setAdminSidebar } = useUiStore();
  const navigate = useNavigate();

  return (
    <>
      {adminSidebarOpen && (
        <div className="fixed inset-0 z-40 bg-ink/40 lg:hidden" onClick={() => setAdminSidebar(false)} />
      )}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-[248px] flex-col border-r border-line bg-white transition-transform lg:translate-x-0',
        adminSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex h-16 items-center gap-2 border-b border-line px-5">
          <span className="font-display text-[19px] font-bold tracking-[-0.04em]">NEXORA</span>
          <span className="rounded-md bg-surface-sunken px-1.5 py-0.5 text-[11px] font-semibold text-ink-soft">Admin</span>
          <button className="ml-auto lg:hidden" onClick={() => setAdminSidebar(false)} aria-label="Close menu">
            <X className="h-5 w-5 text-ink-muted" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} onClick={() => setAdminSidebar(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] font-medium transition-colors',
                isActive ? 'bg-ink text-white' : 'text-ink-soft hover:bg-surface-sunken hover:text-ink'
              )}>
              <Icon className="h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-line p-3">
          <NavLink to="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[14px] text-ink-soft hover:bg-surface-sunken">
            <Store className="h-[18px] w-[18px]" /> View storefront
          </NavLink>
          <div className="mt-2 flex items-center gap-3 rounded-lg bg-surface-sunken p-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold text-white"
              style={{ background: user?.avatarColor || '#1B39C9' }}>{user?.initials}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-semibold">{user?.name}</p>
              <p className="truncate text-[12px] text-ink-muted">Store manager</p>
            </div>
            <button onClick={() => { signOut(); navigate('/admin/login'); }} aria-label="Sign out"
              className="rounded-md p-1.5 text-ink-muted hover:bg-white hover:text-ink">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
