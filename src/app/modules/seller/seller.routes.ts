import express from 'express';
import { SellerController } from './seller.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';


const router = express.Router();

// Seller account management routes
router.post(
    '/connect-account',
    auth(USER_ROLES.SELLER),
    SellerController.createConnectAccount
);

router.get(
    '/account-link',
    auth(USER_ROLES.SELLER),
    SellerController.getAccountLink
);

router.get(
    '/login-link',
    auth(USER_ROLES.SELLER),
    SellerController.getLoginLink
);

router.get(
    '/account-status',
    auth(USER_ROLES.SELLER),
    SellerController.getAccountStatus
);

// Payout request routes
router.post(
    '/request-payout',
    auth(USER_ROLES.SELLER),
    SellerController.requestPayout
);

router.get(
    '/payout-requests',
    auth(USER_ROLES.SELLER),
    SellerController.getPayoutRequests
);

export const SellerRoutes = router;