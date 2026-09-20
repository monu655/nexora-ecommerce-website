import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { queryKeys } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Field';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { EmptyState, ErrorState, TableSkeleton } from '@/components/ui/States';
import { Pagination } from '@/components/ui/Pagination';
import { formatCurrency, formatNumber } from '@/lib/format';
import { toast } from '@/store/toastStore';

const CATEGORIES = ['Audio', 'Wearables', 'Keyboards', 'Gaming', 'Laptop Accessories', 'Mobile Accessories'];

export default function AdminProducts() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({ search: '', category: 'all', page: 1 });
  const [pendingDelete, setPendingDelete] = useState(null);
  const [stockEdit, setStockEdit] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.adminProducts(filters),
    queryFn: () => adminService.products({ ...filters, limit: 10 }),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin'] });

  const remove = useMutation({
    mutationFn: (id) => adminService.deleteProduct(id),
    onSuccess: (_, __, ctx) => { invalidate(); setPendingDelete(null); toast.success('Product removed from the storefront'); },
    onError: (e) => { toast.error(e.message); setPendingDelete(null); },
  });

  const restore = useMutation({
    mutationFn: (id) => adminService.restoreProduct(id),
    onSuccess: () => { invalidate(); toast.success('Product is live again'); },
    onError: (e) => toast.error(e.message),
  });

  const saveStock = useMutation({
    mutationFn: () => adminService.updateStock(stockEdit._id, { stock: Number(stockEdit.stock), lowStockThreshold: Number(stockEdit.lowStockThreshold) }),
    onSuccess: () => { invalidate(); setStockEdit(null); toast.success('Stock updated'); },
    onError: (e) => toast.error(e.message),
  });

  const items = data?.data ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">Products</h1>
          <p className="mt-1.5 text-[14.5px] text-ink-soft">{data?.meta?.total ?? '—'} items in the catalogue</p>
        </div>
        <Link to="/admin/products/new"><Button><Plus className="h-4 w-4" /> Add product</Button></Link>
      </header>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap gap-3 border-b border-line p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
            <Input value={filters.search} placeholder="Search by name or SKU" className="h-10 pl-9 text-[14px]"
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })} />
          </div>
          <Select value={filters.category} className="h-10 w-auto min-w-[170px] text-[14px]"
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>

        {isError ? <div className="p-6"><ErrorState message={error?.message} onRetry={refetch} /></div>
          : isLoading ? <TableSkeleton rows={8} cols={6} />
          : items.length === 0 ? <div className="p-6"><EmptyState title="No products match this search" description="Try a different term, or clear the category filter." /></div>
          : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left">
                <thead className="border-b border-line bg-surface-sunken/60 text-[12.5px] text-ink-muted">
                  <tr>{['Product', 'Category', 'Price', 'Stock', 'Sold', 'Status', ''].map((h, i) => (
                    <th key={i} className="px-5 py-3 font-medium">{h}</th>))}</tr>
                </thead>
                <tbody className="divide-y divide-line text-[14px]">
                  {items.map((p) => (
                    <tr key={p._id} className="hover:bg-surface-sunken/50">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className="h-9 w-9 shrink-0 rounded-lg" style={{ background: `${p.colorway}1A` }} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="tnum text-[12.5px] text-ink-muted">{p.sku}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-ink-soft">{p.category}</td>
                      <td className="tnum px-5 py-3.5 font-medium">{formatCurrency(p.price)}</td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => setStockEdit({ ...p })}
                          className="tnum rounded-md px-2 py-1 font-medium hover:bg-surface-sunken">
                          {formatNumber(p.stock)}
                        </button>
                        {p.stock === 0 ? <Badge tone="critical" className="ml-2">Out</Badge>
                          : p.stock <= p.lowStockThreshold ? <Badge tone="caution" className="ml-2">Low</Badge> : null}
                      </td>
                      <td className="tnum px-5 py-3.5 text-ink-soft">{formatNumber(p.unitsSold)}</td>
                      <td className="px-5 py-3.5">
                        <Badge tone={p.isActive ? 'positive' : 'neutral'}>{p.isActive ? 'Live' : 'Retired'}</Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Link to={`/admin/products/${p._id}/edit`} aria-label={`Edit ${p.name}`}
                            className="rounded-lg p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink">
                            <Pencil className="h-4 w-4" />
                          </Link>
                          {p.isActive ? (
                            <button onClick={() => setPendingDelete(p)} aria-label={`Remove ${p.name}`}
                              className="rounded-lg p-2 text-ink-muted hover:bg-critical-50 hover:text-critical-500">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button onClick={() => restore.mutate(p._id)} aria-label={`Restore ${p.name}`}
                              className="rounded-lg p-2 text-ink-muted hover:bg-surface-sunken hover:text-ink">
                              <RotateCcw className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        {data?.meta && (
          <div className="p-5">
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total}
              onChange={(page) => setFilters({ ...filters, page })} />
          </div>
        )}
      </div>

      <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}
        onConfirm={() => remove.mutate(pendingDelete._id)} loading={remove.isPending}
        title={`Remove ${pendingDelete?.name}?`}
        description="It disappears from the storefront immediately. Past orders keep their record, and you can restore it later."
        confirmLabel="Remove product" />

      <Modal open={Boolean(stockEdit)} onClose={() => setStockEdit(null)} title="Update stock"
        description={stockEdit?.name}
        footer={<>
          <Button variant="secondary" onClick={() => setStockEdit(null)}>Cancel</Button>
          <Button onClick={() => saveStock.mutate()} loading={saveStock.isPending}>Save stock</Button>
        </>}>
        {stockEdit && (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Units in stock</label>
              <Input type="number" min={0} value={stockEdit.stock}
                onChange={(e) => setStockEdit({ ...stockEdit, stock: e.target.value })} />
            </div>
            <div>
              <label className="label">Low-stock alert at</label>
              <Input type="number" min={0} value={stockEdit.lowStockThreshold}
                onChange={(e) => setStockEdit({ ...stockEdit, lowStockThreshold: e.target.value })} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
