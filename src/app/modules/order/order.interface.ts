import mongoose from "mongoose";

export interface IOrderProduct {
    productId: mongoose.Types.ObjectId;
    sellerId: mongoose.Types.ObjectId;
    productName: string;
    size: string;
    color?: string;
    quantity: number;
    price: number;
    discount: number;
    totalPrice: number;
}

export interface IShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface IOrder extends Document {
    customerId: mongoose.Types.ObjectId;
    sellerId: string;
    orderNumber: string;
    products: IOrderProduct[];
    totalPrice: number;
    platformFee: number;
    sellerAmount: number;
    customerName: string;
    email: string;
    phoneNumber: string;
    address: string;
    shippingAddress?: IShippingAddress;
    paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
    deliveryStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    checkoutSessionId: string;
    paymentIntentId: string;
    refundId?: string;
    refundAmount?: number;
    refundReason?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    deliveredAt?: Date;
    cancelledAt?: Date;
    cancelReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface OrderMetadata {
     orderNumber: string;
     items: OrderItem[];
     platformFee: number;
     sellerAmount: number;
     totalPrice: number;
}

export interface CartItem {
     productId: mongoose.Types.ObjectId;
     size: string; // Added
     quantity: number;
     color?: string; // Optional
}

export interface OrderItem {
     productId: mongoose.Types.ObjectId;
     sellerId: mongoose.Types.ObjectId;
     productName: string;
     size: string; // Added
     color?: string; // Added
     quantity: number;
     price: number;
     discount: number; // Added
     totalPrice: number;
}