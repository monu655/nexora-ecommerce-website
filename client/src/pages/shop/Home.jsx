import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ShieldCheck, Truck, RotateCcw, Headphones } from 'lucide-react';
import { productService } from '@/services/product.service';
import { queryKeys } from '@/lib/queryClient';
import { ProductCard } from '@/components/shop/ProductCard';
import { ProductVisual } from '@/components/shop/ProductVisual';
import { ProductCardSkeleton, ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { formatCurrency } from '@/lib/format';

const categories = [
  { name: 'Audio', copy: 'Headphones, earbuds and speakers' },
  { name: 'Wearables', copy: 'Smartwatches and recovery trackers' },
  { name: 'Keyboards', copy: 'Mechanical boards and keycaps' },
  { name: 'Gaming', copy: 'Mice, headsets and controllers' },
  { name: 'Laptop Accessories', copy: 'Docks, stands and storage' },
  { name: 'Mobile Accessories', copy: 'Charging, cables and mounts' },
];

const promises = [
  { icon: Truck, title: 'Free delivery over ₹4,999', copy: 'Dispatched within 24 hours from Bengaluru and Delhi.' },
  { icon: ShieldCheck, title: '2-year warranty', copy: 'Covered on every Nexora-branded device, no registration needed.' },
  { icon: RotateCcw, title: '14-day returns', copy: 'Changed your mind? Send it back, we arrange the pickup.' },
  { icon: Headphones, title: 'Support that answers', copy: 'Real people, Mon to Sat, 10:00 to 19:00 IST.' },
];

export default function Home() {
  const { addItem } = useCart();
  const featured = useQuery({
    queryKey: queryKeys.products({ featured: true, limit: 8 }),
    queryFn: () => productService.list({ featured: true, limit: 8 }),
  });
  const bestsellers = useQuery({
    queryKey: queryKeys.products({ sort: 'popular', limit: 4 }),
    queryFn: () => productService.list({ sort: 'popular', limit: 4 }),
  });

  const hero = featured.data?.data?.[0];

  return (
    <>
      {/* Hero: the product does the talking, not a gradient. */}
      <section className="border-b border-line bg-surface-sunken">
        <div className="container-page grid items-center gap-10 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div>
            <p className="text-[14px] font-medium text-brand-600">New this season</p>
            <h1 className="mt-3 font-display text-display-lg text-balance">
              Gear that earns its place on your desk
            </h1>
            <p className="mt-5 max-w-lg text-[17px] leading-relaxed text-ink-soft">
              Nexora builds audio, wearables and desk hardware for people who notice the details —
              tuned in-house, warrantied for two years, and shipped across India within 24 hours.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products"><Button size="lg">Shop the catalogue <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/products?category=Audio"><Button size="lg" variant="secondary">Explore audio</Button></Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-line pt-6">
              {[['24', 'products in stock'], ['4.6', 'average rating'], ['48h', 'typical delivery']].map(([v, l]) => (
                <div key={l}>
                  <dt className="tnum font-display text-[24px] font-semibold tracking-[-0.03em]">{v}</dt>
                  <dd className="mt-1 text-[13px] leading-snug text-ink-muted">{l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {hero && (
            <Link to={`/products/${hero.slug}`} className="card overflow-hidden transition-shadow hover:shadow-lift">
              <div className="p-6 pb-0">
                <p className="text-[13px] font-medium text-ink-muted">{hero.category}</p>
                <h2 className="mt-1 font-display text-[22px] font-semibold tracking-[-0.02em]">{hero.name}</h2>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{hero.tagline}</p>
                <p className="tnum mt-4 font-display text-[20px] font-semibold">{formatCurrency(hero.price)}</p>
              </div>
              <div className="mt-4 px-6 pb-6">
                <div className="overflow-hidden rounded-lg border border-line">
                  <ProductVisual product={hero} ratio="aspect-[16/10]" />
                </div>
              </div>
            </Link>
          )}
        </div>
      </section>

      <section className="container-page py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-title">Shop by category</h2>
            <p className="mt-1.5 text-[15px] text-ink-soft">Six focused ranges, no filler.</p>
          </div>
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <Link key={c.name} to={`/products?category=${encodeURIComponent(c.name)}`}
              className="group flex items-center justify-between gap-4 rounded-xl border border-line bg-white p-5 transition-colors hover:border-ink">
              <div>
                <p className="font-display text-[16px] font-semibold">{c.name}</p>
                <p className="mt-1 text-[13.5px] text-ink-soft">{c.copy}</p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-muted transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
            </Link>
          ))}
        </div>
      </section>

      <section className="container-page pb-16">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-title">Featured this month</h2>
          <Link to="/products" className="text-[14px] font-medium text-brand-600 hover:text-brand-700">View all</Link>
        </div>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {featured.isLoading && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          {featured.isError && <div className="sm:col-span-2 lg:col-span-4"><ErrorState onRetry={featured.refetch} /></div>}
          {featured.data?.data?.slice(0, 4).map((p) => (
            <ProductCard key={p._id} product={p} onAddToCart={addItem} />
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-surface-sunken">
        <div className="container-page grid gap-8 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ icon: Icon, title, copy }) => (
            <div key={title}>
              <Icon className="h-5 w-5 text-brand-600" aria-hidden />
              <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-ink-soft">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="font-display text-title">Best sellers</h2>
        <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {bestsellers.isLoading && Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          {bestsellers.data?.data?.map((p) => <ProductCard key={p._id} product={p} onAddToCart={addItem} />)}
        </div>
      </section>
    </>
  );
}