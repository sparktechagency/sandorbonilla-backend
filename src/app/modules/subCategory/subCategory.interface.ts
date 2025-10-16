import { Model } from 'mongoose';

export type ISubCategory = {
     name: string;
     categoryId: string;
     thumbnail: string;
     isDeleted: boolean;
};

export type SubCategoryModel = Model<ISubCategory, Record<string, unknown>>;
