import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';
import AppError from '../../../errors/AppError';
import { SellerWallet, ISellerWallet, IWalletTransaction } from './wallet.model';

// Get or create a wallet for a seller
const getOrCreateWallet = async (userId: string): Promise<ISellerWallet> => {
  let wallet = await SellerWallet.findOne({ userId });
  
  if (!wallet) {
    wallet = await SellerWallet.create({
      userId: new Types.ObjectId(userId),
      totalEarnings: 0,
      availableBalance: 0,
      pendingBalance: 0,
      transactions: []
    });
  }
  
  return wallet;
};

// Get wallet balance for a seller
const getWalletBalance = async (userId: string) => {
  const wallet = await getOrCreateWallet(userId);
  
  return {
    totalEarnings: wallet.totalEarnings,
    availableBalance: wallet.availableBalance,
    pendingBalance: wallet.pendingBalance
  };
};

// Add pending amount to wallet when order is placed
const addPendingAmount = async (
  userId: string,
  amount: number,
  orderId: string,
  description: string
): Promise<ISellerWallet> => {
  const wallet = await getOrCreateWallet(userId);
  
  // Add to pending balance
  wallet.pendingBalance += amount;
  
  // Add transaction record
  wallet.transactions.push({
    amount,
    type: 'credit',
    description,
    orderId: new Types.ObjectId(orderId),
    createdAt: new Date()
  } as IWalletTransaction);
  
  await wallet.save();
  return wallet;
};

// Release pending amount to available balance when order is delivered
const releasePendingAmount = async (
  userId: string,
  amount: number,
  orderId: string,
  description: string
): Promise<ISellerWallet> => {
  const wallet = await getOrCreateWallet(userId);
  
  // Check if there's enough pending balance
  if (wallet.pendingBalance < amount) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Insufficient pending balance. Available: ${wallet.pendingBalance}, Requested: ${amount}`
    );
  }
  
  // Move from pending to available
  wallet.pendingBalance -= amount;
  wallet.availableBalance += amount;
  wallet.totalEarnings += amount;
  
  // Add transaction record
  wallet.transactions.push({
    amount,
    type: 'credit',
    description,
    orderId: new Types.ObjectId(orderId),
    createdAt: new Date()
  } as IWalletTransaction);
  
  await wallet.save();
  return wallet;
};

// Deduct from available balance when payout is processed
const deductFromAvailableBalance = async (
  userId: string,
  amount: number,
  payoutRequestId: string,
  description: string
): Promise<ISellerWallet> => {
  const wallet = await getOrCreateWallet(userId);
  
  // Check if there's enough available balance
  if (wallet.availableBalance < amount) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Insufficient available balance. Available: ${wallet.availableBalance}, Requested: ${amount}`
    );
  }
  
  // Deduct from available balance
  wallet.availableBalance -= amount;
  
  // Add transaction record
  wallet.transactions.push({
    amount,
    type: 'debit',
    description,
    payoutRequestId: new Types.ObjectId(payoutRequestId),
    createdAt: new Date()
  } as IWalletTransaction);
  
  await wallet.save();
  return wallet;
};

// Get transaction history for a seller
const getTransactionHistory = async (userId: string, limit = 20, page = 1) => {
  const wallet = await getOrCreateWallet(userId);
  
  // Sort transactions by date (newest first)
  const transactions = wallet.transactions
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice((page - 1) * limit, page * limit);
  
  return {
    transactions,
    totalCount: wallet.transactions.length,
    page,
    limit
  };
};

export const WalletService = {
  getOrCreateWallet,
  getWalletBalance,
  addPendingAmount,
  releasePendingAmount,
  deductFromAvailableBalance,
  getTransactionHistory
};