import { Cart } from '../models/Cart.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { assertStockAvailable } from '../services/product.service.js';
import { calculateTotals } from '../utils/pricing.js';

const loadCart = async (userId) => {
  const cart = await Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { new: true, upsert: true }
  ).populate('items.product', 'name slug price compareAtPrice images stock category sku isActive colorway');
  return cart;
};

const serialize = (cart) => {
  const items = cart.items
    .filter((i) => i.product && i.product.isActive)
    .map((i) => ({
      product: i.product,
      quantity: i.quantity,
      price: i.product.price,
      lineTotal: i.product.price * i.quantity,
    }));
  return { items, totals: calculateTotals(items.map((i) => ({ price: i.price, quantity: i.quantity }))) };
};

export const getCart = asyncHandler(async (req, res) => ok(res, serialize(await loadCart(req.user._id))));

export const addItem = asyncHandler(async (req, res) => {
  const { productId, quantity = 1 } = req.body;
  const cart = await loadCart(req.user._id);
  const existing = cart.items.find((i) => String(i.product?._id || i.product) === productId);
  const nextQty = (existing?.quantity || 0) + quantity;
  if (nextQty > 10) throw ApiError.badRequest('You can order up to 10 units of a product');

  await assertStockAvailable(productId, nextQty);

  if (existing) existing.quantity = nextQty;
  else cart.items.push({ product: productId, quantity });

  await cart.save();
  return ok(res, serialize(await loadCart(req.user._id)), 'Added to cart');
});

export const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await loadCart(req.user._id);
  const item = cart.items.find((i) => String(i.product?._id || i.product) === req.params.productId);
  if (!item) throw ApiError.notFound('That item is not in your cart');

  await assertStockAvailable(req.params.productId, quantity);
  item.quantity = quantity;
  await cart.save();
  return ok(res, serialize(await loadCart(req.user._id)), 'Cart updated');
});

export const removeItem = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  cart.items = cart.items.filter((i) => String(i.product?._id || i.product) !== req.params.productId);
  await cart.save();
  return ok(res, serialize(await loadCart(req.user._id)), 'Removed from cart');
});

export const clearCart = asyncHandler(async (req, res) => {
  const cart = await loadCart(req.user._id);
  cart.items = [];
  await cart.save();
  return ok(res, serialize(cart), 'Cart cleared');
});

/** Merges a guest (localStorage) cart into the account cart after sign-in. */
export const mergeCart = asyncHandler(async (req, res) => {
  const { items = [] } = req.body;
  const cart = await loadCart(req.user._id);
  for (const incoming of items) {
    const existing = cart.items.find((i) => String(i.product?._id || i.product) === incoming.productId);
    const qty = Math.min((existing?.quantity || 0) + incoming.quantity, 10);
    try {
      await assertStockAvailable(incoming.productId, qty);
      if (existing) existing.quantity = qty;
      else cart.items.push({ product: incoming.productId, quantity: incoming.quantity });
    } catch { /* skip unavailable items rather than failing the whole merge */ }
  }
  await cart.save();
  return ok(res, serialize(await loadCart(req.user._id)), 'Cart synced');
});
