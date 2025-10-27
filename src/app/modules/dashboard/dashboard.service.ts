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

export const DashboardService = {
    productStatistic
}
