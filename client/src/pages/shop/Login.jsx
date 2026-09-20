import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { cartService } from '@/services/commerce.service';
import { useAuthStore } from '@/store/authStore';
import { useGuestCartStore } from '@/store/cartStore';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const signIn = useAuthStore((s) => s.signIn);
  const guestCart = useGuestCartStore();

  const mutation = useMutation({
    mutationFn: () => authService.login(form),
    onSuccess: async (session) => {
      signIn(session);
      // Carry anything the visitor added before signing in.
      if (guestCart.items.length) {
        await cartService.merge(guestCart.items.map((i) => ({ productId: i.productId, quantity: i.quantity }))).catch(() => {});
        guestCart.clear();
      }
      qc.invalidateQueries();
      toast.success(`Welcome back, ${session.user.name.split(' ')[0]}`);
      navigate(session.user.role === 'admin' ? '/admin' : location.state?.from || '/', { replace: true });
    },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display">Sign in</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Your cart, orders and wishlist, wherever you are.</p>

        <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="mt-8 space-y-4">
          {error && <p role="alert" className="rounded-lg bg-critical-50 px-3.5 py-2.5 text-[13.5px] text-critical-500">{error}</p>}
          <Field label="Email" required>
            <Input type="email" autoComplete="email" required value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          </Field>
          <Field label="Password" required>
            <Input type="password" autoComplete="current-password" required value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••••" />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>Sign in</Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-soft">
          New to Nexora? <Link to="/register" className="font-medium text-brand-600 hover:underline">Create an account</Link>
        </p>

        <div className="mt-8 rounded-xl border border-line bg-surface-sunken p-4">
          <p className="text-[13px] font-semibold">Demo accounts</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
            Customer: riya.mehta@example.com / Customer@2025<br />
            Admin: admin@nexora.store / Nexora@2025
          </p>
        </div>
      </div>
    </div>
  );
}
