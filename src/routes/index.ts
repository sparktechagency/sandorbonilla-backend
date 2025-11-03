import express from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import SettingsRouter from '../app/modules/settings/settings.route';
import { ProductRoutes } from '../app/modules/products/products.routes';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { BookmarkRoutes } from '../app/modules/bookmark/bookmark.routes';
import { CategoryRoutes } from '../app/modules/category/category.route';
import { SubCategoryRoutes } from '../app/modules/subCategory/subCategory.route';
import { BrandRoutes } from '../app/modules/brand/brand.route';
import { FaqRoutes } from '../app/modules/faq/faq.route';
import { HelpRouter } from '../app/modules/help/help.route';
import { FeedbackRoutes } from '../app/modules/feedback/feedback.route';
import { BannerRoutes } from '../app/modules/banner/banner.routes';
import { OrderRoutes } from '../app/modules/order/order.route';
import { PaymentRouter } from '../app/modules/payments/payments.route';
import { UserManagementsRouter } from '../app/modules/userManagements/userManagements.router';
import { AdminRoutes } from '../app/modules/admin/admin.route';
import { DashboardRouter } from '../app/modules/dashboard/dashboard.route';
import { NotificationRoutes } from '../app/modules/notification/notification.routes';
import { PayoutRoutes } from '../app/modules/payout/payout.route';
import { StripeOnboardingRoutes } from '../app/modules/stripe/stripe.routes';
import { WalletRoutes } from '../app/modules/wallet/wallet.routes';
import { CartRouter } from '../app/modules/addToCart/addToCart.route';

const router = express.Router();
const routes = [
     {
          path: '/auth',
          route: AuthRouter,
     },
     {
          path: '/users',
          route: UserRouter,
     },
     {
          path: '/settings',
          route: SettingsRouter,
     },
     {
          path: '/products',
          route: ProductRoutes,
     },
     {
          path: '/bookmarks',
          route: BookmarkRoutes,
     },
     {
          path: '/categories',
          route: CategoryRoutes,
     },
     {
          path: '/sub-categories',
          route: SubCategoryRoutes,
     },
     {
          path: '/brands',
          route: BrandRoutes,
     },
     {
          path: '/faqs',
          route: FaqRoutes,
     },
     {
          path: '/help',
          route: HelpRouter,
     },
     {
          path: '/feedbacks',
          route: FeedbackRoutes,
     },
     {
          path: '/banners',
          route: BannerRoutes,
     },
     {
          path: '/orders',
          route: OrderRoutes,
     },
     {
          path: '/payments',
          route: PaymentRouter,
     },
     {
          path: '/user-managements',
          route: UserManagementsRouter,
     },
     {
          path: '/admins',
          route: AdminRoutes,
     },
     {
          path: '/dashboard',
          route: DashboardRouter,
     },
     {
          path: '/notifications',
          route: NotificationRoutes,
     },
     {
          path: '/stripe',
          route: StripeOnboardingRoutes,
     },
     {
          path: '/cart',
          route: CartRouter
     }
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
