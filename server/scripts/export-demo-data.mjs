/**
 * Builds the static dataset used by the read-only public demo build of the
 * storefront (`npm run build:demo` in /client). It reuses the same seed data
 * the API ships with, so the demo and a live deployment show identical content.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import slugify from 'slugify';
import { catalog } from '../src/seed/catalog.js';
import { customers, reviewSeeds } from '../src/seed/people.js';
import { calculateTotals } from '../src/utils/pricing.js';

const oid = () => randomBytes(12).toString('hex');
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (a) => a[rand(0, a.length - 1)];
const pickMany = (a, n) => [...a].sort(() => Math.random() - 0.5).slice(0, n);
const DAYS = 90;

const products = catalog.map((p) => ({
  _id: oid(),
  slug: slugify(p.name, { lower: true, strict: true }),
  brand: 'Nexora',
  images: [],
  lowStockThreshold: 10,
  isActive: true,
  isFeatured: Boolean(p.isFeatured),
  reviewCount: 0,
  ...p,
  createdAt: new Date(Date.now() - rand(20, 300) * 864e5).toISOString(),
}));

const users = customers.map((c) => ({
  _id: oid(),
  name: c.name,
  email: c.email,
  phone: c.phone,
  role: 'customer',
  isActive: true,
  avatarColor: c.avatarColor,
  addresses: [{
    _id: oid(), label: 'home', fullName: c.name, phone: c.phone, line1: c.line1,
    city: c.city, state: c.state, pincode: c.pincode, isDefault: true,
  }],
  createdAt: new Date(Date.now() - rand(5, 180) * 864e5).toISOString(),
}));

const reviews = [];
for (const product of products) {
  for (const reviewer of pickMany(users, rand(2, 5))) {
    const seed = pick(reviewSeeds);
    reviews.push({
      _id: oid(), product: product._id, user: reviewer._id, authorName: reviewer.name,
      rating: Math.random() > 0.15 ? seed.rating : Math.max(3, seed.rating - 1),
      title: seed.title, body: seed.body,
      isVerifiedPurchase: Math.random() > 0.25,
      createdAt: new Date(Date.now() - rand(1, 80) * 864e5).toISOString(),
    });
  }
}
for (const product of products) {
  product.reviewCount = reviews.filter((r) => r.product === product._id).length;
}

const ordersForDay = (date, dayIndex) => {
  const dow = date.getDay();
  const weekendLift = dow === 0 || dow === 6 ? 1.6 : 1;
  const recencyLift = 1 + (dayIndex / DAYS) * 0.7;
  const payday = date.getDate() <= 5 ? 1.3 : 1;
  return Math.max(0, Math.round(rand(1, 4) * weekendLift * recencyLift * payday));
};

const orders = [];
let sequence = 1;
for (let d = DAYS - 1; d >= 0; d--) {
  const day = new Date(Date.now() - d * 864e5);
  for (let n = 0; n < ordersForDay(day, DAYS - d); n++) {
    const customer = pick(users);
    const address = customer.addresses[0];
    const items = pickMany(products.filter((p) => p.stock > 0), rand(1, 3)).map((p) => ({
      product: p._id, name: p.name, sku: p.sku, category: p.category, image: p.images?.[0],
      colorway: p.colorway, price: p.price, quantity: rand(1, 2),
    }));
    const pricing = calculateTotals(items);
    const placedAt = new Date(day);
    placedAt.setHours(rand(8, 23), rand(0, 59), 0, 0);

    let status = 'delivered';
    if (d < 2) status = pick(['pending', 'confirmed', 'packed']);
    else if (d < 5) status = pick(['confirmed', 'packed', 'shipped']);
    else if (d < 9) status = pick(['shipped', 'delivered']);
    if (Math.random() < 0.05) status = 'cancelled';

    const paymentMethod = pick(['upi', 'upi', 'card', 'netbanking', 'cod']);
    const timeline = [{ status: 'pending', note: 'Order received', at: placedAt.toISOString() }];
    const flow = ['pending', 'confirmed', 'packed', 'shipped', 'delivered'];
    if (status === 'cancelled') {
      timeline.push({ status: 'cancelled', note: 'Cancelled before dispatch', at: new Date(placedAt.getTime() + 36e5).toISOString() });
    } else {
      for (const s of flow.slice(1, flow.indexOf(status) + 1)) {
        timeline.push({ status: s, at: new Date(placedAt.getTime() + (flow.indexOf(s)) * 20 * 36e5).toISOString() });
      }
    }

    orders.push({
      _id: oid(),
      orderNumber: `NX-${placedAt.getFullYear().toString().slice(-2)}K${placedAt.getMonth() + 1}-${String(sequence++).padStart(5, '0')}`,
      user: customer._id,
      items,
      shippingAddress: {
        fullName: address.fullName, phone: address.phone, line1: address.line1,
        city: address.city, state: address.state, pincode: address.pincode,
      },
      pricing,
      paymentMethod,
      paymentStatus: status === 'cancelled' ? 'refunded'
        : paymentMethod === 'cod' && status !== 'delivered' ? 'pending' : 'paid',
      status,
      timeline,
      itemCount: items.reduce((n, i) => n + i.quantity, 0),
      placedAt: placedAt.toISOString(),
      createdAt: placedAt.toISOString(),
      deliveredAt: status === 'delivered' ? new Date(placedAt.getTime() + rand(2, 5) * 864e5).toISOString() : null,
    });
  }
}

const sold = {};
for (const o of orders) {
  if (o.status === 'cancelled') continue;
  for (const i of o.items) sold[i.product] = (sold[i.product] || 0) + i.quantity;
}
for (const p of products) if (sold[p._id]) p.unitsSold = sold[p._id];

const admin = {
  _id: oid(), name: 'Aarav Malhotra', email: 'admin@nexora.store', phone: '+91 98765 43210',
  role: 'admin', isActive: true, avatarColor: '#1B39C9', addresses: [],
  createdAt: new Date(Date.now() - 400 * 864e5).toISOString(),
};

const out = new URL('../../client/src/demo/dataset.json', import.meta.url);
mkdirSync(new URL('../../client/src/demo/', import.meta.url), { recursive: true });
writeFileSync(out, JSON.stringify({ products, users: [admin, ...users], reviews, orders }));
console.log(`[demo] ${products.length} products, ${users.length + 1} users, ${reviews.length} reviews, ${orders.length} orders`);
