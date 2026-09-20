import { Product } from '../models/Product.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { listProducts, getProductBySlugOrId, getRelatedProducts } from '../services/product.service.js';
import { CATEGORIES } from '../config/constants.js';

export const getProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await listProducts(req.validatedQuery ?? req.query);
  return ok(res, items, 'OK', meta);
});

export const getProduct = asyncHandler(async (req, res) => {
  const product = await getProductBySlugOrId(req.params.idOrSlug);
  const related = await getRelatedProducts(product);
  return ok(res, { product, related });
});

export const getFacets = asyncHandler(async (_req, res) => {
  const [range] = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } },
  ]);
  const counts = await Product.aggregate([
    { $match: { isActive: true } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  return ok(res, {
    categories: CATEGORIES.map((c) => ({
      name: c,
      count: counts.find((x) => x._id === c)?.count || 0,
    })),
    priceRange: { min: range?.min ?? 0, max: range?.max ?? 50000 },
  });
});

/* ---------------------------- admin operations ---------------------------- */

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  return created(res, product, `${product.name} added to the catalogue`);
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  Object.assign(product, req.body);
  await product.save();
  return ok(res, product, `${product.name} updated`);
});

export const updateStock = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.stock = req.body.stock;
  if (req.body.lowStockThreshold != null) product.lowStockThreshold = req.body.lowStockThreshold;
  await product.save();
  return ok(res, product, 'Stock updated');
});

// Soft delete: orders reference products, so rows are retired, not removed.
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw ApiError.notFound('Product not found');
  product.isActive = false;
  await product.save();
  return ok(res, { id: product._id }, `${product.name} removed from the storefront`);
});

export const restoreProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true });
  if (!product) throw ApiError.notFound('Product not found');
  return ok(res, product, `${product.name} is live again`);
});

export const adminListProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await listProducts(
    { ...(req.validatedQuery ?? req.query), limit: req.query.limit || 20 },
    { includeInactive: true }
  );
  return ok(res, items, 'OK', meta);
});
