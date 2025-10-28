import { Types } from "mongoose";

export interface IPayoutRequest {
    userId: Types.ObjectId;
    amount: number;
    status: 'pending' | 'approved' | 'rejected' | 'completed';
    requestedAt: Date;
    processedAt?: Date;
    transferId?: string;
    adminNotes?: string;
}