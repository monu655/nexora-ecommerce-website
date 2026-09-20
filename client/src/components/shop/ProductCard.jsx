import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { ProductVisual } from './ProductVisual';
import { Rating } from '@/components/ui/Rating';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import { cn } from '@/lib/cn';

export function ProductCard({ product, onAddToCart, onToggleWishlist, wishlisted }) {
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= (product.lowStockThreshold ?? 10);
  const discount = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;

  return (
    <article className="group card flex flex-col overflow-hidden transition-shadow hover:shadow-lift">
      <div className="relative">
        <Link to={`/products/${product.slug}`} aria-label={product.name}>
          <ProductVisual product={product} />
        </Link>
        <div className="absolute left-3 top-3 flex gap-1.5">
          {discount > 0 && <Badge tone="brand">{discount}% off</Badge>}
          {outOfStock && <Badge tone="neutral">Out of stock</Badge>}
          {lowStock && <Badge tone="caution">Only {product.stock} left</Badge>}
        </div>
        <button
          onClick={() => onToggleWishlist?.(product)}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-pressed={wishlisted}
          className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-ink-soft shadow-card backdrop-blur transition-colors hover:text-critical-500"
        >
          <Heart className={cn('h-4 w-4', wishlisted && 'fill-critical-500 text-critical-500')} />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[12px] font-medium text-ink-muted">{product.category}</p>
        <h3 className="mt-1 font-display text-[15px] font-semibold leading-snug tracking-[-0.01em]">
          <Link to={`/products/${product.slug}`} className="hover:text-brand-600">{product.name}</Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-soft">{product.tagline}</p>

        <div className="mt-3"><Rating value={product.rating} count={product.reviewCount} /></div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            <p className="tnum font-display text-[18px] font-semibold">{formatCurrency(product.price)}</p>
            {discount > 0 && (
              <p className="tnum text-[13px] text-ink-muted line-through">{formatCurrency(product.compareAtPrice)}</p>
            )}
          </div>
          <Button size="sm" variant={outOfStock ? 'secondary' : 'primary'} disabled={outOfStock}
            onClick={() => onAddToCart?.(product)}>
            <ShoppingBag className="h-4 w-4" />
            {outOfStock ? 'Sold out' : 'Add'}
          </Button>
        </div>
      </div>
    </article>
  );
}
