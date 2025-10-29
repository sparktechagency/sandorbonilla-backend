import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StripeOnboardingService } from './stripe.service';

const createConnectAccount = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await StripeOnboardingService.createConnectAccount(id);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Stripe Connect account created successfully',
        data: result,
    });
});

const getAccountLink = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await StripeOnboardingService.getAccountLink(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Account link generated successfully',
        data: result,
    });
});

const getLoginLink = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await StripeOnboardingService.getLoginLink(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Login link generated successfully',
        data: result,
    });
});

const getAccountStatus = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await StripeOnboardingService.getAccountStatus(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Account status retrieved successfully',
        data: result,
    });
});

const onboardingSuccess = catchAsync(async (req, res) => {
     res.render('success-account');
});
// Assuming you have OrderServices imported properly
const onboardingCancel = catchAsync(async (req, res) => {
     res.render('cancel');
});

export const StripeOnboardingController = {
    createConnectAccount,
    getAccountLink,
    getLoginLink,
    getAccountStatus,
    onboardingSuccess
};