import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { orderService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Modal';
import { Skeleton, ErrorState } from '@/components/ui/States';
import { ProductVisual } from '@/components/shop/ProductVisual';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from '@/store/toastStore';

const STEPS = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];

export default function OrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.order(id), queryFn: () => orderService.detail(id),
  });

  const cancel = useMutation({
    mutationFn: () => orderService.cancel(id, 'Changed my mind'),
    onSuccess: () => {
      toast.success('Order cancelled — refund starts within 24 hours');
      setConfirmOpen(false);
      qc.invalidateQueries({ queryKey: queryKeys.order(id) });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (e) => { toast.error(e.message); setConfirmOpen(false); },
  });

  if (isLoading) return <div className="container-page py-12"><Skeleton className="h-80 w-full" /></div>;
  if (isError) return <div className="container-page py-12"><ErrorState message={error?.message} onRetry={refetch} /></div>;

  const stepIndex = STEPS.indexOf(order.status);
  const cancellable = ['pending', 'confirmed', 'packed'].includes(order.status);

  return (
    <div className="container-page py-10">
      <Link to="/orders" className="inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All orders
      </Link>

      <header className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="tnum font-display text-display">{order.orderNumber}</h1>
          <p className="mt-2 text-[15px] text-ink-soft">Placed {formatDateTime(order.placedAt)} · {order.itemCount} items</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          {cancellable && <Button variant="secondary" size="sm" onClick={() => setConfirmOpen(true)}>Cancel order</Button>}
        </div>
      </header>

      {order.status !== 'cancelled' && (
        <ol className="mt-8 grid gap-2 sm:grid-cols-5">
          {STEPS.map((step, i) => (
            <li key={step} className="relative">
              <div className={`h-1 rounded-full ${i <= stepIndex ? 'bg-ink' : 'bg-line'}`} />
              <p className={`mt-2 text-[13px] capitalize ${i <= stepIndex ? 'font-medium text-ink' : 'text-ink-muted'}`}>{step}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div>
          <h2 className="font-display text-[17px] font-semibold">Items</h2>
          <ul className="mt-4 divide-y divide-line rounded-xl border border-line">
            {order.items.map((item) => (
              <li key={item.sku} className="flex items-center gap-4 p-4">
                <div className="w-16 overflow-hidden rounded-lg border border-line">
                  <ProductVisual product={{ ...item, colorway: '#1B39C9' }} ratio="aspect-square" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-medium">{item.name}</p>
                  <p className="tnum mt-0.5 text-[13px] text-ink-muted">{item.sku} · Qty {item.quantity}</p>
                </div>
                <p className="tnum text-[15px] font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              </li>
            ))}
          </ul>

          <h2 className="mt-8 font-display text-[17px] font-semibold">Timeline</h2>
          <ol className="mt-4 space-y-3 border-l border-line pl-5">
            {order.timeline.map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2 w-2 rounded-full bg-ink" />
                <p className="text-[14px] font-medium capitalize">{t.status}</p>
                <p className="text-[13px] text-ink-muted">{t.note} · {formatDateTime(t.at)}</p>
              </li>
            ))}
          </ol>
        </div>

        <aside className="space-y-5">
          <div className="card p-5">
            <h2 className="font-display text-[16px] font-semibold">Payment</h2>
            <dl className="mt-3 space-y-2 text-[14px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tnum">{formatCurrency(order.pricing.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">GST</dt><dd className="tnum">{formatCurrency(order.pricing.tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="tnum">{order.pricing.shipping === 0 ? 'Free' : formatCurrency(order.pricing.shipping)}</dd></div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd className="tnum">{formatCurrency(order.pricing.total)}</dd></div>
            </dl>
            <p className="mt-3 text-[13px] capitalize text-ink-muted">{order.paymentMethod} · {order.paymentStatus}</p>
          </div>

          <div className="card p-5">
            <h2 className="font-display text-[16px] font-semibold">Delivery address</h2>
            <address className="mt-3 not-italic text-[14px] leading-relaxed text-ink-soft">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.line1}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}<br />
              {order.shippingAddress.phone}
            </address>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => cancel.mutate()}
        loading={cancel.isPending} title="Cancel this order?"
        description="Stock goes back to the catalogue and any payment is refunded within 24 hours."
        confirmLabel="Cancel order" />
    </div>
  );
}
