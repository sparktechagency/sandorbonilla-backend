import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { PayoutController } from './payout.controller';
const router = express.Router();

// Payout request routes
router.post(
    '/request-payout',
    auth(USER_ROLES.SELLER),
    PayoutController.requestPayout
);

router.get(
    '/payout-requests',
    auth(USER_ROLES.SELLER),
    PayoutController.getPayoutRequests
);
export const PayoutRoutes = router;
