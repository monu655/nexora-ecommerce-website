import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { orderService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/States';
import { formatCurrency, formatDate } from '@/lib/format';

export default function OrderConfirmation() {
  const { id } = useParams();
  const { data: order, isLoading } = useQuery({ queryKey: queryKeys.order(id), queryFn: () => orderService.detail(id) });

  if (isLoading) return <div className="container-page py-16"><Skeleton className="h-64 w-full max-w-xl" /></div>;

  const eta = new Date(new Date(order.placedAt).getTime() + 4 * 864e5);

  return (
    <div className="container-page max-w-2xl py-16">
      <CheckCircle2 className="h-10 w-10 text-positive-500" aria-hidden />
      <h1 className="mt-5 font-display text-display">Order placed</h1>
      <p className="mt-3 text-[16px] leading-relaxed text-ink-soft">
        We have sent a confirmation to your email. Your order arrives by {formatDate(eta)}.
      </p>

      <div className="card mt-8 p-5 sm:p-6">
        <div className="flex flex-wrap justify-between gap-4 border-b border-line pb-4">
          <div>
            <p className="text-[13px] text-ink-muted">Order number</p>
            <p className="tnum font-display text-[17px] font-semibold">{order.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] text-ink-muted">Total paid</p>
            <p className="tnum font-display text-[17px] font-semibold">{formatCurrency(order.pricing.total)}</p>
          </div>
        </div>

        <ul className="mt-4 space-y-3">
          {order.items.map((i) => (
            <li key={i.sku} className="flex justify-between gap-4 text-[14.5px]">
              <span className="text-ink-soft">{i.name} <span className="tnum text-ink-muted">×{i.quantity}</span></span>
              <span className="tnum font-medium">{formatCurrency(i.price * i.quantity)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-5 border-t border-line pt-4 text-[14px] text-ink-soft">
          <p className="font-medium text-ink">Delivering to</p>
          <p className="mt-1">{order.shippingAddress.fullName}, {order.shippingAddress.line1}, {order.shippingAddress.city} {order.shippingAddress.pincode}</p>
        </div>
      </div>

      <div className="mt-7 flex flex-wrap gap-3">
        <Link to={`/orders/${order._id}`}><Button>Track this order</Button></Link>
        <Link to="/products"><Button variant="secondary">Continue shopping</Button></Link>
      </div>
    </div>
  );
}
