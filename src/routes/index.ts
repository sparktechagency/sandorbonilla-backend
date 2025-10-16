import express from 'express';
import { UserRouter } from '../app/modules/user/user.route';
import SettingsRouter from '../app/modules/settings/settings.route';
import { ProductRoutes } from '../app/modules/products/products.routes';
import { AuthRouter } from '../app/modules/auth/auth.route';
import { BookmarkRoutes } from '../app/modules/bookmark/bookmark.routes';
import { CategoryRoutes } from '../app/modules/category/category.route';

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
];

routes.forEach((element) => {
     if (element?.path && element?.route) {
          router.use(element?.path, element?.route);
     }
});

export default router;
