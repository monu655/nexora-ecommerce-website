import { z } from 'zod';
import { CATEGORIES, ORDER_STATUS } from '../config/constants.js';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid identifier');
const password = z.string().min(8, 'Use at least 8 characters').max(72);

export const registerSchema = {
  body: z.object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password,
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, 'Enter a valid phone number').optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    password: z.string().min(1, 'Enter your password'),
  }),
};

export const productQuerySchema = {
  query: z.object({
    search: z.string().trim().max(80).optional(),
    category: z.union([z.string(), z.array(z.string())]).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    rating: z.coerce.number().min(0).max(5).optional(),
    inStock: z.coerce.boolean().optional(),
    featured: z.coerce.boolean().optional(),
    sort: z.enum(['relevance', 'newest', 'price-asc', 'price-desc', 'rating', 'popular']).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(48).default(12),
  }),
};

export const productBodySchema = {
  body: z.object({
    name: z.string().trim().min(3, 'Product name is too short').max(120),
    sku: z.string().trim().min(3).max(24),
    tagline: z.string().trim().max(140).optional(),
    description: z.string().trim().min(20, 'Add a description of at least 20 characters').max(4000),
    highlights: z.array(z.string().max(160)).max(8).optional(),
    specs: z.record(z.string()).optional(),
    category: z.enum(CATEGORIES),
    brand: z.string().trim().max(60).optional(),
    price: z.coerce.number().min(1, 'Price must be greater than zero'),
    compareAtPrice: z.coerce.number().min(0).optional(),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
    images: z.array(z.string()).max(6).optional(),
    colorway: z.string().optional(),
    tags: z.array(z.string().max(30)).max(12).optional(),
    isFeatured: z.boolean().optional(),
    isActive: z.boolean().optional(),
  }).refine((d) => !d.compareAtPrice || d.compareAtPrice > d.price, {
    message: 'Compare-at price must be higher than the selling price',
    path: ['compareAtPrice'],
  }),
};

export const addressSchema = {
  body: z.object({
    label: z.enum(['home', 'work', 'other']).default('home'),
    fullName: z.string().trim().min(2, 'Enter the recipient name'),
    phone: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, 'Enter a valid phone number'),
    line1: z.string().trim().min(4, 'Enter the street address'),
    line2: z.string().trim().optional(),
    city: z.string().trim().min(2, 'Enter the city'),
    state: z.string().trim().min(2, 'Enter the state'),
    pincode: z.string().trim().regex(/^\d{6}$/, 'Enter a valid 6-digit PIN code'),
    isDefault: z.boolean().optional(),
  }),
};

export const cartAddSchema = {
  body: z.object({ productId: objectId, quantity: z.coerce.number().int().min(1).max(10).default(1) }),
};

export const cartUpdateSchema = {
  body: z.object({ quantity: z.coerce.number().int().min(1).max(10) }),
};

export const checkoutSchema = {
  body: z.object({
    shippingAddress: addressSchema.body.omit({ label: true, isDefault: true }),
    paymentMethod: z.enum(['card', 'upi', 'netbanking', 'cod']).default('upi'),
  }),
};

export const reviewSchema = {
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5),
    title: z.string().trim().max(120).optional(),
    body: z.string().trim().min(10, 'Tell us a little more').max(2000),
  }),
};

export const orderStatusSchema = {
  body: z.object({
    status: z.enum(Object.values(ORDER_STATUS)),
    note: z.string().trim().max(200).optional(),
  }),
};

export const stockSchema = {
  body: z.object({
    stock: z.coerce.number().int().min(0),
    lowStockThreshold: z.coerce.number().int().min(0).optional(),
  }),
};
