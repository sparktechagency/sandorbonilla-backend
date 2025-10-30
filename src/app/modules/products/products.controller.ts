import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse";
import { ProductsService } from "./products.service";

const createProduct = catchAsync(async (req, res) => {
    const product = req.body;
    const { id } = req.user as { id: string }
    product.sellerId = id;
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
const getAllPopularProducts = catchAsync(async (req, res) => {
    const result = await ProductsService.getAllPopularProducts(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Popular products retrieved successfully',
        data: result.products,
        meta: result.meta,
    });
})
const getProductById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: userId } = req.user as { id: string }
    const result = await ProductsService.getProductById(userId,id);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product retrieved successfully',
        data: result,
    });
})
const updateProducts = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: sellerId } = req.user as { id: string }
    const result = await ProductsService.updateProducts(id, sellerId, req.body);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product updated successfully',
        data: result,
    });
})
const deleteProducts = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { id: sellerId } = req.user as { id: string }
    const result = await ProductsService.deleteProducts(id, sellerId);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product deleted successfully',
        data: result,
    });
})
const getAllProductsForAdmin = catchAsync(async (req, res) => {
    const result = await ProductsService.getAllProductsForAdmin(req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta,
    });
})
const getAllProductsForSeller = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await ProductsService.getAllProductsForSeller(id, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta,
    });
})
const getSellerInfo = catchAsync(async (req, res) => {
    const { sellerId } = req.params;
    const result = await ProductsService.getSellerInfo(sellerId);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Seller info retrieved successfully',
        data: result,
    });
})
const getSellerProducts = catchAsync(async (req, res) => {
    const { sellerId } = req.params;
    const { id } = req.user as { id: string }
    const result = await ProductsService.getSellerProducts(id, sellerId, req.query);
    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Products retrieved successfully',
        data: result.products,
        meta: result.meta,
    });
})
export const ProductsController = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProducts,
    deleteProducts,
    getAllProductsForAdmin,
    getAllProductsForSeller,
    getSellerInfo,
    getSellerProducts,
    getAllPopularProducts
}