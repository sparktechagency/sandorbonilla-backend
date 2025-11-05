import { StatusCodes } from 'http-status-codes';
import AppError from '../../../errors/AppError';
import { User } from '../user/user.model';
import StripeService from '../../builder/StripeService';

const createConnectAccount = async (userId: string) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
    }
    if (user.stripeConnectAccount?.accountId) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User already has a Connect account');
    }
    const account = await StripeService.createConnectedAccount(user.email, userId);

    return {
        accountId: account.id,
        status: 'pending'
    };
};

const getAccountLink = async (userId: string) => {

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
        accountId: user.stripeConnectAccount.accountId,
        accountStatus: user.stripeConnectAccount.accountStatus,
        payoutsEnabled: user.stripeConnectAccount.payoutEnabled,
        chargesEnabled: user.stripeConnectAccount.chargesEnabled,
        detailsSubmitted: account.details_submitted,
        requirements: account.requirements
    };
};





export const StripeOnboardingService = {
    createConnectAccount,
    getAccountLink,
    getLoginLink,
    getAccountStatus
};