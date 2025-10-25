import { StatusCodes } from "http-status-codes";
import AppError from "../../../errors/AppError";
import QueryBuilder from "../../builder/QueryBuilder";
import { Bookmark } from "../bookmark/bookmark.model";
import { IProduct } from "./products.interface";
import { ProductModel } from "./products.model";
import { User } from "../user/user.model";
import { USER_ROLES } from "../../../enums/user";
import unlinkFile from "../../../shared/unlinkFile";

const createProduct = async (product: IProduct) => {
    return await ProductModel.create(product);
}
const getAllProducts = async (userId: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(ProductModel.find().populate('categoryId').populate('sellerId', "image firstName lastName"), query)
    const products = await queryBuilder.fields().paginate().filter().sort().search(['name', 'description', "category"]).modelQuery.exec()

    const productsWithBookmark = Promise.all(products.map(async (product) => {
        const isBookmarked = await Bookmark.exists({
            userId: userId,
            referenceId: product._id,
        });
        return {
            ...product.toObject(),
            isBookmarked,
        };
    }));
    const meta = await queryBuilder.countTotal()

    return {
        products: await productsWithBookmark,
        meta,
    };
}
const getAllProductsForAdmin = async (query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(ProductModel.find().populate('categoryId').populate('sellerId', "image firstName lastName"), query)
    const products = await queryBuilder.fields().paginate().filter().sort().search(['name', 'description', "category"]).modelQuery.exec()
    const meta = await queryBuilder.countTotal()
    return {
        products,
        meta,
    };
}
const getAllProductsForSeller = async (sellerId: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(ProductModel.find({ sellerId }).populate('categoryId').populate('sellerId', "image firstName lastName"), query)
    const products = await queryBuilder.fields().paginate().filter().sort().search(['name', 'description', "category"]).modelQuery.exec()
    const meta = await queryBuilder.countTotal()
    return {
        products,
        meta,
    };
}
const getProductById = async (id: string) => {
    return await ProductModel.findById(id).populate('categoryId');
}

const updateProducts = async (id: string, sellerId: string, payload: Partial<IProduct>) => {
    const product = await ProductModel.findById(id);
    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Product not found!');
    }
    if (product.sellerId.toString() !== sellerId) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to update this product!');
    }
    if (payload.images && product?.images) {
        unlinkFile(product?.images);
    }
    return await ProductModel.findByIdAndUpdate(id, { ...payload }, { new: true });
}
const deleteProducts = async (id: string, sellerId: string) => {
    const isAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN })
    const product = await ProductModel.findById(id);
    if (!product) {
        throw new AppError(StatusCodes.NOT_FOUND, 'Product not found!');
    }
    if (product?.isDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Product is already deleted!');
    }
    if (product.sellerId.toString() !== sellerId && !isAdmin) {
        throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to delete this product!');
    }
    const isProductDeleted = await ProductModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true });

    if (!isProductDeleted) {
        throw new AppError(StatusCodes.BAD_REQUEST, 'Product deletion failed!');
    }
    return {}
}
const getSellerInfo = async (sellerId: string) => {
    return await User.findById(sellerId).select("image firstName lastName email phone registrationNo shopName address");
}
export const ProductsService = {
    createProduct,
    getAllProducts,
    getProductById,
    updateProducts,
    deleteProducts,
    getAllProductsForAdmin,
    getAllProductsForSeller,
    getSellerInfo,
}