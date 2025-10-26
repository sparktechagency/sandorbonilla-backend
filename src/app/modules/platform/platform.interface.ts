

interface IPlatformRevenue extends Document {
  orderId: string;
  orderNumber: string;
  customerId: string;
  sellerId: string;
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