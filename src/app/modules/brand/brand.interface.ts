import { Types } from 'mongoose';
import { Model } from 'mongoose';


export type IBrand = {
     name: string;
     image: string;
};

export type BrandModel = Model<IBrand, Record<string, unknown>>;
