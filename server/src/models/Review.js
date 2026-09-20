import mongoose from 'mongoose';
import { Product } from './Product.js';

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    authorName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, maxlength: 120 },
    body: { type: String, required: true, maxlength: 2000 },
    isVerifiedPurchase: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// One review per customer per product.
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Keep the denormalised rating on Product in sync — the listing page sorts and
// filters on it, and an aggregate on every read would not scale.
reviewSchema.statics.syncProductRating = async function (productId) {
  const [stats] = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId) } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Product.findByIdAndUpdate(productId, {
    rating: stats ? Math.round(stats.avg * 10) / 10 : 0,
    reviewCount: stats ? stats.count : 0,
  });
};

reviewSchema.post('save', function () { this.constructor.syncProductRating(this.product); });
reviewSchema.post('findOneAndDelete', function (doc) {
  if (doc) mongoose.model('Review').syncProductRating(doc.product);
});

export const Review = mongoose.model('Review', reviewSchema);
