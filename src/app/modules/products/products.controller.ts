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
const getAllProducts = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await ProductsService.getAllProducts(id, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta,
    });
})
const getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await ProductsService.getProductById(id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product retrieved successfully',
        data: result,
    });
})
export const ProductsController = {
    createProduct,
    getAllProducts,
    // getProductById,
    // updateProduct,
    // deleteProduct,
}