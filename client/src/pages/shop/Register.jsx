import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { toast } from '@/store/toastStore';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const signIn = useAuthStore((s) => s.signIn);

  const mutation = useMutation({
    mutationFn: () => authService.register(form),
    onSuccess: (session) => { signIn(session); toast.success('Account created'); navigate('/', { replace: true }); },
    onError: (e) => {
      setErrors(Object.fromEntries((e.details || []).map((d) => [d.field, d.message])));
      if (!e.details) setErrors({ form: e.message });
    },
  });

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Enter your full name';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = 'Enter a valid email address';
    if (form.password.length < 8) next.password = 'Use at least 8 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-display">Create an account</h1>
        <p className="mt-2 text-[15px] text-ink-soft">Faster checkout, order tracking and a saved wishlist.</p>

        <form onSubmit={(e) => { e.preventDefault(); if (validate()) mutation.mutate(); }} className="mt-8 space-y-4">
          {errors.form && <p role="alert" className="rounded-lg bg-critical-50 px-3.5 py-2.5 text-[13.5px] text-critical-500">{errors.form}</p>}
          <Field label="Full name" error={errors.name} required>
            <Input value={form.name} onChange={set('name')} error={errors.name} autoComplete="name" />
          </Field>
          <Field label="Email" error={errors.email} required>
            <Input type="email" value={form.email} onChange={set('email')} error={errors.email} autoComplete="email" />
          </Field>
          <Field label="Phone" error={errors.phone} hint="Used only for delivery updates">
            <Input value={form.phone} onChange={set('phone')} error={errors.phone} autoComplete="tel" />
          </Field>
          <Field label="Password" error={errors.password} hint="At least 8 characters" required>
            <Input type="password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" />
          </Field>
          <Button type="submit" size="lg" className="w-full" loading={mutation.isPending}>Create account</Button>
        </form>

        <p className="mt-6 text-center text-[14px] text-ink-soft">
          Already have an account? <Link to="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
