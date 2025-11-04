import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { NotificationController } from './notification.controller';
import auth from '../../middleware/auth';
const router = express.Router();

router.get('/', auth(USER_ROLES.SELLER, USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), NotificationController.getNotificationFromDB);
router.patch('/', auth(USER_ROLES.USER, USER_ROLES.SELLER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), NotificationController.readNotification);
router.patch('/single/:id', auth(USER_ROLES.USER), NotificationController.readSingleNotification);
router.patch('/send-notifications', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), NotificationController.sendAdminPushNotification);

export const NotificationRoutes = router;
