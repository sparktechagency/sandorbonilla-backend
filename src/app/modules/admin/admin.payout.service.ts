import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { StatusCodes } from 'http-status-codes';
import { PayoutRequest } from '../stripe/payout.model';
import { User } from '../user/user.model';
import { StripeService } from '../../../helpers/stripe/StripeService';

const getAllPayoutRequests = async () => {
    const payoutRequests = await PayoutRequest.find()
        .populate('userId', 'firstName lastName email')
        .sort({ requestedAt: -1 });
    
    return payoutRequests;
};

const getPayoutRequestById = async (id: string) => {
    const payoutRequest = await PayoutRequest.findById(id)
        .populate('userId', 'firstName lastName email stripeConnectAccount');
    
    if (!payoutRequest) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }
    
    return payoutRequest;
};

const approvePayoutRequest = async (id: string, notes?: string) => {
    const payoutRequest = await PayoutRequest.findById(id);
    
    if (!payoutRequest) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }
    
    if (payoutRequest.status !== 'pending') {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot approve a request with status: ${payoutRequest.status}`);
    }
    
    // Update the payout request status
    payoutRequest.status = 'approved';
    payoutRequest.adminNotes = notes || '';
    payoutRequest.processedAt = new Date();
    
    await payoutRequest.save();
    
    return payoutRequest;
};

const rejectPayoutRequest = async (id: string, notes?: string) => {
    const payoutRequest = await PayoutRequest.findById(id);
    
    if (!payoutRequest) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }
    
    if (payoutRequest.status !== 'pending') {
        throw new ApiError(StatusCodes.BAD_REQUEST, `Cannot reject a request with status: ${payoutRequest.status}`);
    }
    
    // Update the payout request status
    payoutRequest.status = 'rejected';
    payoutRequest.adminNotes = notes || '';
    payoutRequest.processedAt = new Date();
    
    await payoutRequest.save();
    
    return payoutRequest;
};

const processTransfer = async (id: string) => {
    const payoutRequest = await PayoutRequest.findById(id);
    
    if (!payoutRequest) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }
    
    if (payoutRequest.status !== 'approved') {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Only approved payout requests can be processed');
    }
    
    // Get the user with their connected account details
    const user = await User.findById(payoutRequest.userId);
    
    if (!user) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'User not found');
    }
    
    if (!user.stripeConnectAccount?.accountId) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'User does not have a connected Stripe account');
    }
    
    if (!user.stripeConnectAccount.payoutEnabled) {
        throw new ApiError(StatusCodes.BAD_REQUEST, 'Payouts are not enabled for this account');
    }
    
    try {
        // Process the transfer using Stripe
        const transfer = await StripeService.createTransfer(
            user.stripeConnectAccount.accountId,
            payoutRequest.amount,
            `Payout for request ID: ${payoutRequest._id}`
        );
        
        // Update the payout request with the transfer ID and status
        payoutRequest.transferId = transfer.id;
        payoutRequest.status = 'completed';
        await payoutRequest.save();
        
        return payoutRequest;
    } catch (error) {
        throw new ApiError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to process transfer: ${(error as Error).message}`
        );
    }
};

export const AdminPayoutService = {
    getAllPayoutRequests,
    getPayoutRequestById,
    approvePayoutRequest,
    rejectPayoutRequest,
    processTransfer
};