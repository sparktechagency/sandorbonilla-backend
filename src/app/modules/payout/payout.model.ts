import { model, Schema } from 'mongoose';
import { IPayoutRequest } from './payout.interface';

const payoutRequestSchema = new Schema<IPayoutRequest>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        amount: {
            type: Number,
            required: true,
            min: [1, 'Amount must be at least 1']
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'completed'],
            default: 'pending'
        },
        requestedAt: {
            type: Date,
            default: Date.now
        },
        processedAt: {
            type: Date
        },
        transferId: {
            type: String
        },
        adminNotes: {
            type: String
        }
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true
        }
    }
);

export const PayoutRequest = model<IPayoutRequest>('PayoutRequest', payoutRequestSchema);