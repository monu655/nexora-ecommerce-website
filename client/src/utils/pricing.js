export const FREE_SHIPPING_THRESHOLD = 4999;
export const SHIPPING_FEE = 149;
export const GST_RATE = 0.18;

/** Mirrors the server calculation so guest carts show the same numbers. */
export function calculateTotals(items = [], discount = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const base = Math.max(subtotal - discount, 0);
  const tax = Math.round(base * GST_RATE);
  const shipping = base >= FREE_SHIPPING_THRESHOLD || base === 0 ? 0 : SHIPPING_FEE;
  return { subtotal, discount, tax, shipping, total: base + tax + shipping };
}
