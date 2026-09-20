import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Receipt, ArrowUpRight } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryClient';
import { Input, Select } from '@/components/ui/Field';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, initialsOf } from '@/lib/format';

const STATUSES = ['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [filters, setFilters] = useState({ search: '', status: 'all', page: 1 });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminOrders(filters),
    queryFn: () => adminService.orders({ ...filters, limit: 12 }),
    placeholderData: keepPreviousData,
  });

  const orders = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">Orders</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">
            {data?.meta?.total ?? '—'} orders placed to date
          </p>
        </div>
      </header>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={filters.search}
              placeholder="Search by order number, customer or email"
              className="h-10 pl-9 text-[14px]"
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            />
          </div>
          <Select
            value={filters.status}
            className="h-10 w-auto min-w-[160px] text-[14px]"
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
          >
            <option value="all">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
            ))}
          </Select>
        </div>

        {isError ? (
          <div className="p-6"><ErrorState message={error?.message} onRetry={refetch} /></div>
        ) : isLoading ? (
          <TableSkeleton rows={9} cols={6} />
        ) : orders.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={Receipt}
              title="No orders match these filters"
              description="Clear the status filter or try a different search term."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-[14px]">
              <thead className="border-b border-line bg-surface-sunken/60 text-[12px] uppercase tracking-[0.06em] text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {orders.map((order) => (
                  <tr key={order._id} className="transition-colors hover:bg-surface-sunken/50">
                    <td className="px-4 py-3">
                      <Link to={`/admin/orders/${order._id}`} className="tnum font-medium text-brand-600 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-sunken text-[11px] font-semibold text-ink-soft">
                          {initialsOf(order.user?.name || order.shippingAddress?.fullName || 'NX')}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{order.user?.name || order.shippingAddress?.fullName}</p>
                          <p className="truncate text-[12.5px] text-ink-muted">{order.user?.email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="max-w-[240px] truncate">{order.items?.[0]?.name}</p>
                      {order.items?.length > 1 && (
                        <p className="text-[12.5px] text-ink-muted">+{order.items.length - 1} more</p>
                      )}
                    </td>
                    <td className="tnum px-4 py-3 text-right font-medium">{formatCurrency(order.pricing?.total)}</td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="tnum px-4 py-3 text-ink-soft">{formatDate(order.placedAt)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-soft hover:text-ink"
                      >
                        Open <ArrowUpRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.meta && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onChange={(page) => setFilters({ ...filters, page })}
        />
      )}
    </div>
  );
}
