import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();


router.get('/seller-products-analysis', auth(USER_ROLES.SELLER), DashboardController.productStatistic)

export const DashboardRouter = router;