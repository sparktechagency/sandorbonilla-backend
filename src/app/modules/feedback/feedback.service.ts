import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import IFeedback from "./feedback.interface";
import { Feedback } from "./feedback.model";
import QueryBuilder from "../../builder/QueryBuilder";

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
const getFeedbacks = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(Feedback.find(), query)
    const result = await queryBuilder.paginate().sort().fields().modelQuery.populate("userId", "firstName lastName image").exec()
    const meta = await queryBuilder.countTotal()
    return {
        meta,
        result
    }
}
export const FeedbackService = {
    createFeedback,
    getFeedbacks,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}