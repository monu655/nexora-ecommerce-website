import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { ShieldCheck, Store, KeyRound } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Field, Input } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { toast } from '@/store/toastStore';
import { formatCurrency, initialsOf } from '@/lib/format';

// Store-wide commercial rules live on the server (config/constants.js) so the
// storefront, checkout and invoices can never disagree. They are shown here
// read-only for reference during support calls.
const STORE_RULES = [
  { label: 'Free shipping threshold', value: formatCurrency(4999) },
  { label: 'Standard shipping fee', value: formatCurrency(149) },
  { label: 'GST applied at checkout', value: '18%' },
  { label: 'Currency', value: 'INR (₹)' },
  { label: 'Return window', value: '7 days from delivery' },
];

export default function AdminSettings() {
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = useMutation({
    mutationFn: () => authService.updateProfile(profile),
    onSuccess: (updated) => { setUser({ ...user, ...updated }); toast.success('Profile updated'); },
    onError: (e) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: () => authService.changePassword(passwords),
    onSuccess: () => { setPasswords({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">Settings</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">Your admin account and the store rules applied at checkout.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <section className="card p-6">
            <div className="flex items-center gap-4">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-600 text-[16px] font-semibold text-white">
                {initialsOf(user?.name)}
              </span>
              <div>
                <p className="font-display text-[18px] font-semibold tracking-[-0.02em]">{user?.name}</p>
                <p className="text-[13.5px] text-ink-soft">{user?.email}</p>
              </div>
              <Badge tone="brand" className="ml-auto">
                <ShieldCheck className="h-3.5 w-3.5" /> Administrator
              </Badge>
            </div>

            <form
              className="mt-6 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }}
            >
              <Field label="Full name">
                <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
              </Field>
              <Field label="Phone">
                <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="10-digit mobile" />
              </Field>
              <Field label="Email" hint="Contact your workspace owner to change the sign-in email.">
                <Input value={user?.email || ''} disabled />
              </Field>
              <div className="flex items-end sm:col-span-2">
                <Button type="submit" loading={saveProfile.isPending}>Save changes</Button>
              </div>
            </form>
          </section>

          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-[-0.02em]">
              <KeyRound className="h-4 w-4 text-ink-muted" /> Password
            </h2>
            <p className="mt-1 text-[13.5px] text-ink-soft">
              Admin sessions expire automatically. Rotate this password if it has been shared.
            </p>
            <form
              className="mt-5 grid gap-4 sm:grid-cols-2"
              onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }}
            >
              <Field label="Current password">
                <Input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  required
                />
              </Field>
              <Field label="New password" hint="At least 8 characters.">
                <Input
                  type="password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  minLength={8}
                  required
                />
              </Field>
              <div className="sm:col-span-2">
                <Button type="submit" variant="secondary" loading={changePassword.isPending}>Update password</Button>
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-[17px] font-semibold tracking-[-0.02em]">
              <Store className="h-4 w-4 text-ink-muted" /> Store rules
            </h2>
            <dl className="mt-4 divide-y divide-line text-[14px]">
              {STORE_RULES.map((rule) => (
                <div key={rule.label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-ink-soft">{rule.label}</dt>
                  <dd className="tnum font-medium">{rule.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 rounded-lg bg-surface-sunken px-3 py-2.5 text-[12.5px] leading-relaxed text-ink-muted">
              These values are set server-side and applied to every order total, so the storefront and invoices stay in sync.
            </p>
          </section>

          <section className="card p-6">
            <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em]">Access</h2>
            <ul className="mt-3 space-y-2.5 text-[13.5px] text-ink-soft">
              <li className="flex justify-between gap-3"><span>Role</span><span className="font-medium text-ink">Administrator</span></li>
              <li className="flex justify-between gap-3"><span>Permissions</span><span className="font-medium text-ink">Full access</span></li>
              <li className="flex justify-between gap-3"><span>Two-factor</span><span className="font-medium text-ink">Not enabled</span></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
