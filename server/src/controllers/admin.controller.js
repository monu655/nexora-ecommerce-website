import { Order } from '../models/Order.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import * as analytics from '../services/analytics.service.js';
import { transitionOrderStatus } from '../services/order.service.js';
import { ROLES, ORDER_STATUS } from '../config/constants.js';

export const dashboard = asyncHandler(async (req, res) =>
  ok(res, await analytics.getDashboard(Number(req.query.range || 30)))
);

export const revenueSeries = asyncHandler(async (req, res) =>
  ok(res, await analytics.getRevenueSeries(Number(req.query.range || 30)))
);

export const categoryPerformance = asyncHandler(async (_req, res) =>
  ok(res, await analytics.getCategoryPerformance())
);

export const listOrders = asyncHandler(async (req, res) => {
  const { status, search, page = 1, limit = 12 } = req.query;
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  if (search) {
    const rx = new RegExp(String(search).trim(), 'i');
    const users = await User.find({ $or: [{ name: rx }, { email: rx }] }).select('_id').lean();
    filter.$or = [{ orderNumber: rx }, { user: { $in: users.map((u) => u._id) } }];
  }

  const [items, total] = await Promise.all([
    Order.find(filter)
      .sort({ placedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'name email')
      .lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);

  return ok(res, items, 'OK', {
    page: Number(page), limit: Number(limit), total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email phone').lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, order);
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await transitionOrderStatus(req.params.id, req.body.status, req.body.note);
  return ok(res, order, `Order marked ${order.status}`);
});

export const listCustomers = asyncHandler(async (req, res) => {
  const { search, page = 1, limit = 12 } = req.query;
  const filter = { role: ROLES.CUSTOMER };
  if (search) {
    const rx = new RegExp(String(search).trim(), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean({ virtuals: true }),
    User.countDocuments(filter),
  ]);

  // Attach lifetime value so the table answers "who matters" at a glance.
  const spend = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: ORDER_STATUS.CANCELLED } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$pricing.total' }, last: { $max: '$placedAt' } } },
  ]);
  const byUser = Object.fromEntries(spend.map((s) => [String(s._id), s]));

  const items = users.map((u) => ({
    ...u,
    orderCount: byUser[String(u._id)]?.orders || 0,
    lifetimeValue: byUser[String(u._id)]?.spent || 0,
    lastOrderAt: byUser[String(u._id)]?.last || null,
  }));

  return ok(res, items, 'OK', {
    page: Number(page), limit: Number(limit), total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

export const setCustomerStatus = asyncHandler(async (req, res) => {
  const user = await User.findOneAndUpdate(
    { _id: req.params.id, role: ROLES.CUSTOMER },
    { isActive: req.body.isActive },
    { new: true }
  );
  if (!user) throw ApiError.notFound('Customer not found');
  return ok(res, user, user.isActive ? 'Account reactivated' : 'Account deactivated');
});
