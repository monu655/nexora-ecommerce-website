/**
 * Seeds a realistic demo dataset: staff, customers, catalogue, reviews and
 * ~90 days of order history so the dashboard renders with meaningful trends.
 *
 *   npm run seed          # upsert, keeps existing data
 *   npm run seed:fresh    # wipe collections first
 */
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Wishlist } from '../models/Wishlist.js';
import { Review } from '../models/Review.js';
import { catalog } from './catalog.js';
import { customers, reviewSeeds } from './people.js';
import { calculateTotals } from '../utils/pricing.js';
import { ROLES, ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const FRESH = process.argv.includes('--fresh');
const DAYS = 90;

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const pickMany = (arr, n) => [...arr].sort(() => Math.random() - 0.5).slice(0, n);

/** Weekends and the last fortnight see more traffic — gives the charts shape. */
function ordersForDay(date, dayIndex) {
  const dow = date.getDay();
  const weekendLift = dow === 0 || dow === 6 ? 1.6 : 1;
  const recencyLift = 1 + (dayIndex / DAYS) * 0.7;
  const payday = date.getDate() <= 5 ? 1.3 : 1;
  return Math.max(0, Math.round(rand(1, 4) * weekendLift * recencyLift * payday));
}

async function run() {
  await connectDatabase();

  if (FRESH) {
    await Promise.all([
      User.deleteMany({}), Product.deleteMany({}), Order.deleteMany({}),
      Cart.deleteMany({}), Wishlist.deleteMany({}), Review.deleteMany({}),
    ]);
    console.log('[seed] collections cleared');
  }

  /* ----------------------------- staff + users ---------------------------- */
  const staff = [
    { name: 'Aarav Malhotra', email: env.seed.adminEmail, password: env.seed.adminPassword, role: ROLES.ADMIN, phone: '+91 98765 43210', avatarColor: '#1B39C9' },
  ];

  const userDocs = [];
  for (const s of staff) {
    const existing = await User.findOne({ email: s.email });
    if (existing) { userDocs.push(existing); continue; }
    userDocs.push(await User.create(s));
  }

  const customerDocs = [];
  for (const [i, c] of customers.entries()) {
    let user = await User.findOne({ email: c.email });
    if (!user) {
      user = await User.create({
        name: c.name,
        email: c.email,
        phone: c.phone,
        password: c.email === env.seed.customerEmail ? env.seed.customerPassword : 'Customer@2025',
        role: ROLES.CUSTOMER,
        avatarColor: c.avatarColor,
        addresses: [{
          label: 'home', fullName: c.name, phone: c.phone, line1: c.line1,
          city: c.city, state: c.state, pincode: c.pincode, isDefault: true,
        }],
        // Backdate sign-ups so "new customers" trends are not all today.
        createdAt: new Date(Date.now() - rand(5, 180) * 864e5),
      });
    }
    customerDocs.push(user);
    await Cart.findOneAndUpdate({ user: user._id }, { $setOnInsert: { items: [] } }, { upsert: true });
    await Wishlist.findOneAndUpdate(
      { user: user._id },
      { $setOnInsert: { products: [] } },
      { upsert: true }
    );
    if (i % 5 === 0) process.stdout.write('.');
  }
  console.log(`\n[seed] ${customerDocs.length} customers ready`);

  /* ------------------------------- catalogue ------------------------------ */
  const productDocs = [];
  for (const item of catalog) {
    let product = await Product.findOne({ sku: item.sku });
    if (product) { Object.assign(product, item); await product.save(); }
    else product = await Product.create(item);
    productDocs.push(product);
  }
  console.log(`[seed] ${productDocs.length} products ready`);

  /* -------------------------------- reviews ------------------------------- */
  if ((await Review.estimatedDocumentCount()) === 0) {
    let count = 0;
    for (const product of productDocs) {
      const reviewers = pickMany(customerDocs, rand(2, 5));
      for (const reviewer of reviewers) {
        const seed = pick(reviewSeeds);
        await Review.create({
          product: product._id,
          user: reviewer._id,
          authorName: reviewer.name,
          rating: Math.random() > 0.15 ? seed.rating : Math.max(3, seed.rating - 1),
          title: seed.title,
          body: seed.body,
          isVerifiedPurchase: Math.random() > 0.25,
          createdAt: new Date(Date.now() - rand(1, 80) * 864e5),
        });
        count++;
      }
    }
    console.log(`[seed] ${count} reviews written`);
  }

  /* ------------------------------ order history --------------------------- */
  if ((await Order.estimatedDocumentCount()) === 0) {
    const bulk = [];
    let sequence = 1;

    for (let d = DAYS - 1; d >= 0; d--) {
      const day = new Date(Date.now() - d * 864e5);
      for (let n = 0; n < ordersForDay(day, DAYS - d); n++) {
        const customer = pick(customerDocs);
        const address = customer.addresses[0];
        const lineItems = pickMany(productDocs, rand(1, 3)).map((p) => ({
          product: p._id, name: p.name, sku: p.sku, image: p.images?.[0],
          category: p.category, price: p.price, quantity: rand(1, 2),
        }));
        const pricing = calculateTotals(lineItems);
        const placedAt = new Date(day);
        placedAt.setHours(rand(8, 23), rand(0, 59), 0, 0);

        // Older orders have progressed further through fulfilment.
        let status = ORDER_STATUS.DELIVERED;
        if (d < 2) status = pick([ORDER_STATUS.PENDING, ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED]);
        else if (d < 5) status = pick([ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED]);
        else if (d < 9) status = pick([ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED]);
        if (Math.random() < 0.05) status = ORDER_STATUS.CANCELLED;

        const paymentMethod = pick(['upi', 'upi', 'card', 'netbanking', 'cod']);
        bulk.push({
          orderNumber: `NX-${placedAt.getFullYear().toString().slice(-2)}K${placedAt.getMonth() + 1}-${String(sequence++).padStart(5, '0')}`,
          user: customer._id,
          items: lineItems,
          shippingAddress: {
            fullName: address.fullName, phone: address.phone, line1: address.line1,
            city: address.city, state: address.state, pincode: address.pincode,
          },
          pricing,
          paymentMethod,
          paymentStatus: status === ORDER_STATUS.CANCELLED
            ? PAYMENT_STATUS.REFUNDED
            : paymentMethod === 'cod' && status !== ORDER_STATUS.DELIVERED
              ? PAYMENT_STATUS.PENDING
              : PAYMENT_STATUS.PAID,
          status,
          timeline: [{ status: ORDER_STATUS.PENDING, note: 'Order received', at: placedAt }],
          placedAt,
          createdAt: placedAt,
          deliveredAt: status === ORDER_STATUS.DELIVERED ? new Date(placedAt.getTime() + rand(2, 5) * 864e5) : undefined,
        });
      }
    }

    await Order.insertMany(bulk, { ordered: false });
    console.log(`[seed] ${bulk.length} orders across ${DAYS} days`);

    // Reconcile catalogue counters with the generated history.
    const sold = await Order.aggregate([
      { $match: { status: { $ne: ORDER_STATUS.CANCELLED } } },
      { $unwind: '$items' },
      { $group: { _id: '$items.product', units: { $sum: '$items.quantity' } } },
    ]);
    await Promise.all(sold.map((s) => Product.updateOne({ _id: s._id }, { unitsSold: s.units })));
  }

  console.log('\n[seed] done');
  console.log(`  admin    → ${env.seed.adminEmail} / ${env.seed.adminPassword}`);
  console.log(`  customer → ${env.seed.customerEmail} / ${env.seed.customerPassword}`);

  await disconnectDatabase();
  process.exit(0);
}

run().catch(async (err) => {
  console.error('[seed] failed', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
