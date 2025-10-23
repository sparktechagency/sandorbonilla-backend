import { Model } from 'mongoose';

export type IBanner = {
     name: string;
     banner: string;
};

export type BannerModel = Model<IBanner>;
