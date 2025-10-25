import { StatusCodes } from 'http-status-codes';
import { IBrand } from './brand.interface';
import { Brand } from './brand.model';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { SubCategory } from '../subCategory/subCategory.model';

const createBrandToDB = async (payload: IBrand) => {
     const { name } = payload;
     const isExistName = await Brand.findOne({ name: name });
     if (isExistName) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Brand Name Already Exist');
     }
     const createBrand: any = await Brand.create(payload);

     if (!createBrand) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Brand');
     }
     return createBrand;
};

const getBrandsFromDB = async (): Promise<IBrand[]> => {
     const result = await Brand.find({});
     return result;
};

const updateBrandToDB = async (id: string, payload: Partial<IBrand>) => {
     const isExistBrand: any = await Brand.findById(id);

     if (!isExistBrand) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Brand doesn't exist");
     }

     if (!payload.image) {
          delete payload.image
     }

     const updateBrand = await Brand.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });
     if (!updateBrand) {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to update Brand');
     }
     return updateBrand;
};

const deleteBrandToDB = async (id: string) => {
     const deleteBrand = await Brand.findByIdAndDelete(id);
     if (!deleteBrand) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Brand doesn't exist");
     }
     return {};
};

const getAllBrandsForAdminFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Brand.find({}), query)
          .filter()
          .sort()
          .paginate()
          .search(['name'])
          .fields();
     const result = await queryBuilder.modelQuery.exec();
     const meta = await queryBuilder.countTotal();


     return {
          result,
          meta,
     };
};

export const BrandService = {
     createBrandToDB,
     getBrandsFromDB,
     updateBrandToDB,
     deleteBrandToDB,
     getAllBrandsForAdminFromDB
};
