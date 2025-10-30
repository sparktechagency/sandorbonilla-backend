import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { AddToCartService } from "./addToCart.service"

const getMyCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await AddToCartService.getCartByUser(id)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart retrived Successfully',
        data: result,
    });
})
export const AddToCartController = {}