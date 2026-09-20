import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { placeOrder, transitionOrderStatus } from '../services/order.service.js';
import { ORDER_STATUS } from '../config/constants.js';

export const checkout = asyncHandler(async (req, res) => {
  const order = await placeOrder(req.user, req.body);
  return created(res, order, `Order ${order.orderNumber} placed`);
});

export const myOrders = asyncHandler(async (req, res) => {
  const page = Number(req.query.page || 1);
  const limit = Number(req.query.limit || 10);
  const filter = { user: req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Order.find(filter).sort({ placedAt: -1 }).skip((page - 1) * limit).limit(limit).lean({ virtuals: true }),
    Order.countDocuments(filter),
  ]);
  return ok(res, items, 'OK', { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) });
});

export const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id }).lean({ virtuals: true });
  if (!order) throw ApiError.notFound('Order not found');
  return ok(res, order);
});

export const cancelMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw ApiError.notFound('Order not found');
  if ([ORDER_STATUS.SHIPPED, ORDER_STATUS.DELIVERED].includes(order.status)) {
    throw ApiError.badRequest('This order has already shipped. Please request a return instead.');
  }
  const updated = await transitionOrderStatus(order._id, ORDER_STATUS.CANCELLED, req.body.reason || 'Cancelled by customer');
  return ok(res, updated, 'Order cancelled');
});
