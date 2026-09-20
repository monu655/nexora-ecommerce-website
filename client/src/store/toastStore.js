import { create } from 'zustand';

let counter = 0;

export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++counter;
    set({ toasts: [...get().toasts, { id, duration: 4000, ...toast }] });
    setTimeout(() => get().dismiss(id), toast.duration ?? 4000);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

// Imperative helper so services and mutations can raise a toast without hooks.
export const toast = {
  success: (message, title) => useToastStore.getState().push({ variant: 'success', message, title }),
  error: (message, title) => useToastStore.getState().push({ variant: 'error', message, title, duration: 6000 }),
  info: (message, title) => useToastStore.getState().push({ variant: 'info', message, title }),
};
