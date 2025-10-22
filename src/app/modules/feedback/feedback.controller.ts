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
export const FeedbackController = {
    // createFeedback,
    // getFeedbacks,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}