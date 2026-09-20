import mongoose from 'mongoose';
import { ORDER_STATUS, PAYMENT_STATUS } from '../config/constants.js';

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    // Denormalised so an order receipt stays accurate even if the product
    // is renamed, repriced or removed from the catalogue later.
    name: { type: String, required: true },
    sku: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUS), required: true },
    note: { type: String },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: { type: [orderItemSchema], validate: (v) => v.length > 0 },
    shippingAddress: {
      fullName: String, phone: String, line1: String, line2: String,
      city: String, state: String, pincode: String,
    },
    pricing: {
      subtotal: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      tax: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    paymentMethod: { type: String, enum: ['card', 'upi', 'netbanking', 'cod'], default: 'upi' },
    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUS), default: PAYMENT_STATUS.PENDING },
    status: { type: String, enum: Object.values(ORDER_STATUS), default: ORDER_STATUS.PENDING, index: true },
    timeline: { type: [timelineSchema], default: [] },
    placedAt: { type: Date, default: Date.now, index: true },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

orderSchema.virtual('itemCount').get(function () {
  return this.items.reduce((n, i) => n + i.quantity, 0);
});

orderSchema.index({ placedAt: -1 });
orderSchema.index({ user: 1, placedAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
