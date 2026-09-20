import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { useUiStore } from '@/store/cartStore';

export function AdminLayout() {
  const setAdminSidebar = useUiStore((s) => s.setAdminSidebar);

  return (
    <div className="min-h-screen bg-surface-sunken">
      <AdminSidebar />
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur lg:hidden">
          <button onClick={() => setAdminSidebar(true)} aria-label="Open menu" className="rounded-lg p-2 hover:bg-surface-sunken">
            <Menu className="h-5 w-5" />
          </button>
          <span className="font-display text-[17px] font-bold tracking-[-0.04em]">NEXORA Admin</span>
        </header>
        <div className="p-4 sm:p-6 lg:p-8"><Outlet /></div>
      </div>
    </div>
  );
}
