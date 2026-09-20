import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE, GST_RATE } from '../config/constants.js';

/**
 * Single source of truth for money. The client shows these numbers, but the
 * server recomputes them at checkout so a tampered cart cannot change a total.
 */
export function calculateTotals(items, discount = 0) {
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const taxableBase = Math.max(subtotal - discount, 0);
  const tax = Math.round(taxableBase * GST_RATE);
  const shipping = taxableBase >= FREE_SHIPPING_THRESHOLD || taxableBase === 0 ? 0 : SHIPPING_FEE;
  const total = taxableBase + tax + shipping;
  return { subtotal, discount, tax, shipping, total };
}

export const formatINR = (paiseFreeAmount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
    .format(paiseFreeAmount);
