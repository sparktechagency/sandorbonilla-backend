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
    const result = await PayoutService.getPayoutRequests(id);

    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Payout requests retrieved successfully',
        data: result,
    });
});
export const PayoutController = {
    requestPayout,
    getPayoutRequests
}
