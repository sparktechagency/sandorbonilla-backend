import express from 'express';
import { AdminPayoutController } from './admin.payout.controller';
import auth from '../../middlewares/auth';
import { ENUM_USER_ROLE } from '../../../enums/user';

const router = express.Router();

// Admin payout management routes
router.get(
    '/payout-requests',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminPayoutController.getAllPayoutRequests
);

router.get(
    '/payout-requests/:id',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminPayoutController.getPayoutRequestById
);

router.patch(
    '/payout-requests/:id/approve',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminPayoutController.approvePayoutRequest
);

router.patch(
    '/payout-requests/:id/reject',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminPayoutController.rejectPayoutRequest
);

router.post(
    '/payout-requests/:id/transfer',
    auth(ENUM_USER_ROLE.ADMIN, ENUM_USER_ROLE.SUPER_ADMIN),
    AdminPayoutController.processTransfer
);

export const AdminPayoutRoutes = router;