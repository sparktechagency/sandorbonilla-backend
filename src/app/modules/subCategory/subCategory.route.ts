import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { SubCategoryController } from './subCategory.controller';
import { SubCategoryValidation } from './subCategory.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
const router = express.Router();

router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.THUMBNAIL), validateRequest(SubCategoryValidation.createSubCategoryZodSchema), SubCategoryController.createSubCategory);
router.get('/all-for-admin', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), SubCategoryController.getAllSubCategoriesForAdmin);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.THUMBNAIL), SubCategoryController.updateSubCategory)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), SubCategoryController.deleteSubCategory);

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SELLER), SubCategoryController.getSubCategories);

export const SubCategoryRoutes = router;
