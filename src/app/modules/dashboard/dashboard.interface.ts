export interface TopSellingProduct {
    productId: string;
    productName: string;
    totalQuantitySold: number;
    totalRevenue: number;
    totalProfit: number;
    orderCount: number;
    productDetails?: {
        brand: string;
        category: string;
        images: string[];
        rating: number;
    };
}
export interface CustomerMonthlyStats {
    month: string;
    returningCustomers: number;
    nonReturningCustomers: number;
    totalCustomers: number;
    returningRate: number;
}

export interface CustomerYearlyStats {
    year: number;
    totalUniqueCustomers: number;
    totalReturningCustomers: number;
    totalNonReturningCustomers: number;
    overallReturningRate: number;
    monthlyBreakdown: CustomerMonthlyStats[];
}

export interface SellerMonthlyProfit {
    month: string;
    totalProfit: number;
    totalRevenue: number;
    totalOrders: number;
    platformFee: number;
}

export interface SellerYearlyStats {
    sellerId: string;
    sellerName?: string;
    year: number;
    totalYearlyProfit: number;
    totalYearlyRevenue: number;
    totalYearlyOrders: number;
    totalPlatformFee: number;
    monthlyBreakdown: SellerMonthlyProfit[];
}


export interface RatingBreakdown {
    rating: number;
    count: number;
    percentage: number;
}

export interface MonthlyRatingsStats {
    month: string;
    year: number;
    totalRatings: number;
    averageRating: number;
    ratingBreakdown: RatingBreakdown[];
    topRatedProducts: Array<{
        productId: string;
        productName?: string;
        averageRating: number;
        totalRatings: number;
    }>;
    lowestRatedProducts: Array<{
        productId: string;
        productName?: string;
        averageRating: number;
        totalRatings: number;
    }>;
}

export interface TopSeller {
    sellerId: string;
    sellerName?: string;
    totalProfit: number;
    totalRevenue: number;
    totalOrders: number;
    platformFee: number;
    productsSold: number;
}

export interface TopSellersResponse {
    month: string;
    year: number;
    totalSellers: number;
    sellers: TopSeller[];
}