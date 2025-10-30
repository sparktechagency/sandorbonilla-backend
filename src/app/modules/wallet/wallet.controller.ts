import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { WalletService } from './wallet.service';

// Get wallet balance for the authenticated seller
const getWalletBalance = catchAsync(async (req, res) => {
  const { id } = req.user as { id: string };
  const result = await WalletService.getWalletBalance(id);

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Wallet balance retrieved successfully',
    data: result,
  });
});

// Get transaction history for the authenticated seller
const getTransactionHistory = catchAsync(async (req, res) => {
const { id } = req.user as { id: string };
  const { page = 1, limit = 20 } = req.query;

  const result = await WalletService.getTransactionHistory(
    id,
    Number(limit),
    Number(page)
  );

  sendResponse(res, {
    success: true,
    statusCode: StatusCodes.OK,
    message: 'Transaction history retrieved successfully',
    data: result,
  });
});

export const WalletController = {
  getWalletBalance,
  getTransactionHistory,
};