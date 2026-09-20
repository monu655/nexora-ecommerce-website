import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Lock } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/authStore';
import { orderService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { toast } from '@/store/toastStore';

const PAYMENTS = [
  ['upi', 'UPI', 'Pay with any UPI app'],
  ['card', 'Card', 'Visa, Mastercard, RuPay'],
  ['netbanking', 'Net banking', 'All major Indian banks'],
  ['cod', 'Cash on delivery', '₹49 handling fee applies at the door'],
];

export default function Checkout() {
  const { items, totals } = useCart();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const saved = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
  const [address, setAddress] = useState({
    fullName: saved?.fullName || user?.name || '', phone: saved?.phone || user?.phone || '',
    line1: saved?.line1 || '', line2: saved?.line2 || '', city: saved?.city || '',
    state: saved?.state || '', pincode: saved?.pincode || '',
  });
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: () => orderService.checkout({ shippingAddress: address, paymentMethod }),
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: queryKeys.cart });
      qc.invalidateQueries({ queryKey: ['orders'] });
      navigate(`/order-confirmation/${order._id}`, { replace: true });
    },
    onError: (e) => {
      setErrors(Object.fromEntries((e.details || []).map((d) => [d.field.replace('shippingAddress.', ''), d.message])));
      toast.error(e.message);
    },
  });

  const validate = () => {
    const next = {};
    if (address.fullName.trim().length < 2) next.fullName = 'Enter the recipient name';
    if (!/^[0-9+\-\s]{8,15}$/.test(address.phone)) next.phone = 'Enter a valid phone number';
    if (address.line1.trim().length < 4) next.line1 = 'Enter the street address';
    if (!address.city.trim()) next.city = 'Enter the city';
    if (!address.state.trim()) next.state = 'Enter the state';
    if (!/^\d{6}$/.test(address.pincode)) next.pincode = 'Enter a valid 6-digit PIN code';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  if (items.length === 0) { navigate('/cart', { replace: true }); return null; }

  const set = (key) => (e) => setAddress({ ...address, [key]: e.target.value });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display">Checkout</h1>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) mutation.mutate(); }}
        className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-[17px] font-semibold">Delivery address</h2>
            {user?.addresses?.length > 1 && (
              <Field label="Use a saved address" className="mt-4">
                <Select onChange={(e) => {
                  const a = user.addresses[e.target.value];
                  if (a) setAddress({ fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 || '', city: a.city, state: a.state, pincode: a.pincode });
                }}>
                  {user.addresses.map((a, i) => <option key={a._id} value={i}>{a.label} · {a.line1}, {a.city}</option>)}
                </Select>
              </Field>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Full name" error={errors.fullName} required>
                <Input value={address.fullName} onChange={set('fullName')} error={errors.fullName} autoComplete="name" />
              </Field>
              <Field label="Phone" error={errors.phone} required>
                <Input value={address.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
              </Field>
              <Field label="Address" error={errors.line1} required className="sm:col-span-2">
                <Input value={address.line1} onChange={set('line1')} error={errors.line1}
                  placeholder="Flat, building, street" autoComplete="address-line1" />
              </Field>
              <Field label="Landmark" className="sm:col-span-2">
                <Input value={address.line2} onChange={set('line2')} placeholder="Optional" />
              </Field>
              <Field label="City" error={errors.city} required>
                <Input value={address.city} onChange={set('city')} error={errors.city} autoComplete="address-level2" />
              </Field>
              <Field label="State" error={errors.state} required>
                <Input value={address.state} onChange={set('state')} error={errors.state} autoComplete="address-level1" />
              </Field>
              <Field label="PIN code" error={errors.pincode} required>
                <Input value={address.pincode} onChange={set('pincode')} error={errors.pincode} inputMode="numeric" maxLength={6} />
              </Field>
            </div>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-[17px] font-semibold">Payment method</h2>
            <div className="mt-4 space-y-2">
              {PAYMENTS.map(([value, label, hint]) => (
                <label key={value} className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                  paymentMethod === value ? 'border-ink bg-surface-sunken' : 'border-line hover:border-line-strong'}`}>
                  <input type="radio" name="payment" value={value} checked={paymentMethod === value}
                    onChange={() => setPaymentMethod(value)} className="mt-0.5 h-4 w-4 text-brand-600 focus:ring-brand-600" />
                  <span>
                    <span className="block text-[14.5px] font-medium">{label}</span>
                    <span className="block text-[13px] text-ink-muted">{hint}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-2 text-[13px] text-ink-muted">
              <Lock className="h-3.5 w-3.5" /> This demo does not capture real payment details.
            </p>
          </section>
        </div>

        <aside className="h-fit lg:sticky lg:top-28">
          <div className="card p-5">
            <h2 className="font-display text-[17px] font-semibold">Order summary</h2>
            <ul className="mt-4 space-y-3 border-b border-line pb-4">
              {items.map(({ product, quantity, lineTotal }) => (
                <li key={product._id || product.id} className="flex justify-between gap-3 text-[14px]">
                  <span className="text-ink-soft">{product.name} <span className="tnum text-ink-muted">×{quantity}</span></span>
                  <span className="tnum font-medium">{formatCurrency(lineTotal)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-2.5 text-[14.5px]">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="tnum">{formatCurrency(totals.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">GST (18%)</dt><dd className="tnum">{formatCurrency(totals.tax)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="tnum">{totals.shipping === 0 ? 'Free' : formatCurrency(totals.shipping)}</dd></div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
              <span className="text-[15px] font-semibold">Total</span>
              <span className="tnum font-display text-[22px] font-semibold">{formatCurrency(totals.total)}</span>
            </div>
            <Button type="submit" size="lg" className="mt-5 w-full" loading={mutation.isPending}>
              Place order · {formatCurrency(totals.total)}
            </Button>
          </div>
        </aside>
      </form>
    </div>
  );
}
