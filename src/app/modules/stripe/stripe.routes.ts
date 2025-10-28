import express from 'express';
import { StripeOnboardingController } from './stripe.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';


const router = express.Router();

// Seller account management routes
router.post(
    '/connect-account',
    auth(USER_ROLES.SELLER),
    StripeOnboardingController.createConnectAccount
);

router.get(
    '/account-link',
    auth(USER_ROLES.SELLER),
    StripeOnboardingController.getAccountLink
);

router.get(
    '/login-link',
    auth(USER_ROLES.SELLER),
    StripeOnboardingController.getLoginLink
);

router.get(
    '/account-status',
    auth(USER_ROLES.SELLER),
    StripeOnboardingController.getAccountStatus
);
router.get('/refresh')


export const StripeOnboardingRoutes = router;