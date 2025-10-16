import { Types } from "mongoose";

interface ISizeType {
    size: string;
    price: number;
    quantity: number;
    purchasePrice: number;
    profit: number;
}

export interface IProduct {
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
    details: string;
    isDeleted: boolean;
}