import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Search, Users, ShieldOff, ShieldCheck } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatDate, initialsOf } from '@/lib/format';
import { toast } from '@/store/toastStore';

export default function AdminCustomers() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ search: '', page: 1 });
  const [pending, setPending] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminCustomers(filters),
    queryFn: () => adminService.customers({ ...filters, limit: 12 }),
    placeholderData: keepPreviousData,
  });

  const setStatus = useMutation({
    mutationFn: () => adminService.setCustomerStatus(pending._id, !pending.isActive),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(pending.isActive ? 'Account deactivated' : 'Account reactivated');
      setPending(null);
    },
    onError: (e) => { toast.error(e.message); setPending(null); },
  });

  const customers = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">Customers</h1>
        <p className="mt-1.5 text-[14.5px] text-ink-soft">
          {data?.meta?.total ?? '—'} registered accounts, ranked by most recent sign-up
        </p>
      </header>

      <div className="card overflow-hidden">
        <div className="border-b border-line p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input
              value={filters.search}
              placeholder="Search by name, email or phone"
              className="h-10 pl-9 text-[14px]"
              onChange={(e) => setFilters({ search: e.target.value, page: 1 })}
            />
          </div>
        </div>

        {isError ? (
          <div className="p-6"><ErrorState message={error?.message} onRetry={refetch} /></div>
        ) : isLoading ? (
          <TableSkeleton rows={9} cols={6} />
        ) : customers.length === 0 ? (
          <div className="p-6">
            <EmptyState icon={Users} title="No customers found" description="Try a different name, email or phone number." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-[14px]">
              <thead className="border-b border-line bg-surface-sunken/60 text-[12px] uppercase tracking-[0.06em] text-ink-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 text-right font-medium">Orders</th>
                  <th className="px-4 py-3 text-right font-medium">Lifetime value</th>
                  <th className="px-4 py-3 font-medium">Last order</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {customers.map((c) => (
                  <tr key={c._id} className="transition-colors hover:bg-surface-sunken/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-[11.5px] font-semibold text-brand-700">
                          {initialsOf(c.name)}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          <p className="truncate text-[12.5px] text-ink-muted">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tnum px-4 py-3 text-ink-soft">{c.phone || '—'}</td>
                    <td className="tnum px-4 py-3 text-right">{c.orderCount}</td>
                    <td className="tnum px-4 py-3 text-right font-medium">{formatCurrency(c.lifetimeValue)}</td>
                    <td className="tnum px-4 py-3 text-ink-soft">{c.lastOrderAt ? formatDate(c.lastOrderAt) : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={c.isActive ? 'positive' : 'neutral'}>{c.isActive ? 'Active' : 'Deactivated'}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" onClick={() => setPending(c)}>
                        {c.isActive ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                        {c.isActive ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {data?.meta && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          total={data.meta.total}
          onChange={(page) => setFilters({ ...filters, page })}
        />
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => setPending(null)}
        onConfirm={() => setStatus.mutate()}
        loading={setStatus.isPending}
        tone={pending?.isActive ? 'danger' : 'primary'}
        title={pending?.isActive ? `Deactivate ${pending?.name}?` : `Reactivate ${pending?.name}?`}
        description={
          pending?.isActive
            ? 'They will be signed out and blocked from placing new orders. Past orders stay on record.'
            : 'They will be able to sign in and place orders again.'
        }
        confirmLabel={pending?.isActive ? 'Deactivate' : 'Reactivate'}
      />
    </div>
  );
}
