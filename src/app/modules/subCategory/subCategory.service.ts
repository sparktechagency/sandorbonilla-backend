import { StatusCodes } from 'http-status-codes';
import { ICategory } from './category.interface';
import { Category } from './subCategory.model';
import unlinkFile from '../../../shared/unlinkFile';
import AppError from '../../../errors/AppError';
import QueryBuilder from '../../builder/QueryBuilder';

const createCategoryToDB = async (payload: ICategory) => {
     const { name, thumbnail } = payload;
     const isExistName = await Category.findOne({ name: name });

     if (isExistName) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }

     const createCategory: any = await Category.create(payload);
     if (!createCategory) {
          unlinkFile(thumbnail);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
     }

     return createCategory;
};

const getCategoriesFromDB = async (): Promise<ICategory[]> => {
     const result = await Category.find({});
     return result;
};

const updateCategoryToDB = async (id: string, payload: ICategory) => {
     const isExistCategory: any = await Category.findById(id);

     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }

     if (payload.thumbnail && isExistCategory?.thumbnail) {
          unlinkFile(isExistCategory?.thumbnail);
     }

     const updateCategory = await Category.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });

     return updateCategory;
};

const deleteCategoryToDB = async (id: string): Promise<ICategory | null> => {
     const deleteCategory = await Category.findByIdAndDelete(id);
     if (!deleteCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     return deleteCategory;
};

const getAllCategoriesForAdminFromDB = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Category.find({}), query)
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

export const CategoryService = {
     createCategoryToDB,
     getCategoriesFromDB,
     updateCategoryToDB,
     deleteCategoryToDB,
     getAllCategoriesForAdminFromDB
};
