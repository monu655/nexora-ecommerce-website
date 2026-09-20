import { Order } from '../models/Order.js';
import { Product } from '../models/Product.js';
import { User } from '../models/User.js';
import { ORDER_STATUS, ROLES } from '../config/constants.js';

const REVENUE_STATUSES = [
  ORDER_STATUS.CONFIRMED, ORDER_STATUS.PACKED, ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED,
];

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

/** Headline KPI cards, each with a period-over-period delta. */
export async function getSummary(rangeDays = 30) {
  const start = daysAgo(rangeDays);
  const prevStart = daysAgo(rangeDays * 2);

  const revenueAgg = async (from, to) => {
    const [row] = await Order.aggregate([
      { $match: { status: { $in: REVENUE_STATUSES }, placedAt: { $gte: from, ...(to ? { $lt: to } : {}) } } },
      { $group: { _id: null, revenue: { $sum: '$pricing.total' }, orders: { $sum: 1 } } },
    ]);
    return row || { revenue: 0, orders: 0 };
  };

  const [current, previous, customers, prevCustomers, products, lowStock] = await Promise.all([
    revenueAgg(start),
    revenueAgg(prevStart, start),
    User.countDocuments({ role: ROLES.CUSTOMER, createdAt: { $lte: new Date() } }),
    User.countDocuments({ role: ROLES.CUSTOMER, createdAt: { $lt: start } }),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }),
  ]);

  const delta = (now, before) => (before === 0 ? (now > 0 ? 100 : 0) : Math.round(((now - before) / before) * 1000) / 10);

  return {
    revenue: {
      value: current.revenue,
      change: delta(current.revenue, previous.revenue),
    },
    orders: {
      value: current.orders,
      change: delta(current.orders, previous.orders),
    },
    customers: {
      value: customers,
      change: delta(customers, prevCustomers),
    },
    products: { value: products, lowStock },
    averageOrderValue: {
      value: current.orders ? Math.round(current.revenue / current.orders) : 0,
      change: delta(
        current.orders ? current.revenue / current.orders : 0,
        previous.orders ? previous.revenue / previous.orders : 0
      ),
    },
  };
}

/** Revenue + order count bucketed by day, zero-filled so charts never gap. */
export async function getRevenueSeries(rangeDays = 30) {
  const start = daysAgo(rangeDays);
  const rows = await Order.aggregate([
    { $match: { status: { $in: REVENUE_STATUSES }, placedAt: { $gte: start } } },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$placedAt' } },
        revenue: { $sum: '$pricing.total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const byDate = Object.fromEntries(rows.map((r) => [r._id, r]));
  const series = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const key = daysAgo(i).toISOString().slice(0, 10);
    series.push({ date: key, revenue: byDate[key]?.revenue || 0, orders: byDate[key]?.orders || 0 });
  }
  return series;
}

export async function getCategoryPerformance(rangeDays = 90) {
  return Order.aggregate([
    { $match: { status: { $in: REVENUE_STATUSES }, placedAt: { $gte: daysAgo(rangeDays) } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.category',
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        units: { $sum: '$items.quantity' },
      },
    },
    { $project: { _id: 0, category: '$_id', revenue: 1, units: 1 } },
    { $sort: { revenue: -1 } },
  ]);
}

export async function getTopProducts(limit = 6, rangeDays = 90) {
  return Order.aggregate([
    { $match: { status: { $in: REVENUE_STATUSES }, placedAt: { $gte: daysAgo(rangeDays) } } },
    { $unwind: '$items' },
    {
      $group: {
        _id: '$items.product',
        name: { $first: '$items.name' },
        category: { $first: '$items.category' },
        image: { $first: '$items.image' },
        units: { $sum: '$items.quantity' },
        revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
      },
    },
    { $sort: { revenue: -1 } },
    { $limit: limit },
  ]);
}

export async function getOrderStatusBreakdown() {
  const rows = await Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
  return rows.map((r) => ({ status: r._id, count: r.count }));
}

export async function getRecentOrders(limit = 8) {
  return Order.find()
    .sort({ placedAt: -1 })
    .limit(limit)
    .populate('user', 'name email')
    .lean({ virtuals: true });
}

export async function getDashboard(rangeDays = 30) {
  const [summary, revenueSeries, categories, topProducts, statusBreakdown, recentOrders] = await Promise.all([
    getSummary(rangeDays),
    getRevenueSeries(rangeDays),
    getCategoryPerformance(),
    getTopProducts(),
    getOrderStatusBreakdown(),
    getRecentOrders(),
  ]);
  return { summary, revenueSeries, categories, topProducts, statusBreakdown, recentOrders };
}
