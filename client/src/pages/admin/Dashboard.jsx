import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { IndianRupee, ShoppingCart, Users, Package, AlertTriangle } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryClient';
import { StatCard } from '@/components/admin/StatCard';
import { AreaChart, BarChart, DonutChart } from '@/components/admin/Charts';
import { StatusBadge } from '@/components/ui/Badge';
import { ErrorState, TableSkeleton } from '@/components/ui/States';
import { formatCompactCurrency, formatCurrency, formatNumber, formatDate } from '@/lib/format';

const RANGES = [[7, '7 days'], [30, '30 days'], [90, '90 days']];

export default function Dashboard() {
  const [range, setRange] = useState(30);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminDashboard(range),
    queryFn: () => adminService.dashboard(range),
  });

  if (isError) return <ErrorState message={error?.message} onRetry={refetch} />;

  const s = data?.summary;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">Dashboard</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">Store performance for the last {range} days</p>
        </div>
        <div className="flex rounded-lg border border-line bg-white p-1">
          {RANGES.map(([value, label]) => (
            <button key={value} onClick={() => setRange(value)}
              className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                range === value ? 'bg-ink text-white' : 'text-ink-soft hover:bg-surface-sunken'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={isLoading} label="Total revenue" icon={IndianRupee}
          value={formatCompactCurrency(s?.revenue.value)} change={s?.revenue.change} footnote="vs previous period" />
        <StatCard loading={isLoading} label="Orders" icon={ShoppingCart}
          value={formatNumber(s?.orders.value)} change={s?.orders.change} footnote="vs previous period" />
        <StatCard loading={isLoading} label="Customers" icon={Users}
          value={formatNumber(s?.customers.value)} change={s?.customers.change} footnote="total registered" />
        <StatCard loading={isLoading} label="Active products" icon={Package}
          value={formatNumber(s?.products.value)} footnote={`${s?.products.lowStock ?? 0} need restocking`} />
      </div>

      {s?.products.lowStock > 0 && (
        <Link to="/admin/products?stock=low"
          className="flex items-center gap-3 rounded-xl border border-caution-500/30 bg-caution-50 p-4 text-[14px] text-caution-500 hover:border-caution-500/60">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span><strong className="font-semibold">{s.products.lowStock} products</strong> are at or below their low-stock threshold.</span>
          <span className="ml-auto font-medium">Review stock</span>
        </Link>
      )}

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[17px] font-semibold">Revenue over time</h2>
            <p className="tnum text-[14px] text-ink-muted">
              Avg order {formatCurrency(s?.averageOrderValue.value || 0)}
            </p>
          </div>
          <div className="mt-4">
            {isLoading ? <div className="skeleton h-[260px] w-full" /> : <AreaChart data={data.revenueSeries} />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-[17px] font-semibold">Orders by status</h2>
          <div className="mt-5">
            {isLoading ? <div className="skeleton h-[180px] w-full" /> : <DonutChart data={data.statusBreakdown} />}
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="card p-5">
          <h2 className="font-display text-[17px] font-semibold">Sales by category</h2>
          <p className="mt-1 text-[13.5px] text-ink-muted">Revenue across the last 90 days</p>
          <div className="mt-5">
            {isLoading ? <div className="skeleton h-[200px] w-full" /> : <BarChart data={data.categories} />}
          </div>
        </section>

        <section className="card p-5">
          <h2 className="font-display text-[17px] font-semibold">Top-selling products</h2>
          <p className="mt-1 text-[13.5px] text-ink-muted">By revenue, last 90 days</p>
          <ul className="mt-4 divide-y divide-line">
            {isLoading ? <TableSkeleton rows={5} cols={3} /> : data.topProducts.map((p, i) => (
              <li key={p._id} className="flex items-center gap-3 py-3">
                <span className="tnum w-5 text-[13px] text-ink-muted">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14px] font-medium">{p.name}</p>
                  <p className="text-[13px] text-ink-muted">{p.category} · {p.units} units</p>
                </div>
                <span className="tnum text-[14px] font-semibold">{formatCompactCurrency(p.revenue)}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-line p-5">
          <h2 className="font-display text-[17px] font-semibold">Recent orders</h2>
          <Link to="/admin/orders" className="text-[14px] font-medium text-brand-600 hover:underline">View all orders</Link>
        </div>
        {isLoading ? <TableSkeleton /> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-line bg-surface-sunken/60 text-[12.5px] text-ink-muted">
                <tr>
                  {['Order', 'Customer', 'Products', 'Amount', 'Status', 'Date'].map((h) => (
                    <th key={h} className="px-5 py-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-[14px]">
                {data.recentOrders.map((o) => (
                  <tr key={o._id} className="hover:bg-surface-sunken/50">
                    <td className="px-5 py-3.5">
                      <Link to={`/admin/orders/${o._id}`} className="tnum font-medium hover:text-brand-600">{o.orderNumber}</Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium">{o.user?.name}</p>
                      <p className="text-[13px] text-ink-muted">{o.user?.email}</p>
                    </td>
                    <td className="max-w-[220px] truncate px-5 py-3.5 text-ink-soft">
                      {o.items[0].name}{o.items.length > 1 && ` +${o.items.length - 1}`}
                    </td>
                    <td className="tnum px-5 py-3.5 font-medium">{formatCurrency(o.pricing.total)}</td>
                    <td className="px-5 py-3.5"><StatusBadge status={o.status} /></td>
                    <td className="px-5 py-3.5 text-ink-muted">{formatDate(o.placedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
