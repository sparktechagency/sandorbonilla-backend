import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import IFeedback from "./feedback.interface";
import { Feedback } from "./feedback.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { USER_ROLES } from "../../../enums/user";
import { User } from "../user/user.model";

const createFeedback = async (userId: string, payload: IFeedback) => {
    const isExistUser = await User.findById(userId);
    if (!isExistUser) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'User not found');
    }
    if (isExistUser.role === USER_ROLES.SELLER) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Seller cannot give feedback');
    }
    const isExist = await Feedback.findOne({ userId, productId: payload.productId });
    if (isExist) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Feedback already exists');
    }
    payload.userId = isExistUser._id;
    const result = await Feedback.create(payload);
    if (!result) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create feedback');
    }
    return result;
}
const getFeedbacks = async (productId: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(Feedback.find({ productId }), query)
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