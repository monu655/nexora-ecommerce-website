import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart, ShoppingBag, Zap, Truck, ShieldCheck, RotateCcw, Check } from 'lucide-react';
import { productService } from '@/services/product.service';
import { wishlistService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { ProductVisual } from '@/components/shop/ProductVisual';
import { ProductCard } from '@/components/shop/ProductCard';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Field, Textarea, Input, Select } from '@/components/ui/Field';
import { Skeleton, ErrorState, EmptyState } from '@/components/ui/States';
import { useCart } from '@/hooks/useCart';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { formatCurrency, formatDate } from '@/lib/format';

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { addItem } = useCart();
  const authenticated = useAuthStore((s) => Boolean(s.accessToken));
  const [quantity, setQuantity] = useState(1);
  const [tab, setTab] = useState('overview');
  const [buying, setBuying] = useState(false);

  // When the user opens another product (e.g. from "More in ..."), start fresh at the top.
  useEffect(() => {
    setQuantity(1);
    setTab('overview');
    window.scrollTo({ top: 0 });
  }, [slug]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: queryKeys.product(slug),
    queryFn: () => productService.detail(slug),
  });

  const product = data?.product;
  const reviews = useQuery({
    queryKey: queryKeys.reviews(product?._id),
    queryFn: () => productService.reviews(product._id),
    enabled: Boolean(product?._id),
  });

  const wishlist = useMutation({
    mutationFn: () => wishlistService.toggle(product._id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.wishlist }); toast.success('Wishlist updated'); },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError) return <div className="container-page py-16"><ErrorState message={error?.message} onRetry={refetch} /></div>;
  if (!product) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="Product not found"
          description="This product may have been removed or the link is incorrect."
          action={<Link to="/products"><Button variant="secondary">Browse all products</Button></Link>}
        />
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  const buyNow = async () => {
    if (outOfStock || buying) return;
    setBuying(true);
    try {
      await addItem(product, quantity);
      navigate('/checkout');
    } catch (e) {
      toast.error(e?.message || 'Could not start checkout');
    } finally {
      setBuying(false);
    }
  };

  return (
    <div className="container-page py-8">
      <nav className="mb-6 flex items-center gap-1.5 text-[13px] text-ink-muted" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-ink">Home</Link><span>/</span>
        <Link to={`/products?category=${encodeURIComponent(product.category)}`} className="hover:text-ink">{product.category}</Link>
        <span>/</span><span className="truncate text-ink-soft">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div>
          <div className="overflow-hidden rounded-2xl border border-line">
            <ProductVisual product={product} ratio="aspect-square" />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="overflow-hidden rounded-lg border border-line opacity-70">
                <ProductVisual product={product} ratio="aspect-square" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="neutral">{product.category}</Badge>
            {product.discountPercent > 0 && <Badge tone="brand">{product.discountPercent}% off</Badge>}
            {product.stockStatus === 'low_stock' && <Badge tone="caution">Only {product.stock} left</Badge>}
            {outOfStock && <Badge tone="critical">Out of stock</Badge>}
          </div>

          <h1 className="mt-3 font-display text-display tracking-[-0.03em]">{product.name}</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink-soft">{product.tagline}</p>

          <div className="mt-4 flex items-center gap-3">
            <Rating value={product.rating} />
            <Link to="#reviews" onClick={() => setTab('reviews')} className="text-[14px] text-brand-600 hover:underline">
              {product.reviewCount} reviews
            </Link>
            <span className="text-[14px] text-ink-muted">SKU {product.sku}</span>
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="tnum font-display text-[32px] font-semibold tracking-[-0.03em]">{formatCurrency(product.price)}</p>
            {product.compareAtPrice > product.price && (
              <p className="tnum text-[17px] text-ink-muted line-through">{formatCurrency(product.compareAtPrice)}</p>
            )}
          </div>
          <p className="mt-1 text-[13px] text-ink-muted">Inclusive of all taxes</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center rounded-lg border border-line-strong">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-full w-11 text-[18px] text-ink-soft hover:bg-surface-sunken" aria-label="Decrease quantity">−</button>
              <span className="tnum w-10 text-center text-[15px] font-medium">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(10, product.stock, q + 1))} className="h-full w-11 text-[18px] text-ink-soft hover:bg-surface-sunken" aria-label="Increase quantity">+</button>
            </div>
            <Button size="lg" disabled={outOfStock} onClick={() => addItem(product, quantity)} className="flex-1 sm:flex-none">
              <ShoppingBag className="h-4 w-4" /> {outOfStock ? 'Out of stock' : 'Add to cart'}
            </Button>
            <Button size="lg" variant="secondary" disabled={outOfStock} loading={buying} onClick={buyNow} className="flex-1 sm:flex-none">
              <Zap className="h-4 w-4" /> Buy now
            </Button>
            <Button size="lg" variant="secondary" aria-label="Save to wishlist" loading={wishlist.isPending}
              onClick={() => (authenticated ? wishlist.mutate() : toast.info('Sign in to save items to your wishlist'))}>
              <Heart className="h-4 w-4" />
            </Button>
          </div>

          <ul className="mt-8 grid gap-3 border-t border-line pt-6 text-[14px] text-ink-soft sm:grid-cols-3">
            <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-ink-muted" /> Ships in 24h</li>
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-ink-muted" /> 2-year warranty</li>
            <li className="flex items-center gap-2"><RotateCcw className="h-4 w-4 text-ink-muted" /> 14-day returns</li>
          </ul>
        </div>
      </div>

      <section id="reviews" className="mt-14">
        <div className="flex gap-1 border-b border-line">
          {[['overview', 'Overview'], ['specs', 'Specifications'], ['reviews', `Reviews (${product.reviewCount})`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-4 py-3 text-[14px] font-medium transition-colors ${
                tab === id ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink-soft'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="py-8">
          {tab === 'overview' && (
            <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
              <p className="max-w-[68ch] text-[15.5px] leading-relaxed text-ink-soft">{product.description}</p>
              <ul className="space-y-2.5">
                {product.highlights?.map((h) => (
                  <li key={h} className="flex gap-2.5 text-[14.5px] text-ink-soft">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-positive-500" /> {h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'specs' && (
            <dl className="max-w-2xl divide-y divide-line rounded-xl border border-line">
              {Object.entries(product.specs || {}).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[160px_1fr] gap-4 px-5 py-3.5">
                  <dt className="text-[14px] text-ink-muted">{k}</dt>
                  <dd className="text-[14px] font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          )}

          {tab === 'reviews' && <ReviewsPanel product={product} reviews={reviews} authenticated={authenticated} />}
        </div>
      </section>

      {data.related?.length > 0 && (
        <section className="mt-6">
          <h2 className="font-display text-title">More in {product.category}</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.related.map((p) => <ProductCard key={p._id} product={p} onAddToCart={addItem} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function ReviewsPanel({ product, reviews, authenticated }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ rating: 5, title: '', body: '' });
  const [errors, setErrors] = useState({});

  const mutation = useMutation({
    mutationFn: () => productService.addReview(product._id, form),
    onSuccess: () => {
      toast.success('Thanks — your review is live');
      setForm({ rating: 5, title: '', body: '' });
      qc.invalidateQueries({ queryKey: queryKeys.reviews(product._id) });
      qc.invalidateQueries({ queryKey: queryKeys.product(product.slug) });
    },
    onError: (e) => {
      setErrors(Object.fromEntries((e.details || []).map((d) => [d.field, d.message])));
      toast.error(e.message);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    if (form.body.trim().length < 10) return setErrors({ body: 'Tell us a little more — at least 10 characters.' });
    setErrors({});
    mutation.mutate();
  };

  if (reviews.isLoading) return <Skeleton className="h-40 w-full" />;
  const list = reviews.data?.reviews ?? [];

  return (
    <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr]">
      <div>
        {list.length === 0 ? (
          <EmptyState title="No reviews yet" description="Be the first to tell other shoppers how this performs." />
        ) : (
          <ul className="divide-y divide-line">
            {list.map((r) => (
              <li key={r._id} className="py-5 first:pt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <Rating value={r.rating} showValue={false} />
                  <span className="text-[14px] font-semibold">{r.title}</span>
                  {r.isVerifiedPurchase && <Badge tone="positive">Verified purchase</Badge>}
                </div>
                <p className="mt-2 max-w-[68ch] text-[14.5px] leading-relaxed text-ink-soft">{r.body}</p>
                <p className="mt-2 text-[13px] text-ink-muted">{r.authorName} · {formatDate(r.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card h-fit p-5">
        <h3 className="font-display text-[17px] font-semibold">Write a review</h3>
        {!authenticated ? (
          <>
            <p className="mt-2 text-[14px] text-ink-soft">Sign in to share your experience with this product.</p>
            <Link to="/login"><Button className="mt-4 w-full" variant="secondary">Sign in</Button></Link>
          </>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-4">
            <Field label="Rating">
              <Select value={form.rating} onChange={(e) => setForm({ ...form, rating: Number(e.target.value) })}>
                {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} star{r > 1 ? 's' : ''}</option>)}
              </Select>
            </Field>
            <Field label="Headline">
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Sums up your experience" maxLength={120} />
            </Field>
            <Field label="Your review" error={errors.body} required>
              <Textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })}
                placeholder="What worked, what did not, and who you would recommend it to." error={errors.body} />
            </Field>
            <Button type="submit" className="w-full" loading={mutation.isPending}>Post review</Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ProductDetailSkeleton() {
  return (
    <div className="container-page grid gap-10 py-10 lg:grid-cols-2">
      <Skeleton className="aspect-square rounded-2xl" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" /><Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-5 w-1/2" /><Skeleton className="h-9 w-40" />
        <Skeleton className="h-12 w-full" /><Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}