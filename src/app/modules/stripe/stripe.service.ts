import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { User } from '../user/user.model';
import StripeService from '../../builder/StripeService';
import { PayoutRequest } from '../payout/payout.model';

const createConnectAccount = async (userId: string) => {
    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    // Check if user already has a Connect account
    if (user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User already has a Connect account');
    }

    // Create Connect account
    const account = await StripeService.createConnectedAccount(user.email, userId);

    return {
        accountId: account.id,
        status: 'pending'
    };
};

const getAccountLink = async (userId: string) => {
    // Check if user exists and has a Connect account
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }

    // Generate account link
    const accountLinkUrl = await StripeService.createAccountLink(userId);

    return {
        url: accountLinkUrl
    };
};

const getLoginLink = async (userId: string) => {
    // Check if user exists and has a Connect account
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }

    // Generate login link
    const loginLinkUrl = await StripeService.createLoginLink(userId);

    return {
        url: loginLinkUrl
    };
};

const getAccountStatus = async (userId: string) => {
    // Check if user exists and has a Connect account
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }

    if (!user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User does not have a Connect account');
    }

    // Check account status
    const account = await StripeService.checkAccountStatus(userId);

    return {
        accountId: account.id,
        payoutsEnabled: account.payouts_enabled,
        chargesEnabled: account.charges_enabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements
    };
};

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
export const StripeOnboardingService = {
    createConnectAccount,
    getAccountLink,
    getLoginLink,
    getAccountStatus,
    requestPayout,
    getPayoutRequests
};