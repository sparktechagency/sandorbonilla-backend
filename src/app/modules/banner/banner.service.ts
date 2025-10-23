import { StatusCodes } from 'http-status-codes';
import { IBanner } from './banner.interface';
import { Banner } from './banner.model';
import unlinkFile from '../../../shared/unlinkFile';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';

const createBannerToDB = async (payload: IBanner): Promise<IBanner> => {
     const createBanner: any = await Banner.create(payload);
     if (!createBanner) {
          unlinkFile(payload.banner);
          throw new AppError(StatusCodes.OK, 'Failed to created banner');
     }

     return createBanner;
};

const getAllBannerFromDB = async (): Promise<IBanner[]> => {
     return await Banner.find({});
};

const updateBannerToDB = async (id: string, payload: IBanner): Promise<IBanner | {}> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Invalid ');
     }

     const isBannerExist: any = await Banner.findById(id);

     if (payload.banner && isBannerExist?.banner) {
          unlinkFile(isBannerExist?.banner);
     }

     const banner: any = await Banner.findOneAndUpdate({ _id: id }, payload, { new: true });
     return banner;
};

const deleteBannerToDB = async (id: string): Promise<IBanner | undefined> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Invalid ');
     }

     const isBannerExist: any = await Banner.findById({ _id: id });

     //delete from folder
     if (isBannerExist) {
          unlinkFile(isBannerExist?.banner);
     }

     //delete from database
     await Banner.findByIdAndDelete(id);
     return;
};

export const BannerService = {
     createBannerToDB,
     getAllBannerFromDB,
     updateBannerToDB,
     deleteBannerToDB,
};
