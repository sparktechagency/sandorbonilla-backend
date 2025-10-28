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