import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, LogOut, Package, LayoutDashboard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useCart } from '@/hooks/useCart';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

const links = [
  { to: '/products', label: 'All products' },
  { to: '/products?category=Audio', label: 'Audio' },
  { to: '/products?category=Wearables', label: 'Wearables' },
  { to: '/products?category=Keyboards', label: 'Keyboards' },
  { to: '/products?category=Gaming', label: 'Gaming' },
];

export function Navbar() {
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const { count } = useCart();

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(`/products?search=${encodeURIComponent(query.trim())}`);
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur-md">
      <div className="hidden border-b border-line bg-ink py-2 text-center text-[12.5px] text-white/80 sm:block">
        Free delivery on orders over ₹4,999 · 2-year warranty on every Nexora device
      </div>

      <div className="container-page flex h-16 items-center gap-4">
        <button className="-ml-2 rounded-lg p-2 lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menu">
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Link to="/" className="font-display text-[21px] font-bold tracking-[-0.04em]">NEXORA</Link>

        <nav className="ml-6 hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <NavLink key={l.label} to={l.to}
              className={({ isActive }) => cn('rounded-lg px-3 py-2 text-[14px] font-medium text-ink-soft transition-colors hover:bg-surface-sunken hover:text-ink',
                isActive && l.to === '/products' && 'text-ink')}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <form onSubmit={submitSearch} className="ml-auto hidden max-w-xs flex-1 md:block" role="search">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products" aria-label="Search products"
              className="field h-10 pl-9 text-[14px]" />
          </div>
        </form>

        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <Link to="/wishlist" className="rounded-lg p-2.5 text-ink-soft hover:bg-surface-sunken hover:text-ink" aria-label="Wishlist">
            <Heart className="h-[18px] w-[18px]" />
          </Link>
          <Link to="/cart" className="relative rounded-lg p-2.5 text-ink-soft hover:bg-surface-sunken hover:text-ink" aria-label={`Cart, ${count} items`}>
            <ShoppingBag className="h-[18px] w-[18px]" />
            {count > 0 && (
              <span className="tnum absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <div className="relative">
              <button onClick={() => setAccountOpen((v) => !v)} className="ml-1 flex items-center gap-2 rounded-lg p-1.5 hover:bg-surface-sunken">
                <span className="flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold text-white"
                  style={{ background: user.avatarColor }}>{user.initials}</span>
              </button>
              {accountOpen && (
                <div className="absolute right-0 top-12 w-56 animate-slide-in rounded-xl border border-line bg-white p-1.5 shadow-lift"
                  onMouseLeave={() => setAccountOpen(false)}>
                  <div className="px-3 py-2">
                    <p className="truncate text-[14px] font-semibold">{user.name}</p>
                    <p className="truncate text-[13px] text-ink-muted">{user.email}</p>
                  </div>
                  <hr className="my-1 border-line" />
                  <MenuLink to="/orders" icon={Package}>My orders</MenuLink>
                  <MenuLink to="/profile" icon={User}>Profile & addresses</MenuLink>
                  {user.role === 'admin' && <MenuLink to="/admin" icon={LayoutDashboard}>Admin dashboard</MenuLink>}
                  <hr className="my-1 border-line" />
                  <button onClick={() => { signOut(); navigate('/'); }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[14px] text-ink-soft hover:bg-surface-sunken">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button size="sm" className="ml-2" onClick={() => navigate('/login')}>Sign in</Button>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-white p-4 lg:hidden">
          <form onSubmit={submitSearch} className="mb-3 md:hidden">
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products" className="field h-10" />
          </form>
          {links.map((l) => (
            <Link key={l.label} to={l.to} onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-[15px] font-medium text-ink-soft hover:bg-surface-sunken">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </header>
  );
}

function MenuLink({ to, icon: Icon, children }) {
  return (
    <Link to={to} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[14px] text-ink-soft hover:bg-surface-sunken hover:text-ink">
      <Icon className="h-4 w-4" /> {children}
    </Link>
  );
}
