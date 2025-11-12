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
const monthlyOrderStatusForAdmin = catchAsync(async (req, res) => {
    const result = await DashboardService.getMonthlyOrderStatusForAdmin(req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Monthly order status for admin fetched successfully',
        data: result,
    })
})
const topSellingProductsByMonth = catchAsync(async (req, res) => {
    const result = await DashboardService.getTopSellingProductsByMonth(req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Top selling products by month fetched successfully',
        data: result,
    })
})
const customerYearlyStatistic = catchAsync(async (req, res) => {
    const result = await DashboardService.getCustomerYearlyStatistic(req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Customer yearly statistic fetched successfully',
        data: result,
    })
})
const sellerMonthlyOnboarding = catchAsync(async (req, res) => {
    const result = await DashboardService.getSellerMonthlyOnboarding(req.query)


    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Seller yearly statistic fetched successfully',
        data: result,
    })
})

const ratingsStatisticsByMonth = catchAsync(async (req, res) => {
    const result = await DashboardService.getRatingsStatisticsByMonth(req.query)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Ratings statistics by month fetched successfully',
        data: result,
    })
})
const topSellersByMonth = catchAsync(async (req, res) => {
    const result = await DashboardService.getTopSellersByMonth(req.query)


    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Top sellers by month fetched successfully',
        data: result,
    })
})
const transactionUpdate = catchAsync(async (req, res) => {
    const { id } = req.user as { id: string }
    const result = await DashboardService.getTransactionUpdate(id)

    sendResponse(res, {
        success: true,
        statusCode: StatusCodes.OK,
        message: 'Transaction update fetched successfully',
        data: result,
    })
})
export const DashboardController = { productStatistic, orderStatistic, dailyRevenueForMonth, monthlyStatistic, adminAnalytics, monthlyOrderStatusForAdmin, topSellingProductsByMonth, customerYearlyStatistic, sellerMonthlyOnboarding, ratingsStatisticsByMonth, topSellersByMonth, transactionUpdate }
