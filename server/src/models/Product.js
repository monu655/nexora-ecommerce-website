import mongoose from 'mongoose';
import slugify from 'slugify';
import { CATEGORIES } from '../config/constants.js';

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Product name is required'], trim: true, maxlength: 120 },
    slug: { type: String, unique: true, index: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    tagline: { type: String, trim: true, maxlength: 140 },
    description: { type: String, required: true, maxlength: 4000 },
    highlights: { type: [String], default: [] },
    specs: { type: Map, of: String, default: {} },
    category: { type: String, required: true, enum: CATEGORIES, index: true },
    brand: { type: String, default: 'Nexora', trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    cost: { type: Number, min: 0, select: false },
    stock: { type: Number, required: true, min: 0, default: 0 },
    lowStockThreshold: { type: Number, default: 10 },
    images: { type: [String], default: [] },
    colorway: { type: String, default: '#1B39C9' },
    tags: { type: [String], default: [], index: true },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

productSchema.index({ name: 'text', description: 'text', tags: 'text', brand: 'text' });
productSchema.index({ category: 1, price: 1 });

productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) return 'out_of_stock';
  if (this.stock <= this.lowStockThreshold) return 'low_stock';
  return 'in_stock';
});

productSchema.virtual('discountPercent').get(function () {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(((this.compareAtPrice - this.price) / this.compareAtPrice) * 100);
});

productSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = `${slugify(this.name, { lower: true, strict: true })}`;
  }
  next();
});

// Slugs must stay unique even when two products share a name.
productSchema.pre('save', async function (next) {
  if (!this.isModified('slug')) return next();
  const base = this.slug;
  let candidate = base;
  let n = 1;
  while (await mongoose.models.Product.exists({ slug: candidate, _id: { $ne: this._id } })) {
    candidate = `${base}-${++n}`;
  }
  this.slug = candidate;
  next();
});

export const Product = mongoose.model('Product', productSchema);
