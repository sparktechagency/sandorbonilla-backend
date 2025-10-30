import express from 'express';
import { WalletController } from './wallet.controller';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

// Routes for seller wallet
router.get('/balance', auth(USER_ROLES.SELLER), WalletController.getWalletBalance);
router.get('/transactions', auth(USER_ROLES.SELLER), WalletController.getTransactionHistory);

export const WalletRoutes = router;