import { Types } from "mongoose";

interface ISizeType {
    size: string;
    price: number;
    quantity: number;
    discount: number;
    purchasePrice: number;
    profit: number;
}

export interface IProduct {
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
    sizeType?: ISizeType[];
    quantity: number;
    specialCategory: string;
    overview: string;
    highlights: string;
    techSpecs: string;
    status: string;
    totalStock: number;
    rating: number;
    reviewCount: number;
    isDeleted: boolean;
}