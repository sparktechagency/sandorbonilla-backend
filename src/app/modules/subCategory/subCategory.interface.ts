import { Model, Types } from 'mongoose';

export type ISubCategory = {
     name: string;
     categoryId: Types.ObjectId;
     isDeleted: boolean;
};

export type SubCategoryModel = Model<ISubCategory, Record<string, unknown>>;
