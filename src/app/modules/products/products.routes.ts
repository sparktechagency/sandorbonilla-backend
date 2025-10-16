import express from 'express';
import { ProductsController } from './products.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { ProductValidation } from './products.validation';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = express.Router();
router.post('/create', auth(USER_ROLES.SELLER), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGES), validateRequest(ProductValidation.productCreateSchema), ProductsController.createProduct);
router.get('/', auth(USER_ROLES.USER), ProductsController.getAllProducts);
router.get('/get-all-for-admin', auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), ProductsController.getAllProductsForAdmin);
router.get('/get-all-for-seller', auth(USER_ROLES.SELLER), ProductsController.getAllProductsForSeller)
router.get('/single/:id', auth(USER_ROLES.USER, USER_ROLES.SELLER, USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), ProductsController.getProductById);
router.patch('/update/:id', auth(USER_ROLES.SELLER),fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGES), validateRequest(ProductValidation.productUpdateSchema), ProductsController.updateProducts);
router.delete('/delete/:id', auth(USER_ROLES.SELLER, USER_ROLES.SUPER_ADMIN), ProductsController.deleteProducts);

export const ProductRoutes = router;