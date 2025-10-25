import { Order } from "../../../app/modules/order/order.model";
import { PaymentModel } from "../../../app/modules/payments/payments.model";

export const handleFailedPayment = async (paymentIntent: any) => {
     try {
          const paymentIntentId = paymentIntent.id;

          // Find orders with this payment intent
          const orders = await Order.find({ paymentIntentId });

          for (const order of orders) {
               order.paymentStatus = 'failed';
               await order.save();

               // Update payment record
               const payment = await PaymentModel.findOne({ orderId: order._id });
               if (payment) {
                    payment.paymentStatus = 'failed';
                    payment.failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';
                    payment.failureCode = paymentIntent.last_payment_error?.code || '';
                    await payment.save();
               }
          }

          console.log('Payment failed for intent:', paymentIntentId);
     } catch (error: any) {
          console.error('Error handling failed payment:', error.message);
     }
};