import { Feedback } from "../feedback/feedback.model"
import { Order } from "../order/order.model"
import { ProductModel } from "../products/products.model"

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
const transactionUpdate = async (id: string) => {
    const transaction = await Order.find({ sellerId: id, paymentStatus: "paid", deliveryStatus: "processing" });

}
const getMonthlyRevenueForSeller = async (sellerId: string, query: Record<string, unknown>) => {
    try {    
        const matchCondition: any = {
            sellerId: sellerId,
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
                    totalOrders: { $sum: 1 },
                    totalProducts: { $sum: { $size: '$products' } },
                },
            },
            {
                $project: {
                    _id: 0,
                    month: '$_id.month',
                    totalRevenue: 1,
                    totalOrders: 1,
                    totalProducts: 1,
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
                totalOrders: found ? found.totalOrders : 0,
                totalProducts: found ? found.totalProducts : 0,
            };
        });

        return fullMonthlyRevenue;
    } catch (error) {
        console.error('Error in getMonthlyRevenueForSeller:', error);
        return [];
    }
};
export const DashboardService = {
    productStatistic,
    getMonthlyRevenueForSeller
}
