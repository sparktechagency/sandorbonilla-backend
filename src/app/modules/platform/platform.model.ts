import { Schema, model } from 'mongoose';

const platformRevenueSchema = new Schema(
     {
          orderId: {
               type: Schema.Types.ObjectId,
               ref: 'Order',
               required: true,
          },
          orderNumber: {
               type: String,
               required: true,
          },
          customerId: {
               type: Schema.Types.ObjectId,
               ref: 'User',
               required: true,
          },
          sellerId: {
               type: Schema.Types.ObjectId,
               ref: 'Seller',
               required: true,
          },
          orderAmount: {
               type: Number,
               required: true, // Total order amount
          },
          platformFeePercentage: {
               type: Number,
               required: true,
               default: 5, // 5% default
          },
          platformFeeAmount: {
               type: Number,
               required: true, // Calculated fee amount
          },
          paymentStatus: {
               type: String,
               enum: ['pending', 'paid', 'failed', 'refunded'],
               default: 'pending',
          },
          checkoutSessionId: {
               type: String,
               required: true,
          },
          paymentIntentId: {
               type: String,
               default: '',
          },
          collectedAt: {
               type: Date,
               default: null,
          },
     },
     {
          timestamps: true,
     }
);



const PlatformRevenue = model('PlatformRevenue', platformRevenueSchema);

export default PlatformRevenue;