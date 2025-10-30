import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { AddToCartService } from "./addToCart.service"

const getMyCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await AddToCartService.getCartByUser(id)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart retrieved successfully',
        data: result,
    });
})
const addItem = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    req.body.userId = id
    const result = await AddToCartService.addItemToCart(req.body)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart item added successfully',
        data: result,
    });
})
const setItemInCart = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    req.body.userId = id
    const result = await AddToCartService.setItemInCart(req.body)
    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: 'Cart item added successfully',
        data: result,
    });
})
export const AddToCartController = { getMyCart }