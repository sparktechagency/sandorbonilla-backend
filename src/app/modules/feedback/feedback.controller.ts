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

const getSellerRatingStats = catchAsync(async (req, res) => {
    const { id: sellerId } = req.user as { id: string };
    const stats = await FeedbackService.getSellerRatingStats(sellerId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Seller rating stats retrieved successfully',
        data: stats,
    });
});
const getSellerRating = catchAsync(async (req, res) => {
    const { sellerId } = req.params;
    const stats = await FeedbackService.getSellerRating(sellerId);
    sendResponse(res, {
        statusCode: StatusCodes.OK,
        success: true,
        message: 'Seller rating stats retrieved successfully',
        data: stats,
    });
});

export const FeedbackController = {
    createFeedback,
    getFeedbacks,
    getSellerRatingStats,
    getSellerRating,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}