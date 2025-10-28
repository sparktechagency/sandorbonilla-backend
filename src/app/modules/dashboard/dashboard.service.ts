import { USER_ROLES } from "../../../enums/user";
import { Feedback } from "../feedback/feedback.model"
import { Order } from "../order/order.model"
import { ProductModel } from "../products/products.model"
import { User } from "../user/user.model";

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

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const toMonthIndex = (m: unknown): number => {
        if (m == null) return currentMonthIndex;
        if (typeof m === 'number') {
            if (m >= 1 && m <= 12) return m - 1;
            throw new Error('Invalid month number');
        }
        const s = String(m).trim().toLowerCase();
        let idx = monthNames.findIndex(n => n.toLowerCase() === s);
        if (idx !== -1) return idx;
        idx = monthNames.findIndex(n => n.slice(0, 3).toLowerCase() === s.slice(0, 3));
        if (idx !== -1) return idx;
        throw new Error('Invalid month name');
    };
    const monthIndex = toMonthIndex(query?.month);


    const yearNum = Number(query?.year ?? currentYear);
    if (!Number.isInteger(yearNum)) throw new Error('Invalid year');

    const start = new Date(yearNum, monthIndex, 1, 0, 0, 0, 0);
    const next = new Date(yearNum, monthIndex + 1, 1, 0, 0, 0, 0);

    const agg = await Order.aggregate([
        {
            $match: {
                sellerId,
                paymentStatus: 'paid',
                deliveryStatus: { $ne: 'cancelled' },
                createdAt: { $gte: start, $lt: next }
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

    const daysInMonth = new Date(yearNum, monthIndex + 1, 0).getDate();
    const byDay = new Map<number, { income: number; returnCost: number; profit: number }>();
    for (const r of agg) byDay.set(r.day, r);

    const chartData = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const found = byDay.get(d);
        return {
            day: d,
            date: new Date(yearNum, monthIndex, d).toISOString().split('T')[0],
            income: found ? found.income : 0,
            returnCost: found ? found.returnCost : 0,
            profit: found ? found.profit : 0
        };
    });

    const incomeSum = chartData.reduce((s, x) => s + x.income, 0);
    const returnSum = chartData.reduce((s, x) => s + x.returnCost, 0);
    const profitSum = chartData.reduce((s, x) => s + x.profit, 0);

    return {
        month: monthNames[monthIndex],
        year: yearNum,
        summary: {
            income: incomeSum,
            returnCost: returnSum,
            profit: profitSum
        },
        chartData
    };
};
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
    } catch (error) {
        console.error("Error fetching admin analytics:", error);
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
const getMonthlyRevenueForAdmin = async (query: Record<string, unknown>) => {
    try {
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
    } catch (error) {
        console.error('Error in getMonthlyRevenueForSeller:', error);
        return [];
    }
};

const getMonthlyOrderStatusForAdmin = async (query: Record<string, unknown>) => {
    try {
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

        // No paymentStatus or deliveryStatus filter here
        // We want to count all orders by their status
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
    } catch (error) {
        console.error('Error in getMonthlyOrderStatusForAdmin:', error);
        return [];
    }
};

export const DashboardService = {
    productStatistic,
    getMonthlyRevenueForAdmin,
    getDailyRevenueForMonth,
    getMonthlyStatistic,
    getAdminAnalytics,
    getMonthlyOrderStatusForAdmin,
}
