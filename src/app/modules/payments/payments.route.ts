import express from 'express';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { PaymentController } from './payments.controller';
const router = express.Router();


router.get("/my-transactions-history", auth(USER_ROLES.USER), PaymentController.getMyTransactions);
router.get("/seller-transactions-history", auth(USER_ROLES.USER), PaymentController.getSellerTransactions);


export const PaymentRouter = router;