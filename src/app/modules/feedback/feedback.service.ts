import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import IFeedback from "./feedback.interface";
import { Feedback } from "./feedback.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { USER_ROLES } from "../../../enums/user";
import { User } from "../user/user.model";
import mongoose from "mongoose";

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


// Get seller's average rating and rating distribution
async function getSellerRatingStats(sellerId: string) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    const stats = await Feedback.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        },
        {
            $match: {
                'product.sellerId': sellerObjectId
            }
        },
        {
            $facet: {
                summary: [
                    {
                        $group: {
                            _id: null,
                            averageRating: { $avg: '$rating' },
                            totalReviews: { $sum: 1 }
                        }
                    }
                ],
                ratingDistribution: [
                    {
                        $group: {
                            _id: '$rating',
                            count: { $sum: 1 }
                        }
                    },
                    {
                        $sort: { _id: 1 }
                    }
                ]
            }
        }
    ]);

    const summary = stats[0].summary[0] || { averageRating: 0, totalReviews: 0 };
    const distribution = stats[0].ratingDistribution;

    const ratingBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    distribution.forEach((item: any) => {
        ratingBreakdown[item._id as keyof typeof ratingBreakdown] = item.count;
    });

    const total = summary.totalReviews;
    const ratingPercentages = {
        1: total > 0 ? Math.round((ratingBreakdown[1] / total) * 100) : 0,
        2: total > 0 ? Math.round((ratingBreakdown[2] / total) * 100) : 0,
        3: total > 0 ? Math.round((ratingBreakdown[3] / total) * 100) : 0,
        4: total > 0 ? Math.round((ratingBreakdown[4] / total) * 100) : 0,
        5: total > 0 ? Math.round((ratingBreakdown[5] / total) * 100) : 0,
    };

    return {
        averageRating: Math.round(summary.averageRating * 10) / 10,
        totalReviews: summary.totalReviews,
        ratingBreakdown,
        ratingPercentages
    };
}
// Get seller's rating
async function getSellerRating(sellerId: string) {
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const stats = await Feedback.aggregate([
        {
            $lookup: {
                from: 'products',
                localField: 'productId',
                foreignField: '_id',
                as: 'product'
            }
        },
        {
            $unwind: '$product'
        },
        {
            $match: {
                'product.sellerId': sellerObjectId
            }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    const result = stats[0] || { averageRating: 0, totalReviews: 0 };
    return {
        averageRating: Math.round(result.averageRating * 10) / 10,
        totalReviews: result.totalReviews,
    };
}

export const FeedbackService = {
    createFeedback,
    getFeedbacks,
    getSellerRatingStats,
    getSellerRating,
    // getFeedbackById,
    // updateFeedback,
    // deleteFeedback,
}