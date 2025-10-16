import QueryBuilder from "../../builder/QueryBuilder";
import { Bookmark } from "../bookmark/bookmark.model";
import { IProduct } from "./products.interface";
import { ProductModel } from "./products.model";

const createProduct = async (product: IProduct) => {
    return await ProductModel.create(product);
}
const getAllProducts = async (userId: string, query: Record<string, unknown>) => {
    const queryBuilder = new QueryBuilder(ProductModel.find().populate('categoryId'), query)
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
const getProductById = async (id: string) => {
    return await ProductModel.findById(id).populate('categoryId');
}

const updateProducts = async (id: string, payload: Partial<IProduct>)=>{
    
}
export const ProductsService = {
    createProduct,
    getAllProducts,
    getProductById,
    // updateProduct,
    // deleteProduct,
}