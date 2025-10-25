import { StatusCodes } from 'http-status-codes';
import stripe from '../../../config/stripe';
import AppError from '../../../errors/AppError';
import { Order } from './order.model';
import { User } from '../user/user.model';
import QueryBuilder from '../../builder/QueryBuilder';
import { OrderItem, CartItem, OrderMetadata } from './order.interface';
import { Types } from 'mongoose';
import generateOrderNumber from '../../../utils/generateOrderNumber';
import { ProductModel } from '../products/products.model';
import { PaymentModel } from '../payments/payments.model';

const createCheckoutSession = async (cartItems: CartItem[], userId: string) => {
     // Check if user exists
     const isUserExist = await User.findById(userId);
     if (!isUserExist) {
          throw new AppError(StatusCodes.NOT_FOUND, 'User not found');
     }

     // Platform fee percentage (adjust as needed)
     const PLATFORM_FEE_PERCENTAGE = 10; // 10% platform fee

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
     let globalOrderNumber = generateOrderNumber("ORD#");

     // Process each seller's items
     for (const [sellerId, sellerItems] of Object.entries(itemsBySeller)) {
          const sellerOrderItems: OrderItem[] = [];
          let sellerTotalPrice = 0;

          // Process each item for this seller
          for (const item of sellerItems) {
               const { product, sizeItem } = productDetails[item.productId.toString()];

               // Calculate price with discount
               const discountedPrice = sizeItem.price - (sizeItem.price * sizeItem.discount / 100);
               const itemTotal = discountedPrice * item.quantity;
               sellerTotalPrice += itemTotal;

               // Add to line items for Stripe
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

               // Add to seller's order items
               sellerOrderItems.push({
                    productId: product._id as Types.ObjectId,
                    sellerId: product.sellerId as Types.ObjectId,
                    productName: product.name,
                    size: item.size,
                    color: item.color,
                    quantity: item.quantity,
                    price: sizeItem.price,
                    discount: sizeItem.discount,
                    totalPrice: itemTotal,
               });
          }

          // Calculate platform fee and seller amount
          const platformFee = (sellerTotalPrice * PLATFORM_FEE_PERCENTAGE) / 100;
          const sellerAmount = sellerTotalPrice - platformFee;

          // Store seller order metadata
          const sellerOrderNumber = `${globalOrderNumber}-${sellerId.substring(0, 5)}`;
          ordersBySellerMetadata[sellerId] = {
               orderNumber: sellerOrderNumber,
               items: sellerOrderItems,
               totalPrice: sellerTotalPrice,
               platformFee: platformFee,
               sellerAmount: sellerAmount,
          };
     }

     // Create the checkout session
     const checkoutSession = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          success_url: `${process.env.FRONTEND_URL}/api/v1/orders/success?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${process.env.FRONTEND_URL}/api/v1/orders/cancel`,
          line_items: lineItems,
          shipping_address_collection: {
               allowed_countries: ['US', 'CA', 'GB', 'BD'],
          },
          phone_number_collection: {
               enabled: true,
          },
          metadata: {
               userId: userId,
               // No need to store orderData here - we can find orders using checkoutSessionId
          },
     });

     // Create separate orders and payment records for each seller
     for (const [sellerId, orderData] of Object.entries(ordersBySellerMetadata)) {
          const order = new Order({
               customerId: userId,
               orderNumber: orderData.orderNumber,
               products: orderData.items,
               totalPrice: orderData.totalPrice,
               platformFee: orderData.platformFee,
               sellerAmount: orderData.sellerAmount,
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

          // Create payment record for tracking
          await PaymentModel.create({
               orderId: order._id,
               customerId: userId,
               sellerId: sellerId,
               orderNumber: orderData.orderNumber,
               amount: orderData.totalPrice,
               platformFee: orderData.platformFee,
               sellerAmount: orderData.sellerAmount,
               currency: 'usd',
               paymentMethod: 'card',
               paymentStatus: 'pending',
               checkoutSessionId: checkoutSession.id,
               paymentIntentId: '',
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
     const order = await Order.findById(id).select('deliveryStatus');
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
     if (currentStatus === 'processing' && payload !== 'delivered') {
          throw new AppError(StatusCodes.BAD_REQUEST, 'Order can only be moved from proseccing to delivered');
     }
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
export const OrderServices = {
     createCheckoutSession,
     getCustomerOrders,
     getSellerOrders,
     getOrderById,
     updateOrderItemStatus,
     userOrders,
     userSingleOrder,
     successMessage,
};
