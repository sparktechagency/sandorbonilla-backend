import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';
import { NotificationService } from './notification.service';

const getNotificationFromDB = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.getNotificationFromDB(id, req.query);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notifications Retrieved Successfully',
          data: result.data,
          meta: result.meta,
     });
});

const readNotification = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.readNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});

const readSingleNotification = catchAsync(async (req, res) => {
     const { id } = req.user as { id: string };
     const result = await NotificationService.readNotificationToDB(id);

     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Read Successfully',
          data: result,
     });
});

const sendAdminPushNotification = catchAsync(async (req, res) => {
     const result = await NotificationService.adminSendNotificationFromDB(req.body);
     sendResponse(res, {
          statusCode: StatusCodes.OK,
          success: true,
          message: 'Notification Send Successfully',
          data: result,
     });
});

export const NotificationController = {
     getNotificationFromDB,
     readNotification,
     readSingleNotification,
     sendAdminPushNotification,
};
