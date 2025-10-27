import mongoose from "mongoose";


export interface IPlatformRevenue {
  orderId: mongoose.Types.ObjectId;
  orderNumber: string;
  customerId: mongoose.Types.ObjectId;
  sellerId: mongoose.Types.ObjectId;
  orderAmount: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  checkoutSessionId: string;
  paymentIntentId: string | null;
  collectedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}