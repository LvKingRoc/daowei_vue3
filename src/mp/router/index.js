import { createRouter, createWebHistory } from 'vue-router';

import userRoutes from '@/mp/router/main/userRoutes';
import adminRoutes from '@/mp/router/main/adminRoutes';

// 导入路由模块
import commonRoutes from '@/mp/router/main/login';
import homeRoutes from '@/mp/router/main/home';
import toolsRoutes from '@/mp/router/main/tools';
import supportRoutes from '@/mp/router/main/support';

// 导入工具函数
import { setDocumentTitle, ensureMeta, createRouterGuard } from '@/mp/router/utils';

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
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, savedPosition) => savedPosition || { top: 0 }
});

// ===================================
// 导航守卫（使用统一守卫）
// ===================================
router.beforeEach(createRouterGuard({ setDocumentTitle }));

export default router;
