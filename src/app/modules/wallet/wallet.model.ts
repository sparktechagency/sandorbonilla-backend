import mongoose, { Document, Schema } from 'mongoose';
import { Types } from 'mongoose';

// Interface for wallet transactions
export interface IWalletTransaction extends Document {
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  createdAt: Date;
  orderId?: Types.ObjectId;
  payoutRequestId?: Types.ObjectId;
}

// Interface for seller wallet
export interface ISellerWallet extends Document {
  userId: Types.ObjectId;
  totalEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  transactions: IWalletTransaction[];
  createdAt: Date;
  updatedAt: Date;
}

// Schema for wallet transactions
const walletTransactionSchema = new Schema<IWalletTransaction>(
  {
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    payoutRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'PayoutRequest',
    },
  },
  {
    timestamps: true,
  }
);

// Schema for seller wallet
const sellerWalletSchema = new Schema<ISellerWallet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    availableBalance: {
      type: Number,
      default: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    transactions: [walletTransactionSchema],
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
sellerWalletSchema.index({ userId: 1 });

export const SellerWallet = mongoose.model<ISellerWallet>('SellerWallet', sellerWalletSchema);