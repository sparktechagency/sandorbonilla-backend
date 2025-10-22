import express from 'express';
import { FeedbackValidation } from './feedback.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { FeedbackController } from './feedback.controller';
import validateRequest from '../../middleware/validateRequest';

const router = express.Router();

router
    .route('/')
    .post(validateRequest(FeedbackValidation.createFeedbackZodSchema), auth(USER_ROLES.USER), FeedbackController.createFeedback)
    .get(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER, USER_ROLES.SELLER), FeedbackController.getFeedbacks);



export const FeedbackRoutes = router;