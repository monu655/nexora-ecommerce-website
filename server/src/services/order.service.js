import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';
import { calculateTotals } from '../utils/pricing.js';
import { generateOrderNumber } from '../utils/orderNumber.js';
import { ORDER_STATUS, ORDER_STATUS_FLOW, PAYMENT_STATUS } from '../config/constants.js';

/**
 * Places an order from the signed-in user's cart.
 * Stock is re-checked and decremented here — never trusted from the client.
 */
export async function placeOrder(user, { shippingAddress, paymentMethod }) {
  const cart = await Cart.findOne({ user: user._id }).populate('items.product');
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your cart is empty');

  const items = [];
  for (const line of cart.items) {
    const product = line.product;
    if (!product || !product.isActive) {
      throw ApiError.badRequest('An item in your cart is no longer available. Please review your cart.');
    }
    if (product.stock < line.quantity) {
      throw ApiError.badRequest(`Only ${product.stock} left of ${product.name}. Please update the quantity.`);
    }
    items.push({
      product: product._id,
      name: product.name,
      sku: product.sku,
      image: product.images?.[0],
      category: product.category,
      price: product.price,
      quantity: line.quantity,
    });
  }

  const pricing = calculateTotals(items);
  const sequence = await Order.estimatedDocumentCount();

  const order = await Order.create({
    orderNumber: generateOrderNumber(sequence + Math.floor(Math.random() * 97) + 1),
    user: user._id,
    items,
    shippingAddress,
    pricing,
    paymentMethod,
    paymentStatus: paymentMethod === 'cod' ? PAYMENT_STATUS.PENDING : PAYMENT_STATUS.PAID,
    status: ORDER_STATUS.CONFIRMED,
    timeline: [
      { status: ORDER_STATUS.PENDING, note: 'Order received', at: new Date() },
      { status: ORDER_STATUS.CONFIRMED, note: 'Payment confirmed', at: new Date() },
    ],
  });

  await Promise.all(
    items.map((i) =>
      Product.updateOne({ _id: i.product }, { $inc: { stock: -i.quantity, unitsSold: i.quantity } })
    )
  );

  cart.items = [];
  await cart.save();

  return order;
}

export async function transitionOrderStatus(orderId, nextStatus, note) {
  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');

  const allowed = ORDER_STATUS_FLOW[order.status] || [];
  if (!allowed.includes(nextStatus)) {
    throw ApiError.badRequest(`An order that is ${order.status} cannot be marked ${nextStatus}`);
  }

  order.status = nextStatus;
  order.timeline.push({ status: nextStatus, note, at: new Date() });

  if (nextStatus === ORDER_STATUS.DELIVERED) {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod') order.paymentStatus = PAYMENT_STATUS.PAID;
  }

  if (nextStatus === ORDER_STATUS.CANCELLED) {
    order.cancelledAt = new Date();
    order.cancellationReason = note;
    if (order.paymentStatus === PAYMENT_STATUS.PAID) order.paymentStatus = PAYMENT_STATUS.REFUNDED;
    // Return reserved stock to the catalogue.
    await Promise.all(
      order.items.map((i) =>
        Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, unitsSold: -i.quantity } })
      )
    );
  }

  await order.save();
  return order;
}

export const toObjectId = (id) => new mongoose.Types.ObjectId(String(id));
