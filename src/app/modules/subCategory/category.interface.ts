import { Model } from 'mongoose';

export type ICategory = {
     name: string;
     thumbnail: string;
     isDeleted: boolean;
};

export type CategoryModel = Model<ICategory, Record<string, unknown>>;
