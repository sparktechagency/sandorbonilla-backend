import { Order } from "../../../app/modules/order/order.model";
import { PaymentModel } from "../../../app/modules/payments/payments.model";
import { ProductModel } from "../../../app/modules/products/products.model";
import { WalletService } from "../../../app/modules/wallet/wallet.service";
import stripe from "../../../config/stripe";

export const handleSuccessfulPayment = async (session: any) => {
    try {
        const checkoutSessionId = session.id;
        const paymentIntentId = session.payment_intent;

        // Find all orders with this checkout session
        const orders = await Order.find({ checkoutSessionId });
        // latest_charge expand করে নাও

        if (!orders || orders.length === 0) {
            console.error('No orders found for checkout session:', checkoutSessionId);
            return;
        }
        // Get payment details from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        const paymentMethod = paymentIntent.payment_method
            ? await stripe.paymentMethods.retrieve(paymentIntent.payment_method as string)
            : null;

        // Update orders, payments and decrease stock
        for (const order of orders) {
            // Update order payment status
            order.paymentStatus = 'paid';
            order.paymentIntentId = paymentIntentId;

            // Update shipping address if available
            if (session.shipping_details?.address) {
                const address = session.shipping_details.address;
                order.shippingAddress = {
                    line1: address.line1 || '',
                    line2: address.line2 || '',
                    city: address.city || '',
                    postalCode: address.postal_code || '',
                    country: address.country || '',
                };
            }
            // Add pending amount to seller's wallet when order is created
            await WalletService.addPendingAmount(
                order.sellerId,
                order.sellerAmount,
                order._id.toString(),
                `Order #${order.orderNumber} placed - amount added to pending balance`
            );
            // Update phone number if available
            if (session.customer_details?.phone) {
                order.phoneNumber = session.customer_details.phone;
            }

            await order.save();

            // Update payment record
            const payment = await PaymentModel.findOne({ orderId: order._id });
            if (payment) {
                payment.paymentStatus = 'completed';
                payment.paymentIntentId = paymentIntentId;
                payment.paidAt = new Date();
                // Store payment method details
                if (paymentMethod) {
                    payment.paymentDetails = {
                        brand: paymentMethod.card?.brand || '',
                        last4: paymentMethod.card?.last4 || '',
                        expMonth: paymentMethod.card?.exp_month,
                        expYear: paymentMethod.card?.exp_year,
                    };
                }

                await payment.save();
            }

            // Decrease stock for each product in the order
            for (const product of order.products) {
                try {
                    const productDoc = await ProductModel.findById(product.productId);
                    if (productDoc) {
                        await productDoc.decreaseStock(product.size, product.quantity);
                        console.log(`Stock decreased for product ${product.productId}, size ${product.size}, quantity ${product.quantity}`);
                    } else {
                        console.error(`Product not found: ${product.productId}`);
                    }
                } catch (error: any) {
                    console.error(`Error decreasing stock for product ${product.productId}:`, error.message);
                }
            }
        }

        console.log('Payment successful and stock updated for session:', checkoutSessionId);
    } catch (error: any) {
        console.error('Error handling successful payment:', error.message);
        throw error;
    }
};