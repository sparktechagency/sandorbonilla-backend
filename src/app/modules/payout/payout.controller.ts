import { StatusCodes } from "http-status-codes";
import sendResponse from "../../../shared/sendResponse";
import catchAsync from "../../../shared/catchAsync";
import { PayoutService } from "./payout.service";

const requestPayout = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const { amount } = req.body;

    const result = await PayoutService.requestPayout(id, amount);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request submitted successfully',
        data: result,
    });
});
const getPayoutRequests = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string };
    const result = await PayoutService.getPayoutRequests(id, req.query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout requests retrieved successfully',
        data: result,
    });
});
const getAllPayoutRequests = catchAsync(async (req, res) => {
    const result = await PayoutService.getAllPayoutRequests(req.query);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout requests retrieved successfully',
        data: result.result,
        meta: result.meta,
    });
});

const getPayoutRequestById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await PayoutService.getPayoutRequestById(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request retrieved successfully',
        data: result,
    });
});
const approvePayoutRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await PayoutService.approvePayoutRequest(id, notes);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request approved successfully',
        data: result,
    });
});
const rejectPayoutRequest = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { notes } = req.body;
    const result = await PayoutService.rejectPayoutRequest(id, notes);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout request rejected successfully',
        data: result,
    });
});
const processTransfer = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await PayoutService.processTransfer(id);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Transfer processed successfully',
        data: result,
    });
});
export const PayoutController = {
    requestPayout,
    getPayoutRequests,
    getAllPayoutRequests,
    getPayoutRequestById,
    approvePayoutRequest,
    rejectPayoutRequest,
    processTransfer
}
