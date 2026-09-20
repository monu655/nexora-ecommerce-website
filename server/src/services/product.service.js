import { Product } from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

const SORT_MAP = {
  relevance: { isFeatured: -1, unitsSold: -1 },
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { rating: -1, reviewCount: -1 },
  popular: { unitsSold: -1 },
};

export async function listProducts(query, { includeInactive = false } = {}) {
  const {
    search, category, minPrice, maxPrice, rating, inStock,
    sort = 'relevance', page = 1, limit = 12, featured,
  } = query;

  const filter = {};
  if (!includeInactive) filter.isActive = true;
  if (category && category !== 'all') filter.category = Array.isArray(category) ? { $in: category } : category;
  if (featured === true) filter.isFeatured = true;
  if (inStock === true) filter.stock = { $gt: 0 };
  if (rating) filter.rating = { $gte: Number(rating) };
  if (minPrice != null || maxPrice != null) {
    filter.price = {};
    if (minPrice != null) filter.price.$gte = Number(minPrice);
    if (maxPrice != null) filter.price.$lte = Number(maxPrice);
  }
  if (search) {
    const rx = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { tagline: rx }, { brand: rx }, { tags: rx }, { category: rx }];
  }

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter).sort(SORT_MAP[sort] || SORT_MAP.relevance).skip(skip).limit(Number(limit)).lean({ virtuals: true }),
    Product.countDocuments(filter),
  ]);

  return {
    items,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.max(Math.ceil(total / Number(limit)), 1),
      hasMore: skip + items.length < total,
    },
  };
}

export async function getProductBySlugOrId(idOrSlug) {
  const isObjectId = /^[a-f\d]{24}$/i.test(idOrSlug);
  const product = await Product.findOne(
    isObjectId ? { _id: idOrSlug } : { slug: idOrSlug }
  ).lean({ virtuals: true });
  if (!product) throw ApiError.notFound('That product is no longer available');
  return product;
}

export async function getRelatedProducts(product, limit = 4) {
  return Product.find({
    _id: { $ne: product._id },
    category: product.category,
    isActive: true,
  })
    .sort({ unitsSold: -1 })
    .limit(limit)
    .lean({ virtuals: true });
}

export async function assertStockAvailable(productId, quantity) {
  const product = await Product.findById(productId);
  if (!product || !product.isActive) throw ApiError.notFound('That product is no longer available');
  if (product.stock < quantity) {
    throw ApiError.badRequest(
      product.stock === 0
        ? `${product.name} is out of stock`
        : `Only ${product.stock} left of ${product.name}`
    );
  }
  return product;
}
