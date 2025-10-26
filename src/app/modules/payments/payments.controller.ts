import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { PaymentServices } from "./payments.service";

const getMyTransactions = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await PaymentServices.getMyTransactions(id, req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Transactions retrieved successfully',
          data: result,
     });
});
const getSellerTransactions = catchAsync(async (req, res) => {
     const { id }: any = req.user;
     const result = await PaymentServices.getSellerTransactions(id, req.query);
     sendResponse(res, {
          success: true,
          statusCode: StatusCodes.OK,
          message: 'Transactions retrieved successfully',
          data: result,
     });
});
export const PaymentController = {
     getMyTransactions,
     getSellerTransactions,
}
