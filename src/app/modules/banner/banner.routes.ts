import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { BannerController } from './banner.controller';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';

const router = express.Router();

router
     .route('/')
     .post(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), fileUploadHandler(),parseFileData(FOLDER_NAMES.BANNER), BannerController.createBanner)
     .get(auth(USER_ROLES.USER, USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), BannerController.getAllBanner);

router
     .route('/:id')
     .patch(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), fileUploadHandler(),parseFileData(FOLDER_NAMES.BANNER), BannerController.updateBanner)
     .delete(auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), BannerController.deleteBanner);

export const BannerRoutes = router;
