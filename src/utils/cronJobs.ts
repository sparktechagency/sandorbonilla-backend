
import cron from 'node-cron';
import { printBanner } from './printBanner';
import config from '../config';
import { Order } from '../app/modules/order/order.model';
import { User } from '../app/modules/user/user.model';
import StripeService from '../app/builder/StripeService';
import { sendNotifications } from '../helpers/notificationsHelper';
import { USER_ROLES } from '../enums/user';
import AppError from '../errors/AppError';
import { StatusCodes } from 'http-status-codes';


// Process single order transfer
const processOrderTransfer = async (orderId: string) => {
     try {
          const order = await Order.findById(orderId);
          const isAdmin = await User.findOne({ role: USER_ROLES.SUPER_ADMIN })
          if (!isAdmin) {
               throw new AppError(StatusCodes.NOT_FOUND, 'Super admin user not found');
          }
          if (!order) {
               throw new AppError(StatusCodes.NOT_FOUND, `Order not found: ${orderId}`);
          }

          // Check if already transferred
          if (order.fundTransferred) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Order ${orderId} already transferred`);
          }

          // Get seller details
          const user = await User.findById(order.sellerId);

          if (!user) {
               throw new AppError(StatusCodes.NOT_FOUND, `Seller not found for order: ${orderId}`);
          }

          if (!user.stripeConnectAccount?.accountId) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Seller ${order.sellerId} does not have a connected Stripe account`);
          }

          if (!user.stripeConnectAccount.payoutEnabled) {
               throw new AppError(StatusCodes.BAD_REQUEST, `Payouts not enabled for seller: ${order.sellerId}`);
          }

          // Process the transfer using Stripe
          const transfer = await StripeService.createTransfer(
               user?._id?.toString(),
               order.sellerAmount,
               `Payout for order: ${order.orderNumber}`
          );

          // Update order with transfer details
          order.fundTransferred = true;
          order.transferredIntentId = transfer.id;
          await order.save();

          await sendNotifications({
               title: 'Fund Release Successful',
               message: `${order.orderNumber} fund has been successfully transferred to ${user.stripeConnectAccount.bankAccountInfo?.accountHolderName} bank account.`,
               receiver: isAdmin._id,
               reference: order._id,
               referenceModel: 'ALERT'
          });
          return { success: true, orderId, transferId: transfer.id };
     } catch (error: any) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
     }
};

// Main function to process all pending transfers
const processPendingTransfers = async () => {
     try {
          console.log('🔄 Starting fund transfer cron job...');

          const currentDate = new Date();
          currentDate.setHours(0, 0, 0, 0); // Start of today
          const pendingOrders = await Order.find({
               fundTransferDate: {
                    $lte: currentDate,
                    $ne: null
               },
               fundTransferred: false,
               paymentStatus: 'paid',
               deliveryStatus: 'delivered'
          });

          if (pendingOrders.length === 0) {
               throw new AppError(StatusCodes.NOT_FOUND, 'No pending transfers found');
          }

          // Process each order
          const results = await Promise.allSettled(
               pendingOrders.map(order => processOrderTransfer(order._id.toString()))
          );

          // Summary
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          const failed = results.length - successful;

     } catch (error: any) {
          throw new AppError(StatusCodes.INTERNAL_SERVER_ERROR, error.message);
     }
};

// Schedule cron job
// Runs every day at 2:00 AM
const startFundTransferCron = () => {
     // '0 2 * * *' = Every day at 2:00 AM
     // '*/5 * * * *' = Every 5 minutes (for testing)
     cron.schedule('*/1 * * * *', async () => {
          console.log('⏰ Fund transfer cron triggered at:', new Date());
          await processPendingTransfers();
     }, {
          timezone: 'UTC'
     });
};


const setupTimeManagement = () => {
     console.log('🚀 Setting up trial management cron jobs...');
     // Start all cron jobs
     startFundTransferCron();
     printBanner(config.server.name as string);

};
export default setupTimeManagement;
