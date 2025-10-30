import { Types } from "mongoose";
interface IProducts {
    sellerId: Types.ObjectId;
    category: string;
    categoryId: Types.ObjectId;
    subCategory: string;
    subCategoryId: Types.ObjectId;
    images: string[];
    name: string;
    model: string;
    brand: string;
    color: string[];
    quantity: number;
    specialCategory: string;
    overview: string;
    highlights: string;
    techSpecs: string;
    status: string;
    totalStock: number;
    rating: number;

}
interface IAddToCart {
    userId: Types.ObjectId;
    products:
}