import { model } from "mongoose";
import { IPayment } from "./payments.interface";
import { Schema } from "mongoose";

const PaymentSchema = new Schema<IPayment>(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        sellerId: { type: String, required: true },
        orderNumber: { type: String, required: true },
        amount: { type: Number, required: true },
        platformFee: { type: Number, required: true },
        sellerAmount: { type: Number, required: true },
        currency: { type: String, required: true },
        paymentMethod: { type: String, required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
            default: 'pending',
        },
        checkoutSessionId: { type: String, required: true },
        paymentIntentId: { type: String, required: false },
        refundId: { type: String },
        refundAmount: { type: Number },
        refundReason: { type: String },
        paymentDetails: {
            brand: { type: String },
            last4: { type: String },
            expMonth: { type: Number },
            expYear: { type: Number },
        },
        failureMessage: { type: String },
        failureCode: { type: String },
        metadata: { type: Object },
        paidAt: { type: Date },
        refundedAt: { type: Date },
    },
    { timestamps: true, versionKey: false }
);

export const PaymentModel = model<IPayment>('Payment', PaymentSchema);