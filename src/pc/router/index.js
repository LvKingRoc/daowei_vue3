import { createRouter, createWebHistory } from 'vue-router';

import userRoutes from '@/pc/router/main/userRoutes';
import adminRoutes from '@/pc/router/main/adminRoutes';

// 导入路由模块
import commonRoutes from '@/pc/router/main/login';
import homeRoutes from '@/pc/router/main/home';
import toolsRoutes from '@/pc/router/main/tools';
import supportRoutes from '@/pc/router/main/Support';

// 导入工具函数
import { setDocumentTitle, ensureMeta, createRouterGuard } from './utils';

// ===================================
// 路由合并
// ===================================
const routes = [
  ...commonRoutes,
  ...homeRoutes,
  ...(Array.isArray(userRoutes) ? ensureMeta(userRoutes) : []),
  ...(Array.isArray(adminRoutes) ? ensureMeta(adminRoutes) : []),
  ...toolsRoutes,
  ...supportRoutes
];

// ===================================
// 路由实例创建
// ===================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 })
});

// ===================================
// 导航守卫（使用统一守卫）
// ===================================
router.beforeEach(createRouterGuard({ setDocumentTitle }));

export default router;