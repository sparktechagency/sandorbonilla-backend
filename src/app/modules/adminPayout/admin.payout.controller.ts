import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { AdminPayoutService } from './admin.payout.service';

const getAllPayoutRequests = catchAsync(async (req: Request, res: Response) => {
    const result = await AdminPayoutService.getAllPayoutRequests();
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout requests retrieved successfully',
        data: result,
    });
});

const getPayoutRequestById = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await AdminPayoutService.getPayoutRequestById(id);
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request retrieved successfully',
        data: result,
    });
});

const approvePayoutRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await AdminPayoutService.approvePayoutRequest(id, notes);
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request approved successfully',
        data: result,
    });
});

const rejectPayoutRequest = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { notes } = req.body;
    
    const result = await AdminPayoutService.rejectPayoutRequest(id, notes);
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request rejected successfully',
        data: result,
    });
});

const processTransfer = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    
    const result = await AdminPayoutService.processTransfer(id);
    
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Transfer processed successfully',
        data: result,
    });
});

export const AdminPayoutController = {
    getAllPayoutRequests,
    getPayoutRequestById,
    approvePayoutRequest,
    rejectPayoutRequest,
    processTransfer
};