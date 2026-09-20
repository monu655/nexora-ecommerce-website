import { Wishlist } from '../models/Wishlist.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/apiResponse.js';

const load = (userId) =>
  Wishlist.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, products: [] } },
    { new: true, upsert: true }
  ).populate('products', 'name slug price compareAtPrice images rating reviewCount stock category colorway');

export const getWishlist = asyncHandler(async (req, res) => ok(res, (await load(req.user._id)).products));

export const toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await Wishlist.findOneAndUpdate(
    { user: req.user._id },
    { $setOnInsert: { user: req.user._id } },
    { new: true, upsert: true }
  );
  const index = wishlist.products.findIndex((p) => String(p) === productId);
  const added = index === -1;
  if (added) wishlist.products.push(productId);
  else wishlist.products.splice(index, 1);
  await wishlist.save();

  const populated = await load(req.user._id);
  return ok(res, populated.products, added ? 'Saved to wishlist' : 'Removed from wishlist');
});

export const removeFromWishlist = asyncHandler(async (req, res) => {
  await Wishlist.updateOne({ user: req.user._id }, { $pull: { products: req.params.productId } });
  return ok(res, (await load(req.user._id)).products, 'Removed from wishlist');
});
