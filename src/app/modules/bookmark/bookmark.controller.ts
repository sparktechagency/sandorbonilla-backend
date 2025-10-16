import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { BookmarkService } from './bookmark.service';

const toggleBookmark = catchAsync(async (req, res) => {
     const { id }: any = req.user
     const { referenceId }: any = req.body;
     const payload = { userId: id, referenceId };
     const result = await BookmarkService.toggleBookmark(payload);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: 'Bookmark Toggled Successfully',
          data: result,
     });
});

const getBookmark = catchAsync(async (req, res) => {
     const user: any = req.user;
     const result = await BookmarkService.getBookmark(user.id);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: 'Bookmark Retrieved Successfully',
          data: result,
     });
});

// Additional function to delete a bookmark
const deleteBookmark = catchAsync(async (req, res) => {
     const { id }: any = req.user; 
     const { referenceId }: any = req.params;

     const result = await BookmarkService.deleteBookmark(id, referenceId);

     sendResponse(res, {
          statusCode: 200,
          success: true,
          message: result.message,
     });
});



export const BookmarkController = {
     toggleBookmark,
     getBookmark,
     deleteBookmark,
};
