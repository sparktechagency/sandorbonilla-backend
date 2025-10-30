import { StatusCodes } from "http-status-codes";
import { USER_ROLES } from "../../../enums/user";
import AppError from "../../../errors/AppError";
import { Feedback } from "../feedback/feedback.model"
import { Order } from "../order/order.model"
import { ProductModel } from "../products/products.model"
import { User } from "../user/user.model";
import { CustomerMonthlyStats, RatingBreakdown, SellerMonthlyProfit, SellerYearlyStats, TopSellingProduct } from "./dashboard.interface";
import getCurrentMonthYear from "../../../utils/getCurrentMonthYear";

// ===========================================================Seller Dashboard Analytics ===========================================================================
const productStatistic = async (id: string) => {
    const productIds = await ProductModel.find({ sellerId: id }).distinct("_id");
    const [storedItems, activeOrder, deliveredOrder, cancelledOrder, totalRating] = await Promise.all([
        ProductModel.countDocuments({ sellerId: id }),
        Order.countDocuments({ sellerId: id, status: "processing" }),
        Order.countDocuments({ sellerId: id, status: "delivered" }),
        Order.countDocuments({ sellerId: id, status: "cancelled" }),
        Feedback.countDocuments({ productId: { $in: productIds } }),
    ]);

    return {
        storedItems,
        activeOrder,
        deliveredOrder,
        cancelledOrder,
        totalRating,
    };
};
const getDailyRevenueForMonth = async (sellerId: string, query: Record<string, unknown>) => {
    try {
        const { year, month } = query;

        if (!year || !month) {
            throw new Error('Year and month are required');
        }

        const yearNum = Number(year);
        const monthNum = Number(month);

        // Get first and last day of the month
        const startDate = new Date(yearNum, monthNum - 1, 1);
        const endDate = new Date(yearNum, monthNum, 0, 23, 59, 59);

        const dailyRevenue = await Order.aggregate([
            {
                $match: {
                    sellerId: sellerId,
                    paymentStatus: 'paid',
                    deliveryStatus: { $ne: 'cancelled' },
                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },
            {
                $group: {
                    _id: { day: { $dayOfMonth: '$createdAt' } },
                    totalRevenue: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                },
            },
            {
                $project: {
                    _id: 0,
                    day: '$_id.day',
                    totalRevenue: 1,
                    totalOrders: 1,
                },
            },
            {
                $sort: { day: 1 },
            },
        ]);

        // Get number of days in the month
        const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

        // Fill missing days with 0
        const fullDailyRevenue = Array.from({ length: daysInMonth }, (_, index) => {
            const dayNumber = index + 1;
            const found = dailyRevenue.find((d) => d.day === dayNumber);
            return {
                day: dayNumber,
                date: new Date(yearNum, monthNum - 1, dayNumber).toISOString().split('T')[0],
                totalRevenue: found ? found.totalRevenue : 0,
                totalOrders: found ? found.totalOrders : 0,
            };
        });

        return fullDailyRevenue;
    } catch (error) {
        console.error('Error in getDailyRevenueForMonth:', error);
        return [];
    }
};
const getMonthlyStatistic = async (sellerId: string, query: Record<string, unknown>) => {

    const { currentMonth, currentYear, months } = getCurrentMonthYear();

    const selectedMonth = (query.month as string) || currentMonth;
    const selectedYear = query.year ? Number(query.year) : currentYear;

    const monthIndex = months.indexOf(selectedMonth);
    if (monthIndex === -1) {
        throw new Error('Invalid month provided');
    }

    const startDate = new Date(selectedYear, monthIndex, 1);
    const endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999);

    const agg = await Order.aggregate([
        {
            $match: {
                sellerId,
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
                createdAt: { $gte: startDate, $lt: endDate }
            }
        },
        {
            $group: {
                _id: { day: { $dayOfMonth: '$createdAt' } },
                income: { $sum: '$totalPrice' },
                returnCost: { $sum: { $ifNull: ['$returnCost', 0] } },
                profit: { $sum: { $subtract: ['$totalPrice', { $ifNull: ['$returnCost', 0] }] } }
            }
        },
        {
            $project: {
                _id: 0,
                day: '$_id.day',
                income: 1,
                returnCost: 1,
                profit: 1
            }
        },
        { $sort: { day: 1 } }
    ]);

    const daysInMonth = new Date(selectedYear, monthIndex + 1, 0).getDate();
    const byDay = new Map<number, { income: number; returnCost: number; profit: number }>();
    for (const r of agg) byDay.set(r.day, r);

    const chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const found = byDay.get(d);
        return {
            day: d,
            date: new Date(selectedYear, monthIndex, d).toISOString().split('T')[0],
            income: found ? found.income : 0,
            returnCost: found ? found.returnCost : 0,
            profit: found ? found.profit : 0
        };
    });

    const incomeSum = chartData.reduce((s, x) => s + x.income, 0);
    const returnSum = chartData.reduce((s, x) => s + x.returnCost, 0);
    const profitSum = chartData.reduce((s, x) => s + x.profit, 0);

    return {
        month: selectedMonth,
        year: selectedYear,
        summary: {
            income: incomeSum,
            returnCost: returnSum,
            profit: profitSum
        },
        chartData
    };
};

// ===========================================================Admin Dashboard Analytics ===========================================================================
// admin dashboard analytics
const getAdminAnalytics = async () => {
    try {
        const [summary, totalQuantity, totalProducts, pendingOrders, deliveredOrders, totalSellers, totalCustomers] = await Promise.all([
            Order.aggregate([
                {
                    $match: {
                        paymentStatus: 'paid',
                        deliveryStatus: { $ne: 'cancelled' }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalAmount: { $sum: '$totalPrice' },
                        totalProfit: { $sum: '$totalProfit' },
                        adminRevenue: { $sum: '$platformFee' }
                    }
                }
            ]),
            ProductModel.aggregate([
                {
                    $match: {
                        isDeleted: false
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalStock: { $sum: '$totalStock' }
                    }
                }
            ]),
            ProductModel.countDocuments({ isDeleted: false }),
            Order.countDocuments({ paymentStatus: 'paid', deliveryStatus: 'pending' }),
            Order.countDocuments({ paymentStatus: 'paid', deliveryStatus: 'delivered' }),
            User.countDocuments({ role: USER_ROLES.SELLER }),
            User.countDocuments({ role: USER_ROLES.USER })
        ]);
        const totalStock = totalQuantity[0]?.totalStock || 0;
        const { totalAmount = 0, totalProfit = 0, adminRevenue = 0 } = summary[0] || {};

        return {
            totalProducts,
            totalStock,
            pendingOrders,
            deliveredOrders,
            totalSellers,
            totalCustomers,
            totalRevenue: Number(totalAmount.toFixed(2)),
            totalProfit: Number(totalProfit.toFixed(2)),
            adminRevenue: Number(adminRevenue.toFixed(2))
        };
    } catch {
        return {
            totalProducts: 0,
            totalStock: 0,
            pendingOrders: 0,
            deliveredOrders: 0,
            totalSellers: 0,
            totalCustomers: 0,
            totalRevenue: 0,
            totalProfit: 0,
            adminRevenue: 0
        };
    }
};
// admin monthly revenue
const getMonthlyRevenueForAdmin = async (query: Record<string, unknown>) => {
    const matchCondition: any = {
        paymentStatus: 'paid',
        deliveryStatus: { $ne: 'cancelled' },
    };
    const yearFilter = query?.year as string;
    const startDate = query?.startDate as string;
    const endDate = query?.endDate as string;
    if (startDate && endDate) {
        matchCondition.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    }
    else if (yearFilter) {
        const year = Number(yearFilter);
        matchCondition.createdAt = {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
        };
    }
    else {
        const currentYear = new Date().getFullYear();
        matchCondition.createdAt = {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
        };
    }
    const monthlyRevenue = await Order.aggregate([
        {
            $match: matchCondition,
        },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                totalRevenue: { $sum: '$totalPrice' },
                totalProfit: { $sum: '$totalProfit' },
                adminRevenue: { $sum: '$platformFee' },
            },
        },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                totalRevenue: 1,
                totalProfit: 1,
                adminRevenue: 1,
            },
        },
        {
            $sort: { month: 1 },
        },
    ]);

    // Full months array
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    // Fill missing months with 0
    const fullMonthlyRevenue = months.map((monthName, index) => {
        const monthNumber = index + 1;
        const found = monthlyRevenue.find((m) => m.month === monthNumber);
        return {
            month: monthName,
            monthNumber: monthNumber,
            totalRevenue: found ? found.totalRevenue : 0,
            totalProfit: found ? found.totalProfit : 0,
            adminRevenue: found ? found.adminRevenue : 0,
        };
    });
    return fullMonthlyRevenue;
};
// admin monthly order status
const getMonthlyOrderStatusForAdmin = async (query: Record<string, unknown>) => {
    const matchCondition: any = {
        paymentStatus: 'paid',
    };
    const yearFilter = query?.year as string;
    const startDate = query?.startDate as string;
    const endDate = query?.endDate as string;

    if (startDate && endDate) {
        matchCondition.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
        };
    } else if (yearFilter) {
        const year = Number(yearFilter);
        matchCondition.createdAt = {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
        };
    } else {
        const currentYear = new Date().getFullYear();
        matchCondition.createdAt = {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1),
        };
    }

    const monthly = await Order.aggregate([
        { $match: matchCondition },
        {
            $group: {
                _id: { month: { $month: '$createdAt' } },
                pending: {
                    $sum: {
                        $cond: [{ $eq: ['$deliveryStatus', 'pending'] }, 1, 0],
                    },
                },
                processing: {
                    $sum: {
                        $cond: [{ $eq: ['$deliveryStatus', 'processing'] }, 1, 0],
                    },
                },
                shipped: {
                    $sum: {
                        $cond: [{ $eq: ['$deliveryStatus', 'shipped'] }, 1, 0],
                    },
                },
                delivered: {
                    $sum: {
                        $cond: [{ $eq: ['$deliveryStatus', 'delivered'] }, 1, 0],
                    },
                },
                cancelled: {
                    $sum: {
                        $cond: [
                            { $in: ['$deliveryStatus', ['cancelled', 'canceled']] },
                            1,
                            0,
                        ],
                    },
                },
                refunded: {
                    $sum: {
                        $cond: [
                            { $in: ['$deliveryStatus', ['refunded', 'refund']] },
                            1,
                            0,
                        ],
                    },
                },
                total: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                month: '$_id.month',
                pending: 1,
                processing: 1,
                shipped: 1,
                delivered: 1,
                cancelled: 1,
                refunded: 1,
                total: 1,
            },
        },
        { $sort: { month: 1 } },
    ]);

    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];

    const fullMonthly = months.map((name, index) => {
        const m = index + 1;
        const found = monthly.find(x => x.month === m);
        return {
            month: name,
            monthNumber: m,
            pending: found ? found.pending : 0,
            processing: found ? found.processing : 0,
            shipped: found ? found.shipped : 0,
            delivered: found ? found.delivered : 0,
            cancelled: found ? found.cancelled : 0,
            refunded: found ? found.refunded : 0,
            total: found ? found.total : 0,
        };
    });

    return fullMonthly;

};
// admin top selling products by month
const getTopSellingProductsByMonth = async (query: Record<string, unknown>) => {
    const { currentMonth, currentYear, months } = getCurrentMonthYear();

    const monthName = (query.month as string) || currentMonth;
    const year = Number(query.year) || currentYear;

    const monthIndex = months.indexOf(monthName);
    if (monthIndex === -1) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Invalid month provided');
    }

    // Create date range for the specified month
    const startDate = new Date(year, monthIndex, 1);
    const endDate = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);


    const topSellingProducts = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
                paymentStatus: 'paid',
                deliveryStatus: { $nin: ['cancelled', 'returned'] },
            },
        },
        {
            $unwind: '$products',
        },
        {
            $group: {
                _id: '$products.productId',
                productName: { $first: '$products.productName' },
                totalQuantitySold: { $sum: '$products.quantity' },
                totalRevenue: { $sum: '$products.totalPrice' },
                totalProfit: { $sum: '$products.totalProfit' },
                orderCount: { $sum: 1 },
            },
        },
        {
            $sort: { totalQuantitySold: -1 },
        },
        {
            $limit: Number(query.limit) || 10,
        },
        {
            $project: {
                _id: 0,
                productId: '$_id',
                productName: 1,
                totalQuantitySold: 1,
                totalRevenue: 1,
                totalProfit: 1,
                orderCount: 1,
            },
        },
    ]);

    // Get product details for each top selling product
    const productIds = topSellingProducts.map(p => p.productId);
    const productDetails = await ProductModel.find(
        { _id: { $in: productIds } },
        'brand category images'
    ).lean();

    // Create a map for quick lookup
    const productDetailsMap = new Map(
        productDetails.map(p => [p._id.toString(), p])
    );

    // Merge product details with sales data
    const productsWithDetails: TopSellingProduct[] = topSellingProducts.map(product => {
        const details = productDetailsMap.get(product.productId.toString());
        return {
            ...product,
            productDetails: details ? {
                brand: details.brand,
                category: details.category,
                images: details.images
            } : undefined,
        };
    });

    // Calculate monthly totals
    const monthlyStats = await Order.aggregate([
        {
            $match: {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
                paymentStatus: 'paid',
                deliveryStatus: { $nin: ['cancelled', 'returned'] },
            },
        },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalPrice' },
                totalProfit: { $sum: '$totalProfit' },
            },
        },
    ]);

    const stats = monthlyStats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        totalProfit: 0,
    };

    return {
        month: monthName,
        year,
        totalOrders: stats.totalOrders,
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
        products: productsWithDetails,
    };
};
// admin customer yearly statistic
const getCustomerYearlyStatistic = async (query: Record<string, unknown>) => {
    const { currentYear, months } = getCurrentMonthYear();
    const selectedYear = query.year ? Number(query.year) : currentYear;

    const startDate = new Date(selectedYear, 0, 1);
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999);

    // Get all customers who ordered in the year
    const allCustomers = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
            },
        },
        {
            $group: {
                _id: '$customerId',
                orderCount: { $sum: 1 },
                firstOrderDate: { $min: '$createdAt' },
                orderMonths: { $addToSet: { $month: '$createdAt' } },
            },
        },
    ]);

    // Calculate monthly stats
    const monthlyBreakdown: CustomerMonthlyStats[] = [];

    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
        const monthStart = new Date(selectedYear, monthIndex, 1);
        const monthEnd = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999);

        // Get customers who ordered this month
        const monthCustomers = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: monthStart, $lte: monthEnd },
                    paymentStatus: 'paid',
                },
            },
            {
                $group: {
                    _id: '$customerId',
                    orderCount: { $sum: 1 },
                },
            },
        ]);

        // Check if each customer had orders before this month
        let returningCount = 0;
        let nonReturningCount = 0;

        for (const customer of monthCustomers) {
            const previousOrders = await Order.countDocuments({
                customerId: customer._id,
                createdAt: { $lt: monthStart },
                paymentStatus: 'paid',
            });

            if (previousOrders > 0) {
                returningCount++;
            } else {
                nonReturningCount++;
            }
        }

        const totalCustomers = monthCustomers.length;
        const returningRate = totalCustomers > 0
            ? (returningCount / totalCustomers) * 100
            : 0;

        monthlyBreakdown.push({
            month: months[monthIndex],
            returningCustomers: returningCount,
            nonReturningCustomers: nonReturningCount,
            totalCustomers,
            returningRate: parseFloat(returningRate.toFixed(2)),
        });
    }

    // Calculate overall stats
    const totalReturningCustomers = allCustomers.filter(c => c.orderCount > 1).length;
    const totalNonReturningCustomers = allCustomers.filter(c => c.orderCount === 1).length;
    const overallReturningRate = allCustomers.length > 0
        ? (totalReturningCustomers / allCustomers.length) * 100
        : 0;

    return {
        year: selectedYear,
        totalUniqueCustomers: allCustomers.length,
        totalReturningCustomers,
        totalNonReturningCustomers,
        overallReturningRate: parseFloat(overallReturningRate.toFixed(2)),
        monthlyBreakdown,
    };
};
// admin seller yearly statistic

const getSellerMonthlyOnboarding = async (query: Record<string, unknown>) => {

    const { currentYear, months } = getCurrentMonthYear()
    const selectedYear = query.year ? Number(query.year) : currentYear
    const startDate = new Date(selectedYear, 0, 1)
    const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999)

    const monthlyStats = await User.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                role: USER_ROLES.SELLER
            }
        },
        {
            $project: {
                month: { $month: '$createdAt' },
                status: '$status',
                isVerified: '$isVerified'
            }
        },
        {
            $group: {
                _id: '$month',
                totalNew: { $sum: 1 },
                verified: {
                    $sum: {
                        $cond: [
                            { $or: [{ $eq: ['$isVerified', true] }, { $eq: ['$status', 'VERIFIED'] }] },
                            1,
                            0
                        ]
                    }
                },
                pending: {
                    $sum: {
                        $cond: [{ $eq: ['$status', 'PENDING'] }, 1, 0]
                    }
                },
                rejected: {
                    $sum: {
                        $cond: [{ $in: ['$status', ['REJECTED', 'BLOCKED', 'BANNED']] }, 1, 0]
                    }
                }
            }
        },
        {
            $project: {
                _id: 0,
                month: '$_id',
                totalNew: 1,
                verified: 1,
                pending: 1,
                rejected: 1
            }
        }
    ])

    const monthMap = new Map<number, { totalNew: number; verified: number; pending: number; rejected: number }>()
    for (const item of monthlyStats) {
        monthMap.set(item.month, {
            totalNew: item.totalNew,
            verified: item.verified,
            pending: item.pending,
            rejected: item.rejected
        })
    }

    const formatted = months.map((name: string, index: number) => {
        const data = monthMap.get(index + 1) || { totalNew: 0, verified: 0, pending: 0, rejected: 0 }
        return {
            month: name,
            totalNew: data.totalNew,
            verified: data.verified,
            pending: data.pending,
            rejected: data.rejected
        }
    })
    return {
        year: selectedYear,
        monthlyReport: formatted
    }
}

// admin ratings statistics by month
const getRatingsStatisticsByMonth = async (query: Record<string, unknown>) => {
    const { currentMonth, currentYear, months } = getCurrentMonthYear();

    const selectedMonth = (query.month as string) || currentMonth;
    const selectedYear = query.year ? Number(query.year) : currentYear;

    const monthIndex = months.indexOf(selectedMonth);
    if (monthIndex === -1) {
        throw new Error('Invalid month provided');
    }

    const startDate = new Date(selectedYear, monthIndex, 1);
    const endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999);

    // Get all ratings for the month
    const ratingsStats = await Feedback.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
            },
        },
        {
            $group: {
                _id: null,
                totalRatings: { $sum: 1 },
                averageRating: { $avg: '$rating' },
                ratings: { $push: '$rating' },
            },
        },
    ]);

    const stats = ratingsStats[0] || {
        totalRatings: 0,
        averageRating: 0,
        ratings: [],
    };

    // Calculate rating breakdown (1-5 stars)
    const ratingBreakdown: RatingBreakdown[] = [1, 2, 3, 4, 5].map(rating => {
        const count = stats.ratings.filter((r: number) => r === rating).length;
        const percentage = stats.totalRatings > 0
            ? (count / stats.totalRatings) * 100
            : 0;
        return {
            rating,
            count,
            percentage: parseFloat(percentage.toFixed(2)),
        };
    });

    return {
        month: selectedMonth,
        year: selectedYear,
        totalRatings: stats.totalRatings,
        averageRating: parseFloat(stats.averageRating.toFixed(2)),
        ratingBreakdown
    };
};
// admin top selling products by month
const getTopSellersByMonth = async (query: Record<string, unknown>) => {
    const { currentMonth, currentYear, months } = getCurrentMonthYear();

    const selectedMonth = (query.month as string) || currentMonth;
    const selectedYear = query.year ? Number(query.year) : currentYear;

    const monthIndex = months.indexOf(selectedMonth);
    if (monthIndex === -1) {
        throw new Error('Invalid month provided');
    }

    const startDate = new Date(selectedYear, monthIndex, 1);
    const endDate = new Date(selectedYear, monthIndex + 1, 0, 23, 59, 59, 999);

    // Stable top sellers with populate
    const topSellers = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                deliveryStatus: { $nin: ['cancelled', 'returned'] },
            },
        },

        {
            $addFields: {
                productsSoldPerOrder: {
                    $sum: {
                        $map: {
                            input: '$products',
                            as: 'p',
                            in: { $ifNull: ['$$p.quantity', 0] },
                        },
                    },
                },
            },
        },
        {
            $group: {
                _id: '$sellerId',
                totalProfit: { $sum: { $ifNull: ['$totalProfit', 0] } },
                totalRevenue: { $sum: { $ifNull: ['$sellerAmount', 0] } },
                platformFee: { $sum: { $ifNull: ['$platformFee', 0] } },
                totalOrders: { $sum: 1 },
                productsSold: { $sum: { $ifNull: ['$productsSoldPerOrder', 0] } },
            },
        },
        {
            $sort: {
                totalProfit: -1,
                totalRevenue: -1,
                productsSold: -1,
                totalOrders: -1,
                _id: 1,
            },
        },
        { $limit: Number(query.limit) || 10 },
        {
            $lookup: {
                from: 'users',
                let: { sid: { $toObjectId: '$_id' } },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$sid'] } } },
                    { $project: { _id: 0, firstName: 1, lastName: 1, image: 1 } },
                ],
                as: 'seller',
            },
        },
        { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
        {
            $project: {
                _id: 0,
                sellerId: '$_id',
                sellerName: '$seller.firstName',
                sellerLastName: '$seller.lastName',
                sellerImage: '$seller.image',
                totalProfit: 1,
                totalRevenue: 1,
                totalOrders: 1,
                platformFee: 1,
                productsSold: 1,
            },
        },
    ]);

    // Count unique sellers in the month
    const totalSellersAgg = await Order.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                deliveryStatus: { $nin: ['cancelled', 'returned'] },
            },
        },
        { $group: { _id: '$sellerId' } },
        { $count: 'total' },
    ]);

    return {
        month: selectedMonth,
        year: selectedYear,
        totalSellers: totalSellersAgg[0]?.total || 0,
        sellers: topSellers,
    };
};


export const DashboardService = {
    productStatistic,
    getMonthlyRevenueForAdmin,
    getDailyRevenueForMonth,
    getMonthlyStatistic,
    getAdminAnalytics,
    getMonthlyOrderStatusForAdmin,
    getTopSellingProductsByMonth,
    getCustomerYearlyStatistic,
    getSellerMonthlyOnboarding,
    getRatingsStatisticsByMonth,
    getTopSellersByMonth
}
