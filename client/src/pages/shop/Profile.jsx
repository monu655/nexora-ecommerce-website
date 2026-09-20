import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, MapPin } from 'lucide-react';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { Field, Input, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal, ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/States';
import { toast } from '@/store/toastStore';
import { formatDate } from '@/lib/format';

const blankAddress = { label: 'home', fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

export default function Profile() {
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [addressModal, setAddressModal] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });

  const saveProfile = useMutation({
    mutationFn: () => authService.updateProfile(profile),
    onSuccess: (updated) => { setUser({ ...user, ...updated }); toast.success('Profile updated'); },
    onError: (e) => toast.error(e.message),
  });

  const saveAddress = useMutation({
    mutationFn: () => addressModal._id
      ? authService.updateAddress(addressModal._id, addressModal)
      : authService.addAddress(addressModal),
    onSuccess: (addresses) => { setUser({ ...user, addresses }); setAddressModal(null); toast.success('Address saved'); },
    onError: (e) => toast.error(e.message),
  });

  const deleteAddress = useMutation({
    mutationFn: () => authService.deleteAddress(pendingDelete._id),
    onSuccess: (addresses) => { setUser({ ...user, addresses }); setPendingDelete(null); toast.info('Address removed'); },
    onError: (e) => toast.error(e.message),
  });

  const changePassword = useMutation({
    mutationFn: () => authService.changePassword(passwords),
    onSuccess: () => { setPasswords({ currentPassword: '', newPassword: '' }); toast.success('Password changed'); },
    onError: (e) => toast.error(e.message),
  });

  const setAddr = (k) => (e) => setAddressModal({ ...addressModal, [k]: e.target.value });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display">Profile</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Member since {formatDate(user?.createdAt || Date.now())}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Personal details</h2>
          <form onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }} className="mt-4 space-y-4">
            <Field label="Full name"><Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></Field>
            <Field label="Email" hint="Contact support to change the email on your account">
              <Input value={user?.email} disabled />
            </Field>
            <Field label="Phone"><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></Field>
            <Button type="submit" loading={saveProfile.isPending}>Save changes</Button>
          </form>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Change password</h2>
          <form onSubmit={(e) => { e.preventDefault(); changePassword.mutate(); }} className="mt-4 space-y-4">
            <Field label="Current password" required>
              <Input type="password" value={passwords.currentPassword} required
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} />
            </Field>
            <Field label="New password" hint="At least 8 characters" required>
              <Input type="password" value={passwords.newPassword} required minLength={8}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} />
            </Field>
            <Button type="submit" variant="secondary" loading={changePassword.isPending}>Change password</Button>
          </form>
        </section>
      </div>

      <section className="mt-6 card p-5 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-[17px] font-semibold">Saved addresses</h2>
          <Button size="sm" variant="secondary" onClick={() => setAddressModal({ ...blankAddress, fullName: user.name, phone: user.phone || '' })}>
            <Plus className="h-4 w-4" /> Add address
          </Button>
        </div>

        {user?.addresses?.length ? (
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
            {user.addresses.map((a) => (
              <li key={a._id} className="rounded-xl border border-line p-4">
                <div className="flex items-center gap-2">
                  <Badge tone="neutral"><span className="capitalize">{a.label}</span></Badge>
                  {a.isDefault && <Badge tone="brand">Default</Badge>}
                </div>
                <p className="mt-3 text-[14.5px] font-medium">{a.fullName}</p>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-soft">
                  {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.pincode}<br />{a.phone}
                </p>
                <div className="mt-3 flex gap-3">
                  <button onClick={() => setAddressModal(a)} className="text-[13.5px] font-medium text-brand-600 hover:underline">Edit</button>
                  <button onClick={() => setPendingDelete(a)} className="inline-flex items-center gap-1 text-[13.5px] text-ink-muted hover:text-critical-500">
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-5">
            <EmptyState icon={MapPin} title="No addresses saved" description="Add one now and checkout becomes a single tap." />
          </div>
        )}
      </section>

      <Modal open={Boolean(addressModal)} onClose={() => setAddressModal(null)} size="lg"
        title={addressModal?._id ? 'Edit address' : 'Add an address'}
        footer={<>
          <Button variant="secondary" onClick={() => setAddressModal(null)}>Cancel</Button>
          <Button onClick={() => saveAddress.mutate()} loading={saveAddress.isPending}>Save address</Button>
        </>}>
        {addressModal && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Label">
              <Select value={addressModal.label} onChange={setAddr('label')}>
                <option value="home">Home</option><option value="work">Work</option><option value="other">Other</option>
              </Select>
            </Field>
            <Field label="Full name"><Input value={addressModal.fullName} onChange={setAddr('fullName')} /></Field>
            <Field label="Phone"><Input value={addressModal.phone} onChange={setAddr('phone')} /></Field>
            <Field label="PIN code"><Input value={addressModal.pincode} onChange={setAddr('pincode')} maxLength={6} inputMode="numeric" /></Field>
            <Field label="Address" className="sm:col-span-2"><Input value={addressModal.line1} onChange={setAddr('line1')} /></Field>
            <Field label="City"><Input value={addressModal.city} onChange={setAddr('city')} /></Field>
            <Field label="State"><Input value={addressModal.state} onChange={setAddr('state')} /></Field>
            <label className="flex items-center gap-2.5 text-[14px] text-ink-soft sm:col-span-2">
              <input type="checkbox" checked={addressModal.isDefault}
                onChange={(e) => setAddressModal({ ...addressModal, isDefault: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-brand-600 focus:ring-brand-600" />
              Use as my default delivery address
            </label>
          </div>
        )}
      </Modal>

      <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteAddress.mutate()} loading={deleteAddress.isPending}
        title="Remove this address?" description="You can add it again at any time."
        confirmLabel="Remove address" />
    </div>
  );
}
