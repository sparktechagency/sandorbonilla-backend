import express from 'express';
import { BookmarkController } from './bookmark.controller';
import { USER_ROLES } from '../../../enums/user';
import auth from '../../middleware/auth';

const router = express.Router();

// Route to toggle a bookmark (add/remove)
router.post('/:referenceId', auth(USER_ROLES.USER), BookmarkController.toggleBookmark);

router.get('/', auth(USER_ROLES.USER), BookmarkController.getBookmark);

// Route to delete a bookmark for the authenticated user
router.delete('/:referenceId', auth(USER_ROLES.USER), BookmarkController.deleteBookmark);

export const BookmarkRoutes = router;
