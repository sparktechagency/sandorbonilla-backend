import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { BrandController } from './brand.controller';
import { BrandValidation } from './brand.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
const router = express.Router();

router.post('/create', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), validateRequest(BrandValidation.createBrandZodSchema), BrandController.createBrand);
router.get('/all-for-admin', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), BrandController.getAllBrandsForAdmin);
router
     .route('/:id')
     .patch(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGE), BrandController.updateBrand)
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), BrandController.deleteBrand);

router.get('/', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SELLER), BrandController.getBrands);

export const BrandRoutes = router;
