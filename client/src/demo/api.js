/**
 * Demo transport.
 *
 * The public demo build is a static site with no backend attached, so this
 * module answers the same REST contract the Express API exposes — same routes,
 * same `{ success, message, data, meta }` envelope, same error codes — against
 * an in-memory copy of the seed dataset. Nothing else in the app changes: the
 * services, hooks and pages are identical to the ones that talk to the real
 * API. Set VITE_API_URL to a running server and this module is never loaded.
 */
import dataset from './dataset.json';

const DEEP = (v) => JSON.parse(JSON.stringify(v));
const db = {
  products: DEEP(dataset.products),
  users: DEEP(dataset.users),
  reviews: DEEP(dataset.reviews),
  orders: DEEP(dataset.orders),
  carts: {},
  wishlists: {},
};

const DEMO_PASSWORDS = { 'admin@nexora.store': 'Nexora@2025' };
const DEFAULT_CUSTOMER_PASSWORD = 'Customer@2025';

const FREE_SHIPPING_THRESHOLD = 4999;
const SHIPPING_FEE = 149;
const GST_RATE = 0.18;
const LATENCY = 220;

const oid = () => Array.from({ length: 24 }, () => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
const now = () => new Date().toISOString();

const calculateTotals = (items, discount = 0) => {
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const base = Math.max(subtotal - discount, 0);
  const tax = Math.round(base * GST_RATE);
  const shipping = base >= FREE_SHIPPING_THRESHOLD || base === 0 ? 0 : SHIPPING_FEE;
  return { subtotal, discount, tax, shipping, total: base + tax + shipping };
};

class DemoError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/* ------------------------------ view helpers ------------------------------ */

const withVirtuals = (p) => ({
  ...p,
  stockStatus: p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'in_stock',
  discountPercent: p.compareAtPrice > p.price ? Math.round(((p.compareAtPrice - p.price) / p.compareAtPrice) * 100) : 0,
});

const publicUser = (u) => ({
  id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role,
  avatarColor: u.avatarColor, addresses: u.addresses, createdAt: u.createdAt,
  initials: u.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase(),
});

const findProduct = (id) => db.products.find((p) => p._id === id);

const REVENUE_STATUSES = ['confirmed', 'packed', 'shipped', 'delivered'];
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

const paginate = (rows, page = 1, limit = 12) => {
  const p = Number(page) || 1;
  const l = Number(limit) || 12;
  return {
    items: rows.slice((p - 1) * l, p * l),
    meta: { page: p, limit: l, total: rows.length, totalPages: Math.max(Math.ceil(rows.length / l), 1), hasMore: p * l < rows.length },
  };
};

/* --------------------------------- session -------------------------------- */

const sessions = {};
const issueToken = (user) => {
  const token = `demo.${oid()}`;
  sessions[token] = user._id;
  return token;
};
const currentUser = (headers) => {
  const raw = headers?.Authorization || headers?.authorization;
  const id = raw ? sessions[String(raw).replace('Bearer ', '')] : null;
  const user = id ? db.users.find((u) => u._id === id) : null;
  if (!user) throw new DemoError(401, 'Please sign in to continue');
  return user;
};
const requireAdmin = (headers) => {
  const user = currentUser(headers);
  if (user.role !== 'admin') throw new DemoError(403, 'Admin access only');
  return user;
};

/* ---------------------------------- carts --------------------------------- */

const cartOf = (userId) => (db.carts[userId] ||= []);
const serializeCart = (userId) => {
  const items = cartOf(userId)
    .map((i) => ({ product: withVirtuals(findProduct(i.product)), quantity: i.quantity }))
    .filter((i) => i.product?.isActive)
    .map((i) => ({ ...i, price: i.product.price, lineTotal: i.product.price * i.quantity }));
  return { items, totals: calculateTotals(items.map((i) => ({ price: i.price, quantity: i.quantity }))) };
};

const assertStock = (productId, quantity) => {
  const product = findProduct(productId);
  if (!product || !product.isActive) throw new DemoError(404, 'That product is no longer available');
  if (product.stock < quantity) {
    throw new DemoError(400, product.stock === 0 ? `${product.name} is out of stock` : `Only ${product.stock} left of ${product.name}`);
  }
  return product;
};

/* -------------------------------- analytics ------------------------------- */

const summary = (range) => {
  const start = daysAgo(range);
  const prevStart = daysAgo(range * 2);
  const inWindow = (from, to) => db.orders.filter((o) =>
    REVENUE_STATUSES.includes(o.status) && new Date(o.placedAt) >= from && (!to || new Date(o.placedAt) < to));

  const agg = (rows) => ({ revenue: rows.reduce((s, o) => s + o.pricing.total, 0), orders: rows.length });
  const current = agg(inWindow(start));
  const previous = agg(inWindow(prevStart, start));
  const customers = db.users.filter((u) => u.role === 'customer');
  const prevCustomers = customers.filter((u) => new Date(u.createdAt) < start);
  const delta = (a, b) => (b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 1000) / 10);
  const active = db.products.filter((p) => p.isActive);

  return {
    revenue: { value: current.revenue, change: delta(current.revenue, previous.revenue) },
    orders: { value: current.orders, change: delta(current.orders, previous.orders) },
    customers: { value: customers.length, change: delta(customers.length, prevCustomers.length) },
    products: { value: active.length, lowStock: active.filter((p) => p.stock <= p.lowStockThreshold).length },
    averageOrderValue: {
      value: current.orders ? Math.round(current.revenue / current.orders) : 0,
      change: delta(current.orders ? current.revenue / current.orders : 0, previous.orders ? previous.revenue / previous.orders : 0),
    },
  };
};

const revenueSeries = (range) => {
  const buckets = {};
  db.orders
    .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.placedAt) >= daysAgo(range))
    .forEach((o) => {
      const key = o.placedAt.slice(0, 10);
      buckets[key] ||= { revenue: 0, orders: 0 };
      buckets[key].revenue += o.pricing.total;
      buckets[key].orders += 1;
    });
  const series = [];
  for (let i = range - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    series.push({ date: key, revenue: buckets[key]?.revenue || 0, orders: buckets[key]?.orders || 0 });
  }
  return series;
};

const categoryPerformance = (range = 90) => {
  const rows = {};
  db.orders
    .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.placedAt) >= daysAgo(range))
    .forEach((o) => o.items.forEach((i) => {
      rows[i.category] ||= { category: i.category, revenue: 0, units: 0 };
      rows[i.category].revenue += i.price * i.quantity;
      rows[i.category].units += i.quantity;
    }));
  return Object.values(rows).sort((a, b) => b.revenue - a.revenue);
};

const topProducts = (limit = 6, range = 90) => {
  const rows = {};
  db.orders
    .filter((o) => REVENUE_STATUSES.includes(o.status) && new Date(o.placedAt) >= daysAgo(range))
    .forEach((o) => o.items.forEach((i) => {
      rows[i.product] ||= { _id: i.product, name: i.name, category: i.category, colorway: i.colorway, units: 0, revenue: 0 };
      rows[i.product].units += i.quantity;
      rows[i.product].revenue += i.price * i.quantity;
    }));
  return Object.values(rows).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
};

const statusBreakdown = () => {
  const rows = {};
  db.orders.forEach((o) => { rows[o.status] = (rows[o.status] || 0) + 1; });
  return Object.entries(rows).map(([status, count]) => ({ status, count }));
};

const hydrateOrder = (o) => {
  const user = db.users.find((u) => u._id === o.user);
  return { ...o, user: user ? { _id: user._id, name: user.name, email: user.email, phone: user.phone } : null };
};

const recentOrders = (limit = 8) =>
  [...db.orders].sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt)).slice(0, limit).map(hydrateOrder);

/* --------------------------------- routing -------------------------------- */

const SORTERS = {
  relevance: (a, b) => (b.isFeatured === a.isFeatured ? b.unitsSold - a.unitsSold : b.isFeatured - a.isFeatured),
  newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  popular: (a, b) => b.unitsSold - a.unitsSold,
};

const listProducts = (q, { includeInactive = false } = {}) => {
  let rows = db.products.filter((p) => includeInactive || p.isActive);
  if (q.category && q.category !== 'all') rows = rows.filter((p) => p.category === q.category);
  if (q.featured === true || q.featured === 'true') rows = rows.filter((p) => p.isFeatured);
  if (q.inStock === true || q.inStock === 'true') rows = rows.filter((p) => p.stock > 0);
  if (q.rating) rows = rows.filter((p) => p.rating >= Number(q.rating));
  if (q.minPrice != null && q.minPrice !== '') rows = rows.filter((p) => p.price >= Number(q.minPrice));
  if (q.maxPrice != null && q.maxPrice !== '') rows = rows.filter((p) => p.price <= Number(q.maxPrice));
  if (q.search) {
    const term = String(q.search).trim().toLowerCase();
    rows = rows.filter((p) =>
      [p.name, p.tagline, p.brand, p.category, p.sku, ...(p.tags || [])].join(' ').toLowerCase().includes(term));
  }
  rows = [...rows].sort(SORTERS[q.sort] || SORTERS.relevance);
  const { items, meta } = paginate(rows, q.page, q.limit || 12);
  return { items: items.map(withVirtuals), meta };
};

const ORDER_FLOW = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
};

const transition = (order, status, note) => {
  if (!ORDER_FLOW[order.status]?.includes(status)) {
    throw new DemoError(400, `An order that is ${order.status} cannot move to ${status}`);
  }
  order.status = status;
  order.timeline.push({ status, note, at: now() });
  if (status === 'delivered') order.deliveredAt = now();
  if (status === 'cancelled') {
    order.cancelledAt = now();
    order.cancellationReason = note;
    order.paymentStatus = order.paymentStatus === 'paid' ? 'refunded' : order.paymentStatus;
    order.items.forEach((i) => { const p = findProduct(i.product); if (p) p.stock += i.quantity; });
  }
  return order;
};

const CATEGORIES = ['Audio', 'Wearables', 'Keyboards', 'Gaming', 'Laptop Accessories', 'Mobile Accessories'];

function handle({ method, path, params, body, headers }) {
  const seg = path.split('/').filter(Boolean);

  /* ---------------------------------- auth --------------------------------- */
  if (path === '/health') return { data: { status: 'ok', mode: 'demo' } };

  if (path === '/auth/login' || path === '/auth/admin/login') {
    const user = db.users.find((u) => u.email.toLowerCase() === String(body.email || '').toLowerCase());
    const expected = DEMO_PASSWORDS[user?.email] || DEFAULT_CUSTOMER_PASSWORD;
    if (!user || body.password !== expected) throw new DemoError(401, 'Email or password is incorrect');
    if (path.includes('admin') && user.role !== 'admin') throw new DemoError(403, 'This area is for store administrators');
    return { data: { user: publicUser(user), accessToken: issueToken(user), refreshToken: issueToken(user) }, message: 'Signed in' };
  }

  if (path === '/auth/register') {
    if (db.users.some((u) => u.email.toLowerCase() === String(body.email).toLowerCase())) {
      throw new DemoError(409, 'An account with this email already exists');
    }
    const user = {
      _id: oid(), name: body.name, email: body.email, phone: body.phone, role: 'customer',
      isActive: true, avatarColor: '#1B39C9', addresses: [], createdAt: now(),
    };
    db.users.push(user);
    DEMO_PASSWORDS[user.email] = body.password;
    return { status: 201, data: { user: publicUser(user), accessToken: issueToken(user), refreshToken: issueToken(user) }, message: 'Account created' };
  }

  if (path === '/auth/me') return { data: { user: publicUser(currentUser(headers)) } };
  if (path === '/auth/logout') return { data: null, message: 'Signed out' };

  /* -------------------------------- products ------------------------------- */
  if (path === '/products/facets') {
    return {
      data: {
        categories: CATEGORIES.map((name) => ({ name, count: db.products.filter((p) => p.isActive && p.category === name).length })),
        priceRange: {
          min: Math.min(...db.products.map((p) => p.price)),
          max: Math.max(...db.products.map((p) => p.price)),
        },
      },
    };
  }

  if (method === 'get' && path === '/products') {
    const { items, meta } = listProducts(params || {});
    return { data: items, meta };
  }

  if (seg[0] === 'products' && seg[2] === 'reviews') {
    const productId = seg[1];
    if (method === 'get') {
      const rows = db.reviews.filter((r) => r.product === productId)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return {
        data: {
          reviews: rows,
          distribution: [5, 4, 3, 2, 1].map((star) => ({ star, count: rows.filter((r) => r.rating === star).length })),
          total: rows.length,
        },
      };
    }
    const user = currentUser(headers);
    if (db.reviews.some((r) => r.product === productId && r.user === user._id)) {
      throw new DemoError(409, 'You have already reviewed this product');
    }
    const review = {
      _id: oid(), product: productId, user: user._id, authorName: user.name,
      rating: body.rating, title: body.title, body: body.body,
      isVerifiedPurchase: db.orders.some((o) => o.user === user._id && o.status !== 'cancelled' && o.items.some((i) => i.product === productId)),
      createdAt: now(),
    };
    db.reviews.unshift(review);
    const product = findProduct(productId);
    if (product) {
      const rows = db.reviews.filter((r) => r.product === productId);
      product.reviewCount = rows.length;
      product.rating = Math.round((rows.reduce((s, r) => s + r.rating, 0) / rows.length) * 10) / 10;
    }
    return { status: 201, data: review, message: 'Review posted' };
  }

  if (method === 'get' && seg[0] === 'products' && seg.length === 2) {
    const key = decodeURIComponent(seg[1]);
    const product = db.products.find((p) => p._id === key || p.slug === key);
    if (!product) throw new DemoError(404, 'That product is no longer available');
    const related = db.products
      .filter((p) => p.isActive && p.category === product.category && p._id !== product._id)
      .sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 4).map(withVirtuals);
    return { data: { product: withVirtuals(product), related } };
  }

  /* ---------------------------------- cart --------------------------------- */
  if (seg[0] === 'cart') {
    const user = currentUser(headers);
    const cart = cartOf(user._id);

    if (method === 'get') return { data: serializeCart(user._id) };
    if (method === 'post' && seg[1] === 'items') {
      const { productId, quantity = 1 } = body;
      const existing = cart.find((i) => i.product === productId);
      const next = (existing?.quantity || 0) + quantity;
      if (next > 10) throw new DemoError(400, 'You can order up to 10 units of a product');
      assertStock(productId, next);
      if (existing) existing.quantity = next; else cart.push({ product: productId, quantity });
      return { data: serializeCart(user._id), message: 'Added to cart' };
    }
    if (method === 'post' && seg[1] === 'merge') {
      for (const incoming of body.items || []) {
        const existing = cart.find((i) => i.product === incoming.productId);
        const qty = Math.min((existing?.quantity || 0) + incoming.quantity, 10);
        try {
          assertStock(incoming.productId, qty);
          if (existing) existing.quantity = qty; else cart.push({ product: incoming.productId, quantity: incoming.quantity });
        } catch { /* skip unavailable items */ }
      }
      return { data: serializeCart(user._id), message: 'Cart synced' };
    }
    if (method === 'patch' && seg[1] === 'items') {
      const item = cart.find((i) => i.product === seg[2]);
      if (!item) throw new DemoError(404, 'That item is not in your cart');
      assertStock(seg[2], body.quantity);
      item.quantity = body.quantity;
      return { data: serializeCart(user._id), message: 'Cart updated' };
    }
    if (method === 'delete' && seg[1] === 'items') {
      db.carts[user._id] = cart.filter((i) => i.product !== seg[2]);
      return { data: serializeCart(user._id), message: 'Removed from cart' };
    }
    if (method === 'delete') {
      db.carts[user._id] = [];
      return { data: serializeCart(user._id), message: 'Cart cleared' };
    }
  }

  /* -------------------------------- wishlist ------------------------------- */
  if (seg[0] === 'wishlist') {
    const user = currentUser(headers);
    const list = (db.wishlists[user._id] ||= []);
    const serialize = () => list.map((id) => withVirtuals(findProduct(id))).filter(Boolean);

    if (method === 'get') return { data: serialize() };
    if (method === 'post' && seg[1] === 'toggle') {
      const index = list.indexOf(body.productId);
      const added = index === -1;
      if (added) list.push(body.productId); else list.splice(index, 1);
      return { data: serialize(), message: added ? 'Saved to wishlist' : 'Removed from wishlist' };
    }
    if (method === 'delete') {
      db.wishlists[user._id] = list.filter((id) => id !== seg[1]);
      return { data: db.wishlists[user._id].map((id) => withVirtuals(findProduct(id))), message: 'Removed from wishlist' };
    }
  }

  /* --------------------------------- orders -------------------------------- */
  if (seg[0] === 'orders') {
    const user = currentUser(headers);

    if (method === 'post' && seg[1] === 'checkout') {
      const cart = cartOf(user._id);
      if (!cart.length) throw new DemoError(400, 'Your cart is empty');
      const items = cart.map((line) => {
        const p = assertStock(line.product, line.quantity);
        return { product: p._id, name: p.name, sku: p.sku, category: p.category, colorway: p.colorway, price: p.price, quantity: line.quantity };
      });
      items.forEach((i) => { findProduct(i.product).stock -= i.quantity; });
      const pricing = calculateTotals(items);
      const address = body.address || user.addresses.find((a) => a._id === body.addressId) || user.addresses[0];
      const order = {
        _id: oid(),
        orderNumber: `NX-${new Date().getFullYear().toString().slice(-2)}K${new Date().getMonth() + 1}-${String(db.orders.length + 1).padStart(5, '0')}`,
        user: user._id,
        items,
        shippingAddress: {
          fullName: address?.fullName, phone: address?.phone, line1: address?.line1, line2: address?.line2,
          city: address?.city, state: address?.state, pincode: address?.pincode,
        },
        pricing,
        paymentMethod: body.paymentMethod || 'upi',
        paymentStatus: (body.paymentMethod || 'upi') === 'cod' ? 'pending' : 'paid',
        status: 'pending',
        timeline: [{ status: 'pending', note: 'Order received', at: now() }],
        itemCount: items.reduce((n, i) => n + i.quantity, 0),
        placedAt: now(),
        createdAt: now(),
        deliveredAt: null,
      };
      db.orders.unshift(order);
      db.carts[user._id] = [];
      return { status: 201, data: order, message: `Order ${order.orderNumber} placed` };
    }

    if (method === 'get' && seg.length === 1) {
      let rows = db.orders.filter((o) => o.user === user._id);
      if (params?.status && params.status !== 'all') rows = rows.filter((o) => o.status === params.status);
      rows.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
      const { items, meta } = paginate(rows, params?.page, params?.limit || 10);
      return { data: items, meta };
    }

    const order = db.orders.find((o) => o._id === seg[1] && o.user === user._id);
    if (!order) throw new DemoError(404, 'Order not found');
    if (method === 'get') return { data: order };
    if (method === 'post' && seg[2] === 'cancel') {
      if (['shipped', 'delivered'].includes(order.status)) {
        throw new DemoError(400, 'This order has already shipped. Please request a return instead.');
      }
      return { data: transition(order, 'cancelled', body.reason || 'Cancelled by customer'), message: 'Order cancelled' };
    }
  }

  /* ---------------------------------- users -------------------------------- */
  if (seg[0] === 'users') {
    const user = currentUser(headers);
    if (path === '/users/profile') {
      if (body.name) user.name = body.name;
      if (body.phone !== undefined) user.phone = body.phone;
      return { data: { user: publicUser(user) }, message: 'Profile updated' };
    }
    if (path === '/users/change-password') {
      const expected = DEMO_PASSWORDS[user.email] || DEFAULT_CUSTOMER_PASSWORD;
      if (body.currentPassword !== expected) throw new DemoError(400, 'Your current password is incorrect');
      DEMO_PASSWORDS[user.email] = body.newPassword;
      return { data: null, message: 'Password changed' };
    }
    if (seg[1] === 'addresses') {
      if (method === 'post') {
        const address = { ...body, _id: oid() };
        if (address.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
        if (!user.addresses.length) address.isDefault = true;
        user.addresses.push(address);
        return { data: user.addresses, message: 'Address saved' };
      }
      const target = user.addresses.find((a) => a._id === seg[2]);
      if (!target) throw new DemoError(404, 'Address not found');
      if (method === 'patch') {
        if (body.isDefault) user.addresses.forEach((a) => { a.isDefault = false; });
        Object.assign(target, body);
        return { data: user.addresses, message: 'Address updated' };
      }
      if (method === 'delete') {
        user.addresses = user.addresses.filter((a) => a._id !== seg[2]);
        if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
        return { data: user.addresses, message: 'Address removed' };
      }
    }
  }

  /* ---------------------------------- admin -------------------------------- */
  if (seg[0] === 'admin') {
    requireAdmin(headers);
    const range = Number(params?.range || 30);

    if (path === '/admin/analytics/dashboard') {
      return {
        data: {
          summary: summary(range),
          revenueSeries: revenueSeries(range),
          categories: categoryPerformance(),
          topProducts: topProducts(),
          statusBreakdown: statusBreakdown(),
          recentOrders: recentOrders(),
        },
      };
    }
    if (path === '/admin/analytics/revenue') return { data: revenueSeries(range) };
    if (path === '/admin/analytics/categories') return { data: categoryPerformance() };

    if (seg[1] === 'products') {
      if (method === 'get') {
        const { items, meta } = listProducts({ ...params, limit: params?.limit || 20 }, { includeInactive: true });
        return { data: items, meta };
      }
      if (method === 'post' && seg.length === 2) {
        const product = {
          _id: oid(), brand: 'Nexora', images: [], lowStockThreshold: 10, isActive: true,
          rating: 0, reviewCount: 0, unitsSold: 0, createdAt: now(),
          slug: String(body.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
          ...body,
        };
        db.products.unshift(product);
        return { status: 201, data: withVirtuals(product), message: `${product.name} added to the catalogue` };
      }
      const product = findProduct(seg[2]);
      if (!product) throw new DemoError(404, 'Product not found');
      if (method === 'post' && seg[3] === 'restore') {
        product.isActive = true;
        return { data: withVirtuals(product), message: `${product.name} is live again` };
      }
      if (method === 'patch' && seg[3] === 'stock') {
        product.stock = body.stock;
        if (body.lowStockThreshold != null) product.lowStockThreshold = body.lowStockThreshold;
        return { data: withVirtuals(product), message: 'Stock updated' };
      }
      if (method === 'patch') {
        Object.assign(product, body);
        return { data: withVirtuals(product), message: `${product.name} updated` };
      }
      if (method === 'delete') {
        product.isActive = false;
        return { data: { id: product._id }, message: `${product.name} removed from the storefront` };
      }
    }

    if (seg[1] === 'orders') {
      if (method === 'get' && seg.length === 2) {
        let rows = db.orders.map(hydrateOrder);
        if (params?.status && params.status !== 'all') rows = rows.filter((o) => o.status === params.status);
        if (params?.search) {
          const term = String(params.search).toLowerCase();
          rows = rows.filter((o) =>
            o.orderNumber.toLowerCase().includes(term) ||
            o.user?.name.toLowerCase().includes(term) ||
            o.user?.email.toLowerCase().includes(term));
        }
        rows.sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));
        const { items, meta } = paginate(rows, params?.page, params?.limit || 12);
        return { data: items, meta };
      }
      const order = db.orders.find((o) => o._id === seg[2]);
      if (!order) throw new DemoError(404, 'Order not found');
      if (method === 'get') return { data: hydrateOrder(order) };
      if (method === 'patch' && seg[3] === 'status') {
        transition(order, body.status, body.note);
        return { data: hydrateOrder(order), message: `Order marked ${order.status}` };
      }
    }

    if (seg[1] === 'customers') {
      if (method === 'get') {
        let rows = db.users.filter((u) => u.role === 'customer');
        if (params?.search) {
          const term = String(params.search).toLowerCase();
          rows = rows.filter((u) => `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(term));
        }
        rows = [...rows].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map((u) => {
          const theirs = db.orders.filter((o) => o.user === u._id && o.status !== 'cancelled');
          return {
            ...u,
            orderCount: theirs.length,
            lifetimeValue: theirs.reduce((s, o) => s + o.pricing.total, 0),
            lastOrderAt: theirs.length ? theirs.map((o) => o.placedAt).sort().at(-1) : null,
          };
        });
        const { items, meta } = paginate(rows, params?.page, params?.limit || 12);
        return { data: items, meta };
      }
      if (method === 'patch' && seg[3] === 'status') {
        const customer = db.users.find((u) => u._id === seg[2] && u.role === 'customer');
        if (!customer) throw new DemoError(404, 'Customer not found');
        customer.isActive = body.isActive;
        return { data: customer, message: customer.isActive ? 'Account reactivated' : 'Account deactivated' };
      }
    }
  }

  throw new DemoError(404, 'That request could not be completed');
}

/** Axios adapter: same request/response contract as the live API. */
export function demoAdapter(config) {
  return new Promise((resolve, reject) => {
    const path = (config.url || '').replace(config.baseURL || '', '').split('?')[0].replace(/\/$/, '') || '/';
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : config.data || {};

    setTimeout(() => {
      try {
        const result = handle({
          method: (config.method || 'get').toLowerCase(),
          path: path.startsWith('/') ? path : `/${path}`,
          params: config.params,
          body,
          headers: config.headers,
        });
        resolve({
          status: result.status || 200,
          statusText: 'OK',
          headers: {},
          config,
          data: { success: true, message: result.message || 'OK', data: result.data, meta: result.meta },
        });
      } catch (err) {
        const status = err.status || 500;
        reject(Object.assign(new Error(err.message), {
          config,
          isAxiosError: true,
          response: { status, data: { success: false, message: err.message, details: err.details }, config, headers: {} },
        }));
      }
    }, LATENCY);
  });
}
