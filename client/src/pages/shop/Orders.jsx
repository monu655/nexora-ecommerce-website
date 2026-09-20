import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { orderService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate } from '@/lib/format';

const FILTERS = ['all', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function Orders() {
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.orders({ status, page }),
    queryFn: () => orderService.list({ status, page, limit: 8 }),
  });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display">My orders</h1>

      <div className="mt-6 flex flex-wrap gap-1.5 border-b border-line pb-4">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => { setStatus(f); setPage(1); }}
            className={`rounded-lg px-3.5 py-2 text-[14px] font-medium capitalize transition-colors ${
              status === f ? 'bg-ink text-white' : 'text-ink-soft hover:bg-surface-sunken'}`}>
            {f === 'all' ? 'All orders' : f}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
        ) : isError ? (
          <ErrorState message={error?.message} onRetry={refetch} />
        ) : data.data.length === 0 ? (
          <EmptyState icon={Package} title="No orders here yet"
            description="When you place an order it will show up here with live tracking."
            action={<Link to="/products"><Button>Start shopping</Button></Link>} />
        ) : (
          <>
            <ul className="space-y-3">
              {data.data.map((order) => (
                <li key={order._id}>
                  <Link to={`/orders/${order._id}`} className="card flex flex-wrap items-center gap-4 p-5 transition-shadow hover:shadow-lift">
                    <div className="min-w-[180px] flex-1">
                      <p className="tnum font-display text-[15px] font-semibold">{order.orderNumber}</p>
                      <p className="mt-0.5 text-[13.5px] text-ink-muted">Placed {formatDate(order.placedAt)}</p>
                    </div>
                    <p className="min-w-[160px] flex-1 text-[14px] text-ink-soft">
                      {order.items[0].name}{order.items.length > 1 && ` +${order.items.length - 1} more`}
                    </p>
                    <StatusBadge status={order.status} />
                    <p className="tnum w-24 text-right font-display text-[16px] font-semibold">{formatCurrency(order.pricing.total)}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onChange={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
