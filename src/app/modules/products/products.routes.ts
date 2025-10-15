import express from 'express';
import { ProductsController } from './products.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import validateRequest from '../../middleware/validateRequest';
import { ProductValidation } from './products.validation';

const router = express.Router();

router.post('/create-product', auth(USER_ROLES.SELLER), validateRequest(ProductValidation.productCreateSchema), ProductsController.createProduct);

