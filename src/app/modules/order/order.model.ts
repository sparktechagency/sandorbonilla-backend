import mongoose, { Schema } from 'mongoose';
import { IOrder, IOrderProduct } from './order.interface';



const orderProductSchema = new Schema({
     productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
     },
     sellerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
     },
     productName: {
          type: String,
          required: true,
     },
     size: {
          type: String,
          required: true,
     },
     color: {
          type: String,
          default: '',
     },
     quantity: {
          type: Number,
          required: true,
          min: 1,
     },
     price: {
          type: Number,
          required: true,
     },
     discount: {
          type: Number,
          default: 0,
     },
     totalPrice: {
          type: Number,
          required: true,
     },
     profit: {
          type: Number,
          required: true,
          min: 0,
     },
     totalProfit: {
          type: Number,
          required: true,
          min: 0,
     },
}, { _id: false });

const shippingAddressSchema = new Schema({
     line1: { type: String, required: true },
     line2: { type: String, default: '' },
     city: { type: String, required: true },
     postalCode: { type: String, required: true },
     country: { type: String, required: true },
}, { _id: false });

const orderSchema = new Schema<IOrder>({
     customerId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
          index: true,
     },
     sellerId: {
          type: String,
          required: true,
          index: true,
     },
     orderNumber: {
          type: String,
          required: true,
          unique: true,
          index: true,
     },
     products: {
          type: [orderProductSchema],
          required: true,
          validate: {
               validator: function (v: IOrderProduct[]) {
                    return v.length > 0;
               },
               message: 'Order must have at least one product',
          },
     },
     totalPrice: {
          type: Number,
          required: true,
          min: 0,
     },
     platformFee: {
          type: Number,
          default: 0,
          min: 0,
     },
     sellerAmount: {
          type: Number,
          required: true,
          min: 0,
     },
     customerName: {
          type: String,
          required: true,
     },
     email: {
          type: String,
          required: true,
     },
     phoneNumber: {
          type: String,
          default: '',
     },
     address: {
          type: String,
          default: '',
     },
     shippingAddress: {
          type: shippingAddressSchema,
          default: null,
     },
     shippingCost: {
          type: Number,
          default: 0,
     },
     totalProfit: {
          type: Number,
          default: 0,
          min: 0,
     },
     paymentStatus: {
          type: String,
          enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
          default: 'pending',
          index: true,
     },
     deliveryStatus: {
          type: String,
          enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
          default: 'pending',
          index: true,
     },
     checkoutSessionId: {
          type: String,
          required: true,
          index: true,
     },
     paymentIntentId: {
          type: String,
          default: '',
     },
     refundId: {
          type: String,
          default: '',
     },
     refundAmount: {
          type: Number,
          default: 0,
     },
     refundReason: {
          type: String,
          default: '',
     },
     trackingNumber: {
          type: String,
          default: '',
     },
     estimatedDelivery: {
          type: Date,
          default: null,
     },
     deliveredAt: {
          type: Date,
          default: null,
     },
     cancelledAt: {
          type: Date,
          default: null,
     },
     cancelReason: {
          type: String,
          default: '',
     },
     notes: {
          type: String,
          default: '',
     },
}, {
     timestamps: true,
});

// Indexes for better query performance
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ sellerId: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, deliveryStatus: 1 });

// Instance methods
orderSchema.methods.markAsShipped = async function (trackingNumber: string, estimatedDelivery: Date) {
     this.deliveryStatus = 'shipped';
     this.trackingNumber = trackingNumber;
     this.estimatedDelivery = estimatedDelivery;
     await this.save();
};

orderSchema.methods.markAsDelivered = async function () {
     this.deliveryStatus = 'delivered';
     this.deliveredAt = new Date();
     await this.save();
};

orderSchema.methods.cancelOrder = async function (reason: string) {
     this.deliveryStatus = 'cancelled';
     this.cancelledAt = new Date();
     this.cancelReason = reason;
     await this.save();
};

export const Order = mongoose.model<IOrder>('Order', orderSchema)