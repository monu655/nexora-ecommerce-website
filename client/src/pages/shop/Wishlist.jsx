import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { wishlistService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { ProductCard } from '@/components/shop/ProductCard';
import { EmptyState, ProductCardSkeleton, ErrorState } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/store/toastStore';

export default function Wishlist() {
  const qc = useQueryClient();
  const { addItem } = useCart();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: queryKeys.wishlist, queryFn: wishlistService.get });

  const toggle = useMutation({
    mutationFn: (productId) => wishlistService.toggle(productId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.wishlist }); toast.info('Removed from wishlist'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="container-page py-10">
      <h1 className="font-display text-display">Wishlist</h1>
      <p className="mt-2 text-[15px] text-ink-soft">Saved for later — we will tell you if the price drops.</p>

      <div className="mt-8">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
        ) : isError ? (
          <ErrorState onRetry={refetch} />
        ) : data.length === 0 ? (
          <EmptyState icon={Heart} title="Nothing saved yet"
            description="Tap the heart on any product to keep it here for later."
            action={<Link to="/products"><Button>Browse products</Button></Link>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {data.map((p) => (
              <ProductCard key={p._id} product={p} wishlisted onAddToCart={addItem}
                onToggleWishlist={() => toggle.mutate(p._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
