import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Guest cart. Signed-in carts live on the server; this keeps a visitor's
 * selections through a refresh and is merged into their account at sign-in.
 */
export const useGuestCartStore = create()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, quantity = 1) => {
        const items = [...get().items];
        const existing = items.find((i) => i.productId === product.id);
        if (existing) existing.quantity = Math.min(existing.quantity + quantity, 10);
        else items.push({ productId: product.id, quantity, product });
        set({ items });
      },
      update: (productId, quantity) =>
        set({ items: get().items.map((i) => (i.productId === productId ? { ...i, quantity } : i)) }),
      remove: (productId) => set({ items: get().items.filter((i) => i.productId !== productId) }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.quantity, 0),
    }),
    { name: 'nexora.guest-cart' }
  )
);

export const useUiStore = create((set) => ({
  cartDrawerOpen: false,
  mobileNavOpen: false,
  adminSidebarOpen: false,
  setCartDrawer: (cartDrawerOpen) => set({ cartDrawerOpen }),
  setMobileNav: (mobileNavOpen) => set({ mobileNavOpen }),
  setAdminSidebar: (adminSidebarOpen) => set({ adminSidebarOpen }),
}));
