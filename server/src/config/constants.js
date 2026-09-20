export const ROLES = Object.freeze({ CUSTOMER: 'customer', ADMIN: 'admin' });

export const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
});

// Status can only move forward through the fulfilment pipeline (or be cancelled
// before it ships). Encoding it here keeps the rule out of the controllers.
export const ORDER_STATUS_FLOW = Object.freeze({
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
  FAILED: 'failed',
});

export const CATEGORIES = Object.freeze([
  'Audio',
  'Wearables',
  'Keyboards',
  'Gaming',
  'Laptop Accessories',
  'Mobile Accessories',
]);

export const FREE_SHIPPING_THRESHOLD = 4999;
export const SHIPPING_FEE = 149;
export const GST_RATE = 0.18;
