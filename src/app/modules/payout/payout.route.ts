import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { PayoutController } from './payout.controller';
const router = express.Router();

// Payout request routes
router.post(
    '/seller-request-payout',
    auth(USER_ROLES.SELLER),
    PayoutController.requestPayout
);

router.get(
    '/seller-payout-requests',
    auth(USER_ROLES.SELLER),
    PayoutController.getPayoutRequests
);

// Admin payout management routes
router.get(
    '/payout-requests',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PayoutController.getAllPayoutRequests
);

router.get(
    '/payout-requests/:id',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PayoutController.getPayoutRequestById
);

router.patch(
    '/payout-requests/:id/approve',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PayoutController.approvePayoutRequest
);

router.patch(
    '/payout-requests/:id/reject',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PayoutController.rejectPayoutRequest
);

router.post(
    '/payout-requests/:id/transfer',
    auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
    PayoutController.processTransfer
);
export const PayoutRoutes = router;
