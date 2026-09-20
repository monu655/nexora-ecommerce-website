import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cartService } from '@/services/commerce.service';
import { queryKeys } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import { useGuestCartStore } from '@/store/cartStore';
import { toast } from '@/store/toastStore';
import { calculateTotals } from '@/utils/pricing';

/**
 * One cart interface for the whole app. Signed-in users hit the API;
 * guests work against local state with the same shape, so components
 * never branch on authentication.
 */
export function useCart() {
  const authenticated = useAuthStore((s) => Boolean(s.accessToken));
  const guest = useGuestCartStore();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.cart,
    queryFn: cartService.get,
    enabled: authenticated,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: queryKeys.cart });

  const addMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartService.add(productId, quantity),
    onSuccess: () => { invalidate(); toast.success('Added to cart'); },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ productId, quantity }) => cartService.update(productId, quantity),
    onSuccess: invalidate,
    onError: (e) => toast.error(e.message),
  });

  const removeMutation = useMutation({
    mutationFn: (productId) => cartService.remove(productId),
    onSuccess: () => { invalidate(); toast.info('Removed from cart'); },
    onError: (e) => toast.error(e.message),
  });

  const guestItems = guest.items.map((i) => ({
    product: i.product,
    quantity: i.quantity,
    price: i.product.price,
    lineTotal: i.product.price * i.quantity,
  }));

  const items = authenticated ? query.data?.items ?? [] : guestItems;
  const totals = authenticated
    ? query.data?.totals ?? calculateTotals([])
    : calculateTotals(guestItems);

  return {
    items,
    totals,
    count: items.reduce((n, i) => n + i.quantity, 0),
    isLoading: authenticated && query.isLoading,
    isError: query.isError,
    addItem: (product, quantity = 1) => {
      if (!authenticated) {
        if (product.stock <= 0) return toast.error(`${product.name} is out of stock`);
        guest.add(product, quantity);
        return toast.success('Added to cart');
      }
      addMutation.mutate({ productId: product.id || product._id, quantity });
    },
    updateItem: (productId, quantity) =>
      authenticated ? updateMutation.mutate({ productId, quantity }) : guest.update(productId, quantity),
    removeItem: (productId) =>
      authenticated ? removeMutation.mutate(productId) : (guest.remove(productId), toast.info('Removed from cart')),
    isMutating: addMutation.isPending || updateMutation.isPending || removeMutation.isPending,
  };
}
