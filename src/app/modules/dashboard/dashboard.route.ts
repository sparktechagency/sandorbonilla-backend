import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { DashboardController } from './dashboard.controller';

const router = express.Router();


router.get('/seller-products-analysis', auth(USER_ROLES.SELLER), DashboardController.productStatistic)
router.get('/seller-daily-revenue-for-month', auth(USER_ROLES.SELLER), DashboardController.dailyRevenueForMonth)
router.get('/seller-monthly-statistic', auth(USER_ROLES.SELLER), DashboardController.monthlyStatistic)
router.get('/admin-analytics', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DashboardController.adminAnalytics)
router.get('/admin-orders-statistic', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DashboardController.orderStatistic)
router.get('/admin-monthly-orders-status', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DashboardController.monthlyOrderStatusForAdmin)
router.get('/admin-top-selling-products', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DashboardController.topSellingProductsByMonth)


export const DashboardRouter = router;