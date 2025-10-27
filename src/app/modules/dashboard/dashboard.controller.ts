import { StatusCodes } from "http-status-codes"
import catchAsync from "../../../shared/catchAsync"
import sendResponse from "../../../shared/sendResponse"
import { DashboardService } from "./dashboard.service"

const productStatistic = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await DashboardService.productStatistic(id)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Product statistic fetched successfully',
        data: result,
    })
})
export const DashboardController = { productStatistic }
