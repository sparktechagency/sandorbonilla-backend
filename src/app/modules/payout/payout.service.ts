import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import { PayoutRequest } from "./payout.model";
import StripeService from "../../builder/StripeService";
import QueryBuilder from "../../builder/QueryBuilder";
import { WalletService } from "../wallet/wallet.service";

const requestPayout = async (userId: string, amount: number) => {
    // Check if user exists and has a Connect account
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }

    if (!user.stripeConnectAccount.onboardingComplete) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Please complete your account setup first');
    }
    
    // Check if user has sufficient available balance in wallet
    const walletBalance = await WalletService.getWalletBalance(userId);
    if (walletBalance.availableBalance < amount) {
        throw new AppError(
            StatusCodes.BAD_REQUEST, 
            `Insufficient available balance. Available: $${walletBalance.availableBalance.toFixed(2)}, Requested: $${amount.toFixed(2)}`
        );
    }

    // Create payout request
    const payoutRequest = await PayoutRequest.create({
        userId,
        amount,
        status: 'pending',
        requestedAt: new Date()
    });

    return payoutRequest;
};
const getPayoutRequests = async (userId: string, query: Record<string, unknown>) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }
    const queryBuilder = new QueryBuilder(PayoutRequest.find({ userId }), query);
    const result = await queryBuilder.fields().filter().paginate().sort().modelQuery.exec()
    const meta = await queryBuilder.countTotal()
    return {
        meta,
        result
    };
};

// Admin payout requests
const getAllPayoutRequests = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(PayoutRequest.find().populate('userId', 'firstName lastName email stripeConnectAccount'), query);
    const result = await queryBuilder.fields().filter().paginate().sort().modelQuery.exec()
    const meta = await queryBuilder.countTotal()
    return {
        meta,
        result
    }
};

const getPayoutRequestById = async (id: string) => {
    const payoutRequest = await PayoutRequest.findById(id)
        .populate('userId', 'firstName lastName email stripeConnectAccount');

    if (!payoutRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }

    return payoutRequest;
};

const approvePayoutRequest = async (id: string, notes?: string) => {
    const payoutRequest = await PayoutRequest.findById(id);

    if (!payoutRequest) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }

    if (payoutRequest.status !== 'pending') {
        throw new AppError(StatusCodes.BAD_REQUEST, `Cannot approve a request with status: ${payoutRequest.status}`);
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
        throw new AppError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }

    if (payoutRequest.status !== 'pending') {
        throw new AppError(StatusCodes.BAD_REQUEST, `Cannot reject a request with status: ${payoutRequest.status}`);
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
        throw new AppError(StatusCodes.NOT_FOUND, 'Payout request not found');
    }

    if (payoutRequest.status !== 'approved') {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Only approved payout requests can be processed');
    }

    // Get the user with their connected account details
    const user = await User.findById(payoutRequest.userId);

    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a connected Stripe account');
    }

    if (!user.stripeConnectAccount.payoutEnabled) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Payouts are not enabled for this account');
    }

    try {
        // Deduct the amount from the seller's wallet
        await WalletService.deductFromAvailableBalance(
            payoutRequest.userId.toString(),
            payoutRequest.amount,
            payoutRequest._id.toString(),
            `Payout processed - Transfer to Stripe Connect account`
        );
        
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
        throw new AppError(
            StatusCodes.INTERNAL_SERVER_ERROR,
            `Failed to process transfer: ${(error as Error).message}`
        );
    }
};
export const PayoutService = {
    requestPayout,
    getPayoutRequests,
    getAllPayoutRequests,
    getPayoutRequestById,
    approvePayoutRequest,
    rejectPayoutRequest,
    processTransfer
}
