import { Review } from '../models/Review.js';
import { Order } from '../models/Order.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { ORDER_STATUS } from '../config/constants.js';

export const listProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 }).limit(50).lean();
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
  }));
  return ok(res, { reviews, distribution, total: reviews.length });
});

export const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  if (await Review.exists({ product: productId, user: req.user._id })) {
    throw ApiError.conflict('You have already reviewed this product');
  }
  const purchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    status: { $ne: ORDER_STATUS.CANCELLED },
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    authorName: req.user.name,
    rating: req.body.rating,
    title: req.body.title,
    body: req.body.body,
    isVerifiedPurchase: Boolean(purchased),
  });
  return created(res, review, 'Review posted');
});

export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findOneAndDelete({ _id: req.params.reviewId, user: req.user._id });
  if (!review) throw ApiError.notFound('Review not found');
  return ok(res, null, 'Review deleted');
});
