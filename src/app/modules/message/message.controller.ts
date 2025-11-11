import { MessageService } from './message.service';
import { ChatService } from '../chat/chat.service';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { StatusCodes } from 'http-status-codes';

const sendMessage = catchAsync(async (req, res) => {
  const chatId: any = req.params.chatId;
  const { userId }: any = req.user;
  req.body.sender = userId;
  req.body.chatId = chatId;

  const message = await MessageService.sendMessageToDB(req.body);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Send Message Successfully',
    data: message,
  });
});

const getMessages = catchAsync(async (req, res) => {
  const { chatId } = req.params;
  const { id: userId }: any = req.user;

  // Mark messages as read when user opens the chat
  await ChatService.markChatAsRead(userId, chatId);

  const result = await MessageService.getMessagesFromDB(
    chatId,
    userId,
    req.query,
  );

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Messages retrieved successfully',
    data: {
      messages: result.messages,
      pinnedMessages: result.pinnedMessages,
    },
    meta: {
      limit: result.pagination.limit,
      page: result.pagination.page,
      total: result.pagination.total,
      totalPage: result.pagination.totalPage,
    },
  });
});

const addReaction = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const { reactionType } = req.body;
  const messages = await MessageService.addReactionToMessage(
    userId,
    messageId,
    reactionType,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Reaction Added Successfully',
    data: messages,
  });
});

const deleteMessage = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const messages = await MessageService.deleteMessage(userId, messageId);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Message Deleted Successfully',
    data: messages,
  });
});

// New controller: Pin/Unpin message
const pinUnpinMessage = catchAsync(async (req, res) => {
  const { userId }: any = req.user;
  const { messageId } = req.params;
  const { action } = req.body; // 'pin' or 'unpin'

  const result = await MessageService.pinUnpinMessage(
    userId,
    messageId,
    action,
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: `Message ${action}ned successfully`,
    data: result,
  });
});

export const MessageController = {
  sendMessage,
  getMessages,
  addReaction,
  deleteMessage,
  pinUnpinMessage,
};
