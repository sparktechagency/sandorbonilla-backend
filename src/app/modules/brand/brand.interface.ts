import { Types } from 'mongoose';
import { Model } from 'mongoose';


export type IBrand = {
     name: string;
     subCategoryId: Types.ObjectId;
};

export type BrandModel = Model<IBrand, Record<string, unknown>>;
