import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import IFeedback from "./feedback.interface";
import { Feedback } from "./feedback.model";

const createFeedback = async (userId: string, payload: IFeedback) => {
    const isExist = await Feedback.findOne({ userId, productId: payload.productId });
    if (isExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Feedback already exists');
    }
    const result = await Feedback.create(payload);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create feedback');
    }
    return result;
}

export const FeedbackService = {
    createFeedback,
    // getFeedbacks,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}