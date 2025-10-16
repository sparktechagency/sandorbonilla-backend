import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BrandService } from './brand.service';

const createBrand = catchAsync(async (req, res) => {
     const result = await BrandService.createBrandToDB(req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Brand create successfully',
          data: result,
     });
});

const getBrands = catchAsync(async (req, res) => {
     const result = await BrandService.getBrandsFromDB();
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Brand retrieved successfully',
          data: result,
     });
});

const updateBrand = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await BrandService.updateBrandToDB(id, req.body);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Brand updated successfully',
          data: result,
     });
});

const deleteBrand = catchAsync(async (req, res) => {
     const id = req.params.id;
     const result = await BrandService.deleteBrandToDB(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Brand delete successfully',
          data: result,
     });
});

const getAllBrandsForAdmin = catchAsync(async (req, res) => {
     const result = await BrandService.getAllBrandsForAdminFromDB(req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Brands retrieved successfully',
          data: result.result,
          meta: result.meta,
     });
});

export const BrandController = {
     createBrand,
     getBrands,
     updateBrand,
     deleteBrand,
     getAllBrandsForAdmin,
};
