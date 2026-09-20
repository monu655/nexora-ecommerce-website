import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';

export default function AdminLogin() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const signIn = useAuthStore((s) => s.signIn);
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => authService.adminLogin(form),
    onSuccess: (session) => { signIn(session); navigate('/admin', { replace: true }); },
    onError: (e) => setError(e.message),
  });

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between bg-ink p-12 text-white lg:flex">
        <span className="font-display text-[22px] font-bold tracking-[-0.04em]">NEXORA</span>
        <div>
          <h1 className="max-w-md font-display text-[34px] font-semibold leading-tight tracking-[-0.03em]">
            The console behind the storefront
          </h1>
          <p className="mt-4 max-w-sm text-[15px] leading-relaxed text-white/60">
            Revenue, fulfilment, stock and customers — everything the team needs to run the day, in one place.
          </p>
        </div>
        <p className="text-[13px] text-white/40">Authorised personnel only · All activity is logged</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <ShieldCheck className="h-8 w-8 text-brand-600" aria-hidden />
          <h2 className="mt-5 font-display text-[28px] font-semibold tracking-[-0.03em]">Admin sign in</h2>
          <p className="mt-2 text-[15px] text-ink-soft">Use your store manager credentials.</p>

          <form onSubmit={(e) => { e.preventDefault(); setError(''); mutation.mutate(); }} className="mt-8 space-y-4">
            {error && <p role="alert" className="rounded-lg bg-critical-50 px-3.5 py-2.5 text-[13.5px] text-critical-500">{error}</p>}
            <Field label="Work email" required>
              <Input type="email" required value={form.email} autoComplete="email"
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="admin@nexora.store" />
            </Field>
            <Field label="Password" required>
              <Input type="password" required value={form.password} autoComplete="current-password"
                onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>Sign in to console</Button>
          </form>

          <div className="mt-8 rounded-xl border border-line bg-surface-sunken p-4">
            <p className="text-[13px] font-semibold">Demo credentials</p>
            <p className="tnum mt-1.5 text-[13px] text-ink-soft">admin@nexora.store / Nexora@2025</p>
          </div>
        </div>
      </div>
    </div>
  );
}
