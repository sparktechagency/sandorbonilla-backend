import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
import { Order } from './order.model';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { CartItem, OrderMetadata } from './order.interface';
import { Types } from 'mongoose';
import { generateOrderNumber } from '../../../utils/generateUniqueNumber';
import { ProductModel } from '../products/products.model';
import { PaymentModel } from '../payments/payments.model';
import config from '../../../config';
import { USER_ROLES } from '../../../enums/user';
import PlatformRevenue from '../platform/platform.model';
import { sendNotifications } from '../../../helpers/notificationsHelper';
import { WalletService } from '../wallet/wallet.service';



const createCheckoutSession = async (cartItems: CartItem[], userId: string) => {
     // Check if user exists
     const isUserExist = await User.findById(userId);
     if (!isUserExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // Platform fee percentage (can be fetched from admin settings)
     const PLATFORM_FEE_PERCENTAGE = 5; // 5% per order (cut from seller)

     // Group cart items by seller
     const itemsBySeller: Record<string, CartItem[]> = {};
     const productDetails: Record<string, any> = {};

     for (const item of cartItems) {
          const product: any = await ProductModel.findById(item.productId);
          if (!product) {
               throw new AppError(StatusCodes.NOT_FOUND, `Product with ID ${item.productId} not found`);
          }

          // Find the specific size from sizeType array
          const sizeItem = product.sizeType.find((s: any) => s.size === item.size);
          if (!sizeItem) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    `Size "${item.size}" not available for product "${product.name}"`
               );
          }

          // Check stock availability for this size
          if (sizeItem.quantity < item.quantity) {
               throw new AppError(
                    StatusCodes.BAD_REQUEST,
                    `Product "${product.name}" (Size: ${item.size}) has only ${sizeItem.quantity} items available, but ${item.quantity} requested`
               );
          }

          // Store product details with size info
          productDetails[item.productId.toString()] = { product, sizeItem };

          // Group by seller (using sellerId from product)
          const sellerId = product.sellerId.toString();
          if (!itemsBySeller[sellerId]) {
               itemsBySeller[sellerId] = [];
          }
          itemsBySeller[sellerId].push(item);
     }

     const lineItems = [];
     const ordersBySellerMetadata: Record<string, OrderMetadata> = {};

     // Process each seller's items
     for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
          const sellerOrderItems: any[] = [];
          let sellerTotalPrice = 0;
          let sellerTotalProfit = 0; // Track total profit for this seller

          // Get seller info for shipping cost
          const seller: any = await User.findById(sellerId);
          if (!seller) {
               throw new AppError(StatusCodes.NOT_FOUND, `Seller with ID ${sellerId} not found`);
          }

          const shippingCost = seller.shippingCost || 0;

          for (const item of sellerItems) {
               const { product, sizeItem } = productDetails[item.productId.toString()];
               const discountedPrice = sizeItem.price - sizeItem.discount;
               const itemTotal = discountedPrice * item.quantity;

               // Use profit from cartItem (from Postman) or fallback to product's profit
               const profitPerUnit = item.profit || sizeItem.profit || 0;
               const itemTotalProfit = profitPerUnit * item.quantity;

               sellerTotalPrice += itemTotal;
               sellerTotalProfit += itemTotalProfit;

               lineItems.push({
                    price_data: {
                         currency: 'usd',
                         product_data: {
                              name: `${product.name} (${item.size})`,
                              description: item.color ? `Color: ${item.color}` : undefined,
                         },
                         unit_amount: Math.round(discountedPrice * 100),
                    },
                    quantity: item.quantity,
               });

               sellerOrderItems.push({
                    productId: product._id as Types.ObjectId,
                    sellerId: product.sellerId as Types.ObjectId,
                    productName: product.name,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: sizeItem.price,
                    discount: sizeItem.discount,
                    profit: profitPerUnit, // Per unit profit
                    totalProfit: itemTotalProfit, // Total profit for this item
                    totalPrice: itemTotal,
               });
          }

          // Add shipping cost as separate line item (customer pays this)
          if (shippingCost > 0) {
               lineItems.push({
                    price_data: {
                         currency: 'usd',
                         product_data: {
                              name: 'Shipping Fee',
                              description: `Shipping cost for order from ${seller.shopName || 'seller'}`,
                         },
                         unit_amount: Math.round(shippingCost * 100),
                    },
                    quantity: 1,
               });
          }

          // Calculate platform fee (5% cut from seller's product total, NOT from customer)
          const platformFeeAmount = (sellerTotalPrice * PLATFORM_FEE_PERCENTAGE) / 100;
          const sellerAmount = sellerTotalPrice - platformFeeAmount + shippingCost;
          // Seller gets: Product amount (95%) + Full shipping cost

          // Generate unique order number for each seller
          const sellerOrderNumber = (await generateOrderNumber("ORD#")).toUpperCase();

          // Store seller order metadata with profit info
          ordersBySellerMetadata[sellerId] = {
               orderNumber: sellerOrderNumber,
               items: sellerOrderItems,
               totalPrice: sellerTotalPrice, // Product total only
               totalProfit: sellerTotalProfit, // Total profit for all items
               shippingCost: shippingCost, // Shipping cost
               platformFeePercentage: PLATFORM_FEE_PERCENTAGE,
               platformFee: platformFeeAmount, // Platform fee (cut from seller)
               sellerAmount: sellerAmount, // Seller gets: (total - platform fee) + shipping
               customerPays: sellerTotalPrice + shippingCost, // What customer actually pays
          };
     }

     // Create the checkout session
     const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: `${config.stripe.paymentSuccess_url}/orders/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${config.stripe.paymentCancel_url}/orders/cancel`,
          line_items: lineItems,
          shipping_address_collection: {
               allowed_countries: ['US', 'CA', 'GB', 'BD'],
          },
          metadata: {
               userId: userId,
               numberOfOrders: Object.keys(itemsBySeller).length.toString(),
               platformFeePercentage: PLATFORM_FEE_PERCENTAGE.toString(),
          },
     });

     // Create separate orders, payment records, and platform revenue records for each seller
     for (const [sellerId, orderData] of Object.entries(ordersBySellerMetadata)) {
          const order = new Order({
               customerId: userId,
               orderNumber: orderData.orderNumber,
               products: orderData.items, // Items now include profit info
               totalPrice: orderData.totalPrice, // Product total
               totalProfit: orderData.totalProfit, // Total profit for this order
               shippingCost: orderData.shippingCost, // Shipping cost
               platformFee: orderData.platformFee, // Platform fee (cut from seller)
               sellerAmount: orderData.sellerAmount, // Amount seller receives
               customerName: `${isUserExist.firstName} ${isUserExist.lastName}`,
               email: isUserExist.email,
               phoneNumber: isUserExist.phone || '',
               address: isUserExist.address || '',
               paymentStatus: 'pending',
               deliveryStatus: 'pending',
               checkoutSessionId: checkoutSession.id,
               paymentIntentId: '',
               sellerId: sellerId,
          });

          await order.save();



          // Create Payment record
          await PaymentModel.create({
               orderId: order._id,
               customerId: userId,
               sellerId: sellerId,
               orderNumber: orderData.orderNumber,
               amount: orderData.customerPays, // Total customer pays (products + shipping)
               platformFee: orderData.platformFee, // Platform fee
               sellerAmount: orderData.sellerAmount, // Amount seller receives
               totalProfit: orderData.totalProfit, // Total profit
               currency: 'usd',
               paymentMethod: 'card',
               paymentStatus: 'pending',
               checkoutSessionId: checkoutSession.id,
               paymentIntentId: '',
          });

          await sendNotifications({
               title: 'Order Created',
               message: `Your order ${orderData.orderNumber} has been created successfully. Total Profit: $${orderData.totalProfit.toFixed(2)}`,
               receiver: sellerId,
               reference: order._id,
               referenceModel: 'ORDER'
          });

          await sendNotifications({
               title: 'Order Processed',
               message: `Your order ${orderData.orderNumber} has been processed successfully.`,
               receiver: userId,
               reference: order._id,
               referenceModel: 'ORDER'
          });

          // Create Platform Revenue record (Admin's income tracking) with profit info
          await PlatformRevenue.create({
               orderId: order._id,
               orderNumber: orderData.orderNumber,
               customerId: userId,
               sellerId: sellerId,
               orderAmount: orderData.totalPrice, // Product amount only
               totalProfit: orderData.totalProfit, // Total profit
               platformFeePercentage: orderData.platformFeePercentage,
               platformFeeAmount: orderData.platformFee, // Platform's cut
               paymentStatus: 'pending',
               checkoutSessionId: checkoutSession.id,
               paymentIntentId: '',
               collectedAt: null, // Will be set when payment is successful
          });
     }

     // Return the URL for the checkout session
     return {
          url: checkoutSession.url,
     };
};

// Get orders by customer
const getCustomerOrders = async (sellerId: string, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ sellerId, paymentStatus: 'paid' }), query);
     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();

     const pagination = await queryBuilder.countTotal();
     return { orders, pagination };
};
const getCustomerOrdersForAdmin = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ paymentStatus: 'paid' }).populate("products.productId", "images"), query);
     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();

     const pagination = await queryBuilder.countTotal();
     return { orders, pagination };
};

const getSellerTransactionForAdmin = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ paymentStatus: 'paid', deliveryStatus: 'delivered', fundTransferred: true }).populate("products.productId", "images"), query);
     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();

     const pagination = await queryBuilder.countTotal();
     return { orders, pagination };
};
const getSellerTransactionRefundForAdmin = async (query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(Order.find({ paymentStatus: 'paid', deliveryStatus: 'returned', fundTransferred: true }).populate("products.productId", "images"), query);
     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();

     const pagination = await queryBuilder.countTotal();
     return { orders, pagination };
};

// Get orders by seller
const getSellerOrders = async (sellerId: string, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(
          Order.find({
               sellerId,
               paymentStatus: 'paid',
          }),
          query,
     );

     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.exec();

     // For each order, filter to only show items from this seller
     const filteredOrders = orders.map((order) => {
          const sellerItems = order.products.filter((item) => item.sellerId.toString() === sellerId);
          const sellerTotal = sellerItems.reduce((sum, item) => sum + item.totalPrice, 0);

          return {
               ...order.toObject(),
               items: sellerItems,
               sellerTotal,
          };
     });

     const pagination = await queryBuilder.countTotal();
     return { orders: filteredOrders, pagination };
};

// Get order by ID
const getOrderById = async (id: string) => {
     const order = await Order.findById(id);
     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }
     return order;
};

const updateOrderItemStatus = async (id: string, payload: any) => {
     const order = await Order.findById(id);
     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }
     const currentStatus = order?.deliveryStatus;

     if (currentStatus === 'cancelled') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order is canceled. No more status changes are allowed');
     }

     if (currentStatus === 'delivered') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Cannot update status. Order is already delivered');
     }

     if (currentStatus === 'pending' && payload !== 'processing') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order can only be moved from pending to processing');
     }
     if (currentStatus === 'processing' && payload !== 'shipped') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order can only be moved from processing to shipped');
     }
     if (currentStatus === 'shipped' && payload !== 'delivered') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order can only be moved from shipped to delivered');
     }

     // Send notification about status update
     await sendNotifications({
          title: 'Order Status Updated',
          message: `Your order ${order.orderNumber} has been updated to ${payload}.`,
          receiver: order.customerId,
          reference: order._id,
          referenceModel: 'ORDER'
     });
     // If order is being marked as delivered, update seller wallet
     if (payload === 'delivered') {
          // Update delivered timestamp (7 days after delivery)
          const now = new Date();
          const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
          order.fundTransferDate = sevenDaysLater;
     }
     // Update order status
     order.deliveryStatus = payload;
     await order.save();
     return order;
};

const userOrders = async (customerId: string, query: Record<string, unknown>) => {
     const queryBuilder = new QueryBuilder(
          Order.find({
               customerId,
               paymentStatus: 'paid',
          }),
          query,
     );

     const orders = await queryBuilder.filter().sort().paginate().fields().modelQuery.populate('products.productId', 'image quantity quality description productName').exec();

     const pagination = await queryBuilder.countTotal();
     return { orders, pagination };
};
const userSingleOrder = async (id: string) => {
     const order = Order.findById(id).populate('products.productId', 'image quality description productName');
     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }
     return order;
};

const successMessage = async (id: string) => {
     const session = await stripe.checkout.sessions.retrieve(id);
     return session;
};
const CANCELLATION_CHARGE_PERCENTAGE = 10;

const cancelOrder = async (id: string, userId: string, userRole: string) => {
     // Find the order
     const order = await Order.findById(id);
     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     // Check authorization - only customer who placed the order can cancel
     if (userRole === USER_ROLES.USER && order.customerId.toString() !== userId) {
          throw new AppError(StatusCodes.FORBIDDEN, 'You are not authorized to cancel this order');
     }

     if (order.paymentStatus === 'cancelled') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order is already cancelled');
     }
     if (order.deliveryStatus !== 'pending') {
          throw new AppError(
               StatusCodes.BAD_REQUEST,
               'Order cannot be cancelled. Delivery status is not pending'
          );
     }
     // Check if payment was completed
     if (order.paymentStatus !== 'paid') {
          // If payment not completed, just cancel the order
          order.paymentStatus = 'cancelled';
          order.deliveryStatus = 'cancelled';
          order.cancelledAt = new Date();
          order.cancelReason = 'Cancelled by customer before payment completion';
          await order.save();
          return {
               order,
               refund: null,
               message: 'Order cancelled successfully (No refund as payment was not completed)',
          };
     }
     const cancellationCharge = (order.totalPrice * CANCELLATION_CHARGE_PERCENTAGE) / 100;
     const refundAmount = order.totalPrice - cancellationCharge;

     // Process refund through Stripe
     const refund = await stripe.refunds.create({
          payment_intent: order.paymentIntentId,
          amount: Math.round(refundAmount * 100),
          reason: 'requested_by_customer',
          metadata: {
               orderId: order._id.toString(),
               orderNumber: order.orderNumber,
               cancellationCharge: cancellationCharge.toString(),
          },
     });

     // Update order
     order.paymentStatus = 'refunded';
     order.deliveryStatus = 'cancelled';
     order.cancelledAt = new Date();
     order.cancelReason = `Cancelled by customer. Refund: $${refundAmount.toFixed(2)}, Cancellation Charge: $${cancellationCharge.toFixed(2)}`;
     order.refundId = refund.id;
     order.refundAmount = refundAmount;
     await order.save();

     // Update payment record
     const payment = await PaymentModel.findOne({ orderId: order._id });
     if (payment) {
          payment.paymentStatus = 'refunded';
          payment.refundId = refund.id;
          payment.refundAmount = refundAmount;
          payment.refundReason = `Order cancelled by customer. ${CANCELLATION_CHARGE_PERCENTAGE}% cancellation charge applied.`;
          payment.refundedAt = new Date();
          payment.metadata = {
               ...payment.metadata,
               cancellationCharge,
               originalAmount: order.totalPrice,
          };
          await payment.save();
     }
     await sendNotifications({
          title: 'Order Status Updated',
          message: `Your order ${order.orderNumber} has been cancelled successfully. Refund of $${refundAmount.toFixed(2)} initiated (${CANCELLATION_CHARGE_PERCENTAGE}% cancellation charge applied).`,
          receiver: order.customerId,
          reference: order._id,
          referenceModel: 'ORDER'
     })
     await sendNotifications({
          title: 'Order Status Updated',
          message: `Your order ${order.orderNumber} has been cancelled successfully. Refund of $${refundAmount.toFixed(2)} initiated (${CANCELLATION_CHARGE_PERCENTAGE}% cancellation charge applied).`,
          receiver: order.sellerId,
          reference: order._id,
          referenceModel: 'ORDER'
     })
     // Restore stock for cancelled order
     for (const product of order.products) {
          try {
               const productDoc = await ProductModel.findById(product.productId);
               if (productDoc) {
                    await productDoc.increaseStock(product.size, product.quantity);
                    console.log(`Stock restored for product ${product.productId}, size ${product.size}, quantity ${product.quantity}`);
               }
          } catch (error: any) {
               console.error(`Error restoring stock for product ${product.productId}:`, error.message);
          }
     }

     return {
          order,
          refund: {
               refundId: refund.id,
               refundAmount,
               cancellationCharge,
               refundStatus: refund.status,
          },
          message: `Order cancelled successfully. Refund of $${refundAmount.toFixed(2)} initiated (${CANCELLATION_CHARGE_PERCENTAGE}% cancellation charge applied).`,
     };

};
const sellerCancelOrder = async (id: string, reason: string, shouldRefund: boolean = true) => {
     const order = await Order.findById(id);
     if (!order) {
          throw new AppError(StatusCodes.NOT_FOUND, 'Order not found');
     }

     if (order.paymentStatus === 'cancelled') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order is already cancelled');
     }

     // If order is delivered, cannot cancel
     if (order.deliveryStatus === 'delivered') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Delivered orders cannot be cancelled');
     }

     // If payment not completed or admin chooses not to refund
     if (order.paymentStatus !== 'paid' || !shouldRefund) {
          order.paymentStatus = 'cancelled';
          order.deliveryStatus = 'cancelled';
          order.cancelledAt = new Date();
          order.cancelReason = reason;
          await order.save();

          // Restore stock
          for (const product of order.products) {
               try {
                    const productDoc = await ProductModel.findById(product.productId);
                    if (productDoc) {
                         await productDoc.increaseStock(product.size, product.quantity);
                    }
               } catch (error: any) {
                    console.error(`Error restoring stock:`, error.message);
               }
          }

          return {
               order,
               refund: null,
               message: 'Order cancelled successfully by seller (No refund)',
          };
     }

     try {
          // Full refund for admin cancellation
          const refund = await stripe.refunds.create({
               payment_intent: order.paymentIntentId,
               amount: Math.round(order.totalPrice * 100),
               reason: 'requested_by_customer',
               metadata: {
                    orderId: order._id.toString(),
                    orderNumber: order.orderNumber,
                    cancelledBy: 'admin',
                    reason,
               },
          });

          order.paymentStatus = 'refunded';
          order.deliveryStatus = 'cancelled';
          order.cancelledAt = new Date();
          order.cancelReason = `Admin cancellation: ${reason}. Full refund: $${order.totalPrice.toFixed(2)}`;
          order.refundId = refund.id;
          order.refundAmount = order.totalPrice;
          await order.save();

          // Update payment record
          const payment = await PaymentModel.findOne({ orderId: order._id });
          if (payment) {
               payment.paymentStatus = 'refunded';
               payment.refundId = refund.id;
               payment.refundAmount = order.totalPrice;
               payment.refundReason = `Seller cancellation: ${reason}`;
               payment.refundedAt = new Date();
               await payment.save();
          }
          await sendNotifications({
               title: 'Order Status Updated',
               message: `Your order ${order.orderNumber} has been cancelled by seller. Refund of $${order.totalPrice.toFixed(2)}. with reason: ${reason}`,
               receiver: order.customerId,
               reference: order._id,
               referenceModel: 'ORDER'
          })
          // Restore stock
          for (const product of order.products) {
               try {
                    const productDoc = await ProductModel.findById(product.productId);
                    if (productDoc) {
                         await productDoc.increaseStock(product.size, product.quantity);
                    }
               } catch (error: any) {
                    console.error(`Error restoring stock:`, error.message);
               }
          }

          return {
               order,
               refund: {
                    refundId: refund.id,
                    refundAmount: order.totalPrice,
                    cancellationCharge: 0,
                    refundStatus: refund.status,
               },
               message: `Order cancelled successfully by seller. Full refund of $${order.totalPrice.toFixed(2)} initiated.`,
          };
     } catch (error: any) {
          console.error('Error processing refund:', error);
          throw new AppError(
               StatusCodes.INTERNAL_SERVER_ERROR,
               `Failed to process refund: ${error.message}`
          );
     }
};
export const OrderServices = {
     createCheckoutSession,
     getCustomerOrders,
     getSellerOrders,
     getOrderById,
     updateOrderItemStatus,
     userOrders,
     userSingleOrder,
     successMessage,
     cancelOrder,
     getCustomerOrdersForAdmin,
     sellerCancelOrder

};
