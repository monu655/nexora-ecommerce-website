import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { ProductVisual } from '@/components/shop/ProductVisual';
import { Button } from '@/components/ui/Button';
import { EmptyState, Skeleton } from '@/components/ui/States';
import { ConfirmDialog } from '@/components/ui/Modal';
import { formatCurrency } from '@/lib/format';
import { FREE_SHIPPING_THRESHOLD } from '@/utils/pricing';
import { useAuthStore } from '@/store/authStore';

export default function CartPage() {
  const { items, totals, isLoading, updateItem, removeItem } = useCart();
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const authenticated = useAuthStore((s) => Boolean(s.accessToken));
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="container-page space-y-4 py-12">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}</div>;
  }

  if (items.length === 0) {
    return (
      <div className="container-page py-16">
        <h1 className="mb-8 font-display text-display">Your cart</h1>
        <EmptyState icon={ShoppingBag} title="Your cart is empty"
          description="Browse the catalogue and add something you will actually use every day."
          action={<Link to="/products"><Button>Browse products</Button></Link>} />
      </div>
    );
  }

  const awayFromFreeShipping = FREE_SHIPPING_THRESHOLD - totals.subtotal;

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display">Your cart</h1>
      <p className="mt-2 text-[15px] text-ink-soft">{items.length} item{items.length === 1 ? '' : 's'} ready to checkout</p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-line rounded-xl border border-line">
          {items.map(({ product, quantity, lineTotal }) => (
            <li key={product._id || product.id} className="flex gap-4 p-4 sm:p-5">
              <Link to={`/products/${product.slug}`} className="w-24 shrink-0 overflow-hidden rounded-lg border border-line sm:w-28">
                <ProductVisual product={product} ratio="aspect-square" />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-ink-muted">{product.category}</p>
                <Link to={`/products/${product.slug}`} className="font-display text-[15px] font-semibold hover:text-brand-600">
                  {product.name}
                </Link>
                <p className="tnum mt-1 text-[14px] text-ink-soft">{formatCurrency(product.price)} each</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex h-9 items-center rounded-lg border border-line">
                    <button onClick={() => updateItem(product._id || product.id, Math.max(1, quantity - 1))}
                      className="h-full w-9 text-ink-soft hover:bg-surface-sunken" aria-label="Decrease quantity">−</button>
                    <span className="tnum w-8 text-center text-[14px] font-medium">{quantity}</span>
                    <button onClick={() => updateItem(product._id || product.id, Math.min(10, quantity + 1))}
                      className="h-full w-9 text-ink-soft hover:bg-surface-sunken" aria-label="Increase quantity">+</button>
                  </div>
                  <button onClick={() => setPendingRemoval(product)}
                    className="inline-flex items-center gap-1.5 text-[13.5px] text-ink-muted hover:text-critical-500">
                    <Trash2 className="h-4 w-4" /> Remove
                  </button>
                </div>
              </div>
              <p className="tnum font-display text-[16px] font-semibold">{formatCurrency(lineTotal)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit lg:sticky lg:top-28">
          <div className="card p-5">
            <h2 className="font-display text-[17px] font-semibold">Order summary</h2>
            <dl className="mt-4 space-y-2.5 text-[14.5px]">
              <Row label="Subtotal" value={formatCurrency(totals.subtotal)} />
              <Row label="GST (18%)" value={formatCurrency(totals.tax)} />
              <Row label="Delivery" value={totals.shipping === 0 ? 'Free' : formatCurrency(totals.shipping)} />
            </dl>
            {awayFromFreeShipping > 0 && (
              <p className="mt-3 rounded-lg bg-brand-50 px-3 py-2 text-[13px] text-brand-700">
                Add {formatCurrency(awayFromFreeShipping)} more for free delivery.
              </p>
            )}
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="tnum font-display text-[22px] font-semibold">{formatCurrency(totals.total)}</span>
            </div>
            <Button size="lg" className="mt-5 w-full"
              onClick={() => navigate(authenticated ? '/checkout' : '/login', { state: { from: '/checkout' } })}>
              {authenticated ? 'Proceed to checkout' : 'Sign in to checkout'} <ArrowRight className="h-4 w-4" />
            </Button>
            <Link to="/products" className="mt-3 block text-center text-[14px] text-ink-soft hover:text-ink">Continue shopping</Link>
          </div>
        </aside>
      </div>

      <ConfirmDialog open={Boolean(pendingRemoval)} onClose={() => setPendingRemoval(null)}
        title={`Remove ${pendingRemoval?.name}?`}
        description="It will stay available in the catalogue if you change your mind."
        confirmLabel="Remove item"
        onConfirm={() => { removeItem(pendingRemoval._id || pendingRemoval.id); setPendingRemoval(null); }} />
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tnum font-medium">{value}</dd>
    </div>
  );
}
