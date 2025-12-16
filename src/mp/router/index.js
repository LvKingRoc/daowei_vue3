import { createRouter, createWebHistory } from 'vue-router';

import userRoutes from '@/mp/router/main/userRoutes';
import adminRoutes from '@/mp/router/main/adminRoutes';

// 导入路由模块
import commonRoutes from '@/mp/router/main/login';
import homeRoutes from '@/mp/router/main/home';
import toolsRoutes from '@/mp/router/main/tools';
import supportRoutes from '@/mp/router/main/support';

// 导入工具函数
import { setDocumentTitle, getAuthData, ensureMeta } from '@/mp/router/utils';

// ===================================
// 路由合并
// ===================================
// 按照指定顺序合并所有路由
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
  // 使用 History 模式，URL 中不会带 #
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, from, savedPosition) => {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  }
});

// ===================================
// 导航守卫
// ===================================
router.beforeEach((to, from, next) => {
  const { token, role } = getAuthData();
  setDocumentTitle(to.meta.title); // 设置页面标题

  // 检查是否有登录后的重定向路径
  const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
  if (redirectAfterLogin && from.path === '/') {
    // 清除重定向路径
    localStorage.removeItem('redirectAfterLogin');
    // 重定向到指定路径
    return next(redirectAfterLogin);
  }

  if (to.path === '/') return next(); // 根路径直接处理重定向

  // 处理需要认证的路由
  if (to.meta.requiresAuth) {
    // 未登录时重定向到登录页
    if (!token) {
      return next({ 
        path: role === 'admin' ? '/admin/login' : '/login', 
        query: { redirect: to.fullPath } 
      });
    }
    
    // 角色不匹配时重定向到对应角色的首页
    if (to.meta.role && to.meta.role !== role) {
      return next({ 
        path: role === 'admin' ? '/admin/home' : '/user/home'
      });
    }
  }

  next();
});

export default router;
