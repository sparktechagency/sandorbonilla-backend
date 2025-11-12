import express from 'express';
import { FeedbackValidation } from './feedback.validation';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';
import { FeedbackController } from './feedback.controller';
import validateRequest from '../../middleware/validateRequest';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = express.Router();

router
    .route('/create')
    .post(auth(USER_ROLES.USER), fileUploadHandler(), parseFileData(FOLDER_NAMES.IMAGES), validateRequest(FeedbackValidation.createFeedbackZodSchema), FeedbackController.createFeedback)

router.get("/stats", auth(USER_ROLES.USER, USER_ROLES.SELLER), FeedbackController.getSellerRatingStats);
// Get seller's rating
router.get("/seller/:sellerId", auth(USER_ROLES.USER, USER_ROLES.SELLER), FeedbackController.getSellerRating);

router.get("/:productId", auth(USER_ROLES.USER, USER_ROLES.SELLER), FeedbackController.getFeedbacks);



export const FeedbackRoutes = router;