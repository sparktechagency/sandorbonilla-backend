import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { SubCategoryService } from './subCategory.service';

const createSubCategory = catchAsync(async (req, res) => {
     const result = await SubCategoryService.createSubCategoryToDB(req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'SubCategory create successfully',
          data: result,
     });
});

const getSubCategories = catchAsync(async (req, res) => {
     const categoryId = req.params.categoryId;
     const result = await SubCategoryService.getSubCategoriesFromDB(categoryId);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'SubCategory retrieved successfully',
          data: result,
     });
});

const updateSubCategory = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await SubCategoryService.updateSubCategoryToDB(id, req.body);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Category updated successfully',
          data: result,
     });
});

const deleteSubCategory = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await SubCategoryService.deleteSubCategoryToDB(id);

     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'SubCategory delete successfully',
          data: result,
     });
});

const getAllSubCategoriesForAdmin = catchAsync(async (req, res) => {
     const result = await SubCategoryService.getAllSubCategoriesForAdminFromDB(req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'SubCategories retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

export const SubCategoryController = {
     createSubCategory,
     getSubCategories,
     updateSubCategory,
     deleteSubCategory,
     getAllSubCategoriesForAdmin,
};
