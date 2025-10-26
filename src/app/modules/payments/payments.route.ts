import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { PaymentController } from './payments.controller';
const router = express.Router();


router.get("/my-transactions", auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN, USER_ROLES.SELLER, USER_ROLES.USER), PaymentController.getMyTransactions);


export const PaymentRouter = router;