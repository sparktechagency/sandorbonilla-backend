import { IProduct } from "./products.interface";
import { ProductModel } from "./products.model";

const createProduct = async (product: IProduct) => {
    return await ProductModel.create(product);
}

export const ProductsService = {
    createProduct,
    // getAllProducts,
    // getProductById,
    // updateProduct,
    // deleteProduct,
}