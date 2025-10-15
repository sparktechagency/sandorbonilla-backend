import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { ProductsService } from "./products.service";

const createProduct = catchAsync(async (req, res) => {
    const product = req.body;
    const result = await ProductsService.createProduct(product);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.CREATED,
        message: 'Product created successfully',
        data: result,
    });
})

export const ProductsController = {
    createProduct,
    // getAllProducts,
    // getProductById,
    // updateProduct,
    // deleteProduct,
}