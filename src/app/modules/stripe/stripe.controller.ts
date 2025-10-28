import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SellerService } from './stripe.service';

const createConnectAccount = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await SellerService.createConnectAccount(id);

    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Stripe Connect account created successfully',
        data: result,
    });
});

const getAccountLink = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await SellerService.getAccountLink(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Account link generated successfully',
        data: result,
    });
});

const getLoginLink = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await SellerService.getLoginLink(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Login link generated successfully',
        data: result,
    });
});

const getAccountStatus = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await SellerService.getAccountStatus(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Account status retrieved successfully',
        data: result,
    });
});

const requestPayout = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const { amount } = req.body;

    const result = await SellerService.requestPayout(id, amount);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request submitted successfully',
        data: result,
    });
});

const getPayoutRequests = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await SellerService.getPayoutRequests(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout requests retrieved successfully',
        data: result,
    });
});

export const SellerController = {
    createConnectAccount,
    getAccountLink,
    getLoginLink,
    getAccountStatus,
    requestPayout,
    getPayoutRequests
};