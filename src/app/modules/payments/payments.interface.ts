import { Types } from 'mongoose';

export interface IPayment {
    _id?: Types.ObjectId;
    orderId: Types.ObjectId;
    customerId: Types.ObjectId;
    sellerId: string;
    orderNumber: string;
    amount: number;
    platformFee: number;
    sellerAmount: number;
    totalProfit: number;
    currency: string;
    paymentMethod: string;
    paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
    checkoutSessionId: string;
    paymentIntentId: string;
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    stripeCustomerId?: string;
    paymentDetails?: {
        brand?: string;
        last4?: string;
        expMonth?: number;
        expYear?: number;
    };
    receiptUrl?: string;
    failureMessage?: string;
    failureCode?: string;
    metadata?: Record<string, any>;
    paidAt?: Date;
    refundedAt?: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface IPaymentFilter {
    customerId?: Types.ObjectId;
    sellerId?: string;
    orderId?: Types.ObjectId;
    paymentStatus?: string;
    paymentMethod?: string;
    startDate?: Date;
    endDate?: Date;
    searchTerm?: string;
}