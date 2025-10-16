import { StatusCodes } from 'http-status-codes';
import { ISubCategory } from './subCategory.interface';
import { SubCategory } from './subCategory.model';
import unlinkFile from '../../../shared/unlinkFile';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';

const createSubCategoryToDB = async (payload: ISubCategory) => {
     const { name, thumbnail } = payload;
     const isExistName = await SubCategory.findOne({ name: name });

     if (isExistName) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }

     const createSubCategory: any = await SubCategory.create(payload);
     if (!createSubCategory) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create SubCategory');
     }

     return createSubCategory;
};

const getSubCategoriesFromDB = async (): Promise<ISubCategory[]> => {
     const result = await SubCategory.find({});
     return result;
};

const updateSubCategoryToDB = async (id: string, payload: ISubCategory) => {
     const isExistSubCategory: any = await SubCategory.findById(id);

     if (!isExistSubCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "SubCategory doesn't exist");
     }

     if (payload.thumbnail && isExistSubCategory?.thumbnail) {
          unlinkFile(isExistSubCategory?.thumbnail);
     }

     const updateCategory = await SubCategory.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

     return updateCategory;
};

const deleteSubCategoryToDB = async (id: string) => {
     const deleteSubCategory = await SubCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
     if (!deleteSubCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "SubCategory doesn't exist");
     }
     return deleteSubCategory;
};

const getAllSubCategoriesForAdminFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(SubCategory.find({}), query)
          .filter()
          .sort()
          .paginate()
          .fields();
     const result = await queryBuilder.modelQuery.exec();
     const meta = await queryBuilder.countTotal();
     return {
          result,
          meta,
     };
};

export const SubCategoryService = {
     createSubCategoryToDB,
     getSubCategoriesFromDB,
     updateSubCategoryToDB,
     deleteSubCategoryToDB,
     getAllSubCategoriesForAdminFromDB
};
