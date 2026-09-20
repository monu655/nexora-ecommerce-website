import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Session state. Only the access token and a public user projection are
 * persisted — never a password, and never anything the API would not return.
 */
export const useAuthStore = create()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,

      signIn: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      signOut: () => set({ user: null, accessToken: null, refreshToken: null }),

      isAuthenticated: () => Boolean(get().accessToken),
      isAdmin: () => get().user?.role === 'admin',
    }),
    { name: 'nexora.session', partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }) }
  )
);
