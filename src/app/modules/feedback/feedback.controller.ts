import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { FeedbackService } from "./feedback.service";

const createFeedback = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const feedback = await FeedbackService.createFeedback(id, req.body);
    sendResponse(res, {
        statusCode: StatusCodes.CREATED,
        success: true,
        message: 'Feedback created successfully',
        data: feedback,
    });
});

const getFeedbacks = catchAsync(async (req, res) => {
    const { productId } = req.params;
    const query = req.query;
    const result = await FeedbackService.getFeedbacks(productId, query);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Feedbacks retrieved successfully',
        meta: result.meta,
        data: result.result,
    });
});

export const FeedbackController = {
    createFeedback,
    getFeedbacks,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}