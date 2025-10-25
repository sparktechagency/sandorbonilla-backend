import { StatusCodes } from 'http-status-codes';
import { ISubCategory } from './subCategory.interface';
import { SubCategory } from './subCategory.model';
import unlinkFile from '../../../shared/unlinkFile';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';
import { Category } from '../category/category.model';

const createSubCategoryToDB = async (payload: ISubCategory) => {
     const { name, thumbnail, categoryId } = payload;
     const isExistName = await SubCategory.findOne({ name: name });

     if (isExistName) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }
     const isExistCategory = await Category.findById(categoryId);
     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }

     const createSubCategory: any = await SubCategory.create(payload);
     if (!createSubCategory) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create SubCategory');
     }
     await Category.findByIdAndUpdate(
          categoryId,
          {
               $push: { subCategory: createSubCategory._id },
          },
          { new: true },
     );

     return createSubCategory;
};

const getSubCategoriesFromDB = async (categoryId: string): Promise<ISubCategory[]> => {
     const result = await SubCategory.find({ categoryId });
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
     await Category.findByIdAndUpdate(
          deleteSubCategory.categoryId,
          {
               $pull: { subCategory: id },
          },
          { new: true },
     );
     return {};
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
