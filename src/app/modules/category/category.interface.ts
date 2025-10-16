import { Types } from 'mongoose';
import { Model } from 'mongoose';


export type ICategory = {
     name: string;
     thumbnail: string;
     subCategory: Types.ObjectId[];
     isDeleted: boolean;
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;
