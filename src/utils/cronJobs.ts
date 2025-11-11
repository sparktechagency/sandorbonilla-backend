
import cron from 'node-cron';
import { printBanner } from './printBanner';
import config from '../config';
import { Order } from '../app/modules/order/order.model';
import { User } from '../app/modules/user/user.model';
import StripeService from '../app/builder/StripeService';


// Process single order transfer
const processOrderTransfer = async (orderId: string) => {
     try {
          const order = await Order.findById(orderId);

          if (!order) {
               console.error(`Order not found: ${orderId}`);
               return;
          }

          // Check if already transferred
          if (order.fundTransferred) {
               console.log(`Order ${orderId} already transferred`);
               return;
          }

          // Get seller details
          const user = await User.findById(order.sellerId);

          if (!user) {
               console.error(`Seller not found for order: ${orderId}`);
               return;
          }

          if (!user.stripeConnectAccount?.accountId) {
               console.error(`Seller ${order.sellerId} does not have a connected Stripe account`);
               return;
          }

          if (!user.stripeConnectAccount.payoutEnabled) {
               console.error(`Payouts not enabled for seller: ${order.sellerId}`);
               return;
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

          console.log(`✅ Transfer successful for order ${order.orderNumber}: ${transfer.id}`);

          return { success: true, orderId, transferId: transfer.id };
     } catch (error) {
          console.error(`❌ Failed to process transfer for order ${orderId}:`, error);
          return { success: false, orderId, error: (error as Error).message };
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

          console.log(`Found ${pendingOrders.length} orders pending for transfer`);

          if (pendingOrders.length === 0) {
               console.log('No pending transfers found');
               return;
          }

          // Process each order
          const results = await Promise.allSettled(
               pendingOrders.map(order => processOrderTransfer(order._id.toString()))
          );

          // Summary
          const successful = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
          const failed = results.length - successful;

          console.log(`✅ Transfer Summary: ${successful} successful, ${failed} failed`);

     } catch (error) {
          console.error('Error in fund transfer cron job:', error);
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
     console.log('✅ Fund transfer cron job scheduled (Daily at 2:00 AM Bangladesh Time)');
};


const setupTimeManagement = () => {
     console.log('🚀 Setting up trial management cron jobs...');
     // Start all cron jobs
     startFundTransferCron();
     printBanner(config.server.name as string);

};
export default setupTimeManagement;
