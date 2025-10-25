import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { SubCategoryController } from './subCategory.controller';
import { SubCategoryValidation } from './subCategory.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
const router = express.Router();

router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), validateRequest(SubCategoryValidation.createSubCategoryZodSchema), SubCategoryController.createSubCategory);
router.get('/all-for-admin', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), SubCategoryController.getAllSubCategoriesForAdmin);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), SubCategoryController.updateSubCategory)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), SubCategoryController.deleteSubCategory);

router.get('/:categoryId', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SELLER), SubCategoryController.getSubCategories);

export const SubCategoryRoutes = router;
