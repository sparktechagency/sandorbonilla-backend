import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();


router.get('/seller-products-analysis', auth(USER_ROLES.SELLER), DashboardController.productStatistic)
router.get('/seller-orders-analysis', auth(USER_ROLES.SELLER), DashboardController.orderStatistic)

export const DashboardRouter = router;