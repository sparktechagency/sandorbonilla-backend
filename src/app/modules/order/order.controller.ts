import { StatusCodes } from 'http-status-codes';
import sendResponse from '../../../shared/sendResponse';
import { OrderServices } from './order.service';
import stripe from '../../../config/stripe';
import catchAsync from '../../../shared/catchAsync';

// Create a new order
const createOrder = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const { cartItems } = req.body;
     const result = await OrderServices.createCheckoutSession(cartItems, id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Checkout session created successfully',
          data: result,
     });
});
// Create a new order
const getOrders = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const query = req.query;
     const result = await OrderServices.getCustomerOrders(id, query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Orders retrieved successfully',
          data: result,
     });
});
const getAdminOrders = catchAsync(async (req, res) => {
     const query = req.query;
     const result = await OrderServices.getCustomerOrdersForAdmin(query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Orders retrieved successfully',
          data: result,
     });
});
const getSingleOrder = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await OrderServices.getOrderById(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Order retrieved successfully',
          data: result,
     });
});
// update order status
const updateOrderStatus = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { status } = req.body;
     const result = await OrderServices.updateOrderItemStatus(id, status);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Order status updated successfully',
          data: result,
     });
});

// get my orders
const getMyOrders = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await OrderServices.userOrders(id, req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Order retrieved successfully',
          data: result,
     });
});
// get my order
const getMyOrder = catchAsync(async (req, res) => {
     const { id } = req.params;
     const result = await OrderServices.userSingleOrder(id);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Order retrieved successfully',
          data: result,
     });
});

const getSellerTransactionForAdmin = catchAsync(async (req, res) => {
     const query = req.query;
     const result = await OrderServices.getSellerTransactionForAdmin(query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Seller orders transaction retrieved successfully',
          data: result,
     });
});
const getSellerTransactionRefundForAdmin = catchAsync(async (req, res) => {
     const query = req.query;
     const result = await OrderServices.getSellerTransactionRefundForAdmin(query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Seller orders transaction refund retrieved successfully',
          data: result,
     });
});
// Assuming you have OrderServices imported properly
const orderSuccess = catchAsync(async (req, res) => {
     const sessionId = req.query.session_id as string;
     const session = await OrderServices.successMessage(sessionId);
     res.render('success', { session });
});
// Assuming you have OrderServices imported properly
const orderCancel = catchAsync(async (req, res) => {
     res.render('cancel');
});
// cancel order by user
const cancelOrderByUser = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { id: userId, role }: any = req.user;
     const result = await OrderServices.cancelOrder(id, userId, role);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result?.message,
          data: result,
     });
});
// cancel order by seller
const cancelOrderBySeller = catchAsync(async (req, res) => {
     const { id } = req.params;
     const { reason } = req.body;
     const result = await OrderServices.sellerCancelOrder(id, reason);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: result?.message,
          data: result,
     });
});
export const OrderController = {
     createOrder,
     getOrders,
     getSingleOrder,
     updateOrderStatus,
     getMyOrders,
     getMyOrder,
     orderSuccess,
     orderCancel,
     cancelOrderByUser,
     cancelOrderBySeller,
     getAdminOrders,
     getSellerTransactionForAdmin,
     getSellerTransactionRefundForAdmin
};
