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


const dailyRevenueForMonth = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await DashboardService.getDailyRevenueForMonth(id, req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Daily revenue for month fetched successfully',
        data: result,
    })
})

const monthlyStatistic = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await DashboardService.getMonthlyStatistic(id, req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Monthly statistic fetched successfully',
        data: result,
    })
})

const adminAnalytics = catchAsync(async (req, res) => {
    const result = await DashboardService.getAdminAnalytics()

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Admin analytics fetched successfully',
        data: result,
    })
})
const orderStatistic = catchAsync(async (req, res) => {
    const result = await DashboardService.getMonthlyRevenueForAdmin(req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Order statistic fetched successfully',
        data: result,
    })
})
export const DashboardController = { productStatistic, orderStatistic, dailyRevenueForMonth, monthlyStatistic, adminAnalytics }
