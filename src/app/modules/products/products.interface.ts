import { Types } from "mongoose";

interface ISizeType {
  size: string;
  price: number;
}

export interface IProduct extends Document {
  category: string;
  categoryId: Types.ObjectId;
  subCategory: string;
  subCategoryId: Types.ObjectId;
  productImage: string[];
  productName: string;
  model: string;
  brand: string;
  color: string[];
  sizeType: ISizeType[];
  purchasePrice: number;
  profitPrice: number;
  quantity: number;
  specialCategory: string;
  details: string;
  createdAt?: string;
  updatedAt?: string;
}