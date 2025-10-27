import { Feedback } from "../feedback/feedback.model"
import { Order } from "../order/order.model"
import { ProductModel } from "../products/products.model"

const productStatistic = async (id: string) => {
    const totalProducts = await ProductModel.find({ sellerId: id }).select("_id")
    const storedItems = await ProductModel.countDocuments({ sellerId: id })
    const activeOrder = await Order.countDocuments({ sellerId: id, status: 'processing' })
    const deliveredOrder = await Order.countDocuments({ sellerId: id, status: 'delivered' })
    const cancelledOrder = await Order.countDocuments({ sellerId: id, status: 'cancelled' })
    const totalRating = await Feedback.find({ productId: { $in: totalProducts.map(item => item._id) } }).countDocuments()

    return {
        storedItems,
        activeOrder,
        deliveredOrder,
        cancelledOrder,
        totalRating
    }
}

export const DashboardService = {
    productStatistic
}
