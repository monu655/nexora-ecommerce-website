import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { adminService } from '@/services/admin.service';
import { productService } from '@/services/product.service';
import { Field, Input, Textarea, Select } from '@/components/ui/Field';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/States';
import { toast } from '@/store/toastStore';

const CATEGORIES = ['Audio', 'Wearables', 'Keyboards', 'Gaming', 'Laptop Accessories', 'Mobile Accessories'];

const blank = {
  name: '', sku: '', tagline: '', description: '', category: 'Audio', brand: 'Nexora',
  price: '', compareAtPrice: '', stock: '', lowStockThreshold: 10, colorway: '#1B39C9',
  highlights: '', tags: '', isFeatured: false, isActive: true,
};

export default function ProductForm() {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState(blank);
  const [errors, setErrors] = useState({});

  const existing = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: () => productService.detail(id),
    enabled: editing,
  });

  useEffect(() => {
    const p = existing.data?.product;
    if (!p) return;
    setForm({
      ...blank, ...p,
      compareAtPrice: p.compareAtPrice ?? '',
      highlights: (p.highlights || []).join('\n'),
      tags: (p.tags || []).join(', '),
    });
  }, [existing.data]);

  const payload = () => ({
    name: form.name.trim(), sku: form.sku.trim().toUpperCase(), tagline: form.tagline.trim(),
    description: form.description.trim(), category: form.category, brand: form.brand.trim(),
    price: Number(form.price), stock: Number(form.stock),
    lowStockThreshold: Number(form.lowStockThreshold) || 10, colorway: form.colorway,
    ...(form.compareAtPrice ? { compareAtPrice: Number(form.compareAtPrice) } : {}),
    highlights: form.highlights.split('\n').map((s) => s.trim()).filter(Boolean),
    tags: form.tags.split(',').map((s) => s.trim()).filter(Boolean),
    isFeatured: form.isFeatured, isActive: form.isActive,
  });

  const mutation = useMutation({
    mutationFn: () => (editing ? adminService.updateProduct(id, payload()) : adminService.createProduct(payload())),
    onSuccess: (product) => {
      qc.invalidateQueries({ queryKey: ['admin'] });
      toast.success(editing ? `${product.name} updated` : `${product.name} added to the catalogue`);
      navigate('/admin/products');
    },
    onError: (e) => {
      setErrors(Object.fromEntries((e.details || []).map((d) => [d.field, d.message])));
      toast.error(e.message);
    },
  });

  const validate = () => {
    const next = {};
    if (form.name.trim().length < 3) next.name = 'Product name is too short';
    if (form.sku.trim().length < 3) next.sku = 'Enter a SKU';
    if (form.description.trim().length < 20) next.description = 'Add at least 20 characters';
    if (!(Number(form.price) > 0)) next.price = 'Price must be greater than zero';
    if (form.stock === '' || Number(form.stock) < 0) next.stock = 'Stock cannot be negative';
    if (form.compareAtPrice && Number(form.compareAtPrice) <= Number(form.price)) {
      next.compareAtPrice = 'Compare-at price must be higher than the selling price';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (editing && existing.isLoading) return <Skeleton className="h-96 w-full" />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/admin/products" className="inline-flex items-center gap-1.5 text-[14px] text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Products
      </Link>

      <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em]">
        {editing ? 'Edit product' : 'Add a product'}
      </h1>

      <form onSubmit={(e) => { e.preventDefault(); if (validate()) mutation.mutate(); }} className="space-y-6">
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Basics</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Product name" error={errors.name} required className="sm:col-span-2">
              <Input value={form.name} onChange={set('name')} error={errors.name} placeholder="Nexora Pulse X1" />
            </Field>
            <Field label="SKU" error={errors.sku} required>
              <Input value={form.sku} onChange={set('sku')} error={errors.sku} placeholder="NX-AUD-PX1" />
            </Field>
            <Field label="Category" required>
              <Select value={form.category} onChange={set('category')}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </Select>
            </Field>
            <Field label="Tagline" hint="One line shown on the product card" className="sm:col-span-2">
              <Input value={form.tagline} onChange={set('tagline')} placeholder="Wireless ANC headphones with 40h playback" />
            </Field>
            <Field label="Description" error={errors.description} required className="sm:col-span-2">
              <Textarea value={form.description} onChange={set('description')} error={errors.description}
                placeholder="What it is, who it is for, and what makes it worth the price." />
            </Field>
          </div>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Pricing and stock</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Selling price (₹)" error={errors.price} required>
              <Input type="number" min={1} value={form.price} onChange={set('price')} error={errors.price} />
            </Field>
            <Field label="Compare-at price (₹)" error={errors.compareAtPrice} hint="Optional">
              <Input type="number" min={0} value={form.compareAtPrice} onChange={set('compareAtPrice')} error={errors.compareAtPrice} />
            </Field>
            <Field label="Units in stock" error={errors.stock} required>
              <Input type="number" min={0} value={form.stock} onChange={set('stock')} error={errors.stock} />
            </Field>
            <Field label="Low-stock alert at">
              <Input type="number" min={0} value={form.lowStockThreshold} onChange={set('lowStockThreshold')} />
            </Field>
            <Field label="Card colour" hint="Used for the catalogue visual">
              <Input type="color" value={form.colorway} onChange={set('colorway')} className="h-11 p-1" />
            </Field>
          </div>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-[17px] font-semibold">Merchandising</h2>
          <Field label="Highlights" hint="One per line">
            <Textarea value={form.highlights} onChange={set('highlights')}
              placeholder={'Adaptive ANC with transparency mode\n40 hours playback'} />
          </Field>
          <Field label="Tags" hint="Comma separated — used by search">
            <Input value={form.tags} onChange={set('tags')} placeholder="headphones, anc, travel" />
          </Field>
          <div className="flex flex-wrap gap-6 pt-1">
            <label className="flex items-center gap-2.5 text-[14px] text-ink-soft">
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-brand-600 focus:ring-brand-600" />
              Feature on the home page
            </label>
            <label className="flex items-center gap-2.5 text-[14px] text-ink-soft">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-line-strong text-brand-600 focus:ring-brand-600" />
              Visible on the storefront
            </label>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <Link to="/admin/products"><Button variant="secondary" type="button">Cancel</Button></Link>
          <Button type="submit" loading={mutation.isPending}>{editing ? 'Save changes' : 'Add product'}</Button>
        </div>
      </form>
    </div>
  );
}
