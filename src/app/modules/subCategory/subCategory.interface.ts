import { Model, Types } from 'mongoose';

export type ISubCategory = {
     name: string;
     categoryId: Types.ObjectId;
     thumbnail: string;
     isDeleted: boolean;
};

export type SubCategoryModel = Model<ISubCategory, Record<string, unknown>>;
