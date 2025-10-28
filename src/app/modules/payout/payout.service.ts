import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import { User } from "../user/user.model";
import { PayoutRequest } from "./payout.model";

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

    // Create payout request
    const payoutRequest = await PayoutRequest.create({
        userId,
        amount,
        status: 'pending',
        requestedAt: new Date()
    });

    return payoutRequest;
};
const getPayoutRequests = async (userId: string) => {
    // Check if user exists and has a Connect account
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }

    // Get all payout requests for the user
    const payoutRequests = await PayoutRequest.find({ userId });

    return payoutRequests;
};
export const PayoutService = {
    requestPayout,
    getPayoutRequests
}
