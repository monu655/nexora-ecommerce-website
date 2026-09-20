import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Phone, CreditCard, Clock } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { ErrorState, Skeleton } from '@/components/ui/States';
import { ProductVisual } from '@/components/shop/ProductVisual';
import { formatCurrency, formatDateTime } from '@/lib/format';
import { toast } from '@/store/toastStore';

// Mirrors ORDER_STATUS_FLOW on the server so the UI never offers an illegal transition.
const NEXT_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const LABEL = {
  confirmed: 'Confirm order',
  packed: 'Mark as packed',
  shipped: 'Mark as shipped',
  delivered: 'Mark as delivered',
  cancelled: 'Cancel order',
};

export default function AdminOrderDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [pending, setPending] = useState(null);

  const { data: order, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminOrder(id),
    queryFn: () => adminService.order(id),
  });

  const transition = useMutation({
    mutationFn: (status) => adminService.updateOrderStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      setPending(null);
      toast.success(`Order marked ${updated?.status ?? 'updated'}`);
    },
    onError: (e) => { toast.error(e.message); setPending(null); },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorState message={error?.message || 'We could not load this order.'} onRetry={refetch} />;
  }

  const next = NEXT_STATUS[order.status] ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-[13.5px] font-medium text-ink-soft hover:text-ink">
          <ArrowLeft className="h-4 w-4" /> Back to orders
        </Link>
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="tnum font-display text-[26px] font-semibold tracking-[-0.03em]">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">Placed {formatDateTime(order.placedAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {next.length === 0 && (
            <span className="rounded-lg bg-surface-sunken px-3 py-2 text-[13px] text-ink-muted">
              No further action required
            </span>
          )}
          {next.map((status) => (
            <Button
              key={status}
              variant={status === 'cancelled' ? 'secondary' : 'primary'}
              onClick={() => setPending(status)}
            >
              {LABEL[status]}
            </Button>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <section className="space-y-6">
          <div className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-3.5 text-[14px] font-semibold">
              Items ({order.items?.length})
            </h2>
            <ul className="divide-y divide-line">
              {order.items?.map((item) => (
                <li key={item._id || item.slug} className="flex items-center gap-4 px-5 py-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                    <ProductVisual product={item} ratio="aspect-square" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-medium">{item.name}</p>
                    <p className="text-[13px] text-ink-muted">
                      {item.sku} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="tnum text-[14.5px] font-medium">{formatCurrency(item.price * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-2 border-t border-line bg-surface-sunken/50 px-5 py-4 text-[14px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tnum">{formatCurrency(order.pricing?.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Shipping</dt><dd className="tnum">{order.pricing?.shipping ? formatCurrency(order.pricing.shipping) : 'Free'}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">GST (18%)</dt><dd className="tnum">{formatCurrency(order.pricing?.tax)}</dd></div>
              {order.pricing?.discount > 0 && (
                <div className="flex justify-between text-positive-600"><dt>Discount</dt><dd className="tnum">− {formatCurrency(order.pricing.discount)}</dd></div>
              )}
              <div className="flex justify-between border-t border-line pt-2 text-[15px] font-semibold">
                <dt>Total</dt><dd className="tnum">{formatCurrency(order.pricing?.total)}</dd>
              </div>
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <Clock className="h-4 w-4 text-ink-muted" /> Timeline
            </h2>
            <ol className="mt-4 space-y-4">
              {[...(order.timeline ?? [])].reverse().map((entry, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div>
                    <p className="text-[14px] font-medium capitalize">{entry.status}</p>
                    {entry.note && <p className="text-[13px] text-ink-soft">{entry.note}</p>}
                    <p className="tnum text-[12.5px] text-ink-muted">{formatDateTime(entry.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-5">
            <h2 className="text-[14px] font-semibold">Customer</h2>
            <p className="mt-3 text-[14.5px] font-medium">{order.user?.name || order.shippingAddress?.fullName}</p>
            <p className="text-[13.5px] text-ink-soft">{order.user?.email}</p>
            {order.shippingAddress?.phone && (
              <p className="mt-2 flex items-center gap-1.5 text-[13.5px] text-ink-soft">
                <Phone className="h-3.5 w-3.5" /> {order.shippingAddress.phone}
              </p>
            )}
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <MapPin className="h-4 w-4 text-ink-muted" /> Shipping address
            </h2>
            <address className="mt-3 space-y-0.5 text-[13.5px] not-italic leading-relaxed text-ink-soft">
              <p className="font-medium text-ink">{order.shippingAddress?.fullName}</p>
              <p>{order.shippingAddress?.line1}</p>
              {order.shippingAddress?.line2 && <p>{order.shippingAddress.line2}</p>}
              <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
            </address>
          </div>

          <div className="card p-5">
            <h2 className="flex items-center gap-2 text-[14px] font-semibold">
              <CreditCard className="h-4 w-4 text-ink-muted" /> Payment
            </h2>
            <dl className="mt-3 space-y-2 text-[13.5px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Method</dt><dd className="font-medium uppercase">{order.paymentMethod}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Status</dt><dd className="font-medium capitalize">{order.paymentStatus}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-ink-soft">Reference</dt><dd className="tnum truncate">{order.orderNumber}</dd></div>
            </dl>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => transition.mutate(pending)}
        loading={transition.isPending}
        tone={pending === 'cancelled' ? 'danger' : 'primary'}
        title={pending === 'cancelled' ? 'Cancel this order?' : `${LABEL[pending] ?? 'Update order'}?`}
        description={
          pending === 'cancelled'
            ? 'Stock will be returned to inventory and the payment marked for refund. This cannot be undone.'
            : 'The customer will see this update in their order history straight away.'
        }
        confirmLabel={pending === 'cancelled' ? 'Cancel order' : 'Update status'}
      />
    </div>
  );
}
