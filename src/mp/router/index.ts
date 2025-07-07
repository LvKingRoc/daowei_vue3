import { createRouter, createWebHistory, RouteRecordRaw, NavigationGuardNext, RouteLocationNormalized } from 'vue-router';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';

// 导入路由模块
import commonRoutes from '@/mp/router/main/login';
import homeRoutes from '@/mp/router/main/home';
import userRoutes from '@/mp/router/main/userRoutes';
import adminRoutes from '@/mp/router/main/adminRoutes';
import toolsRoutes from '@/mp/router/main/tools';
import supportRoutes from '@/mp/router/main/support';

// 导入工具函数
import { setDocumentTitle, getAuthData, ensureMeta } from './utils';

// 配置 NProgress
NProgress.configure({ 
  showSpinner: false,
  easing: 'ease',
  speed: 400
});

// 类型定义
interface AuthData {
  token: string | null;
  role: string;
}

// ===================================
// 路由合并与配置
// ===================================
const routes: RouteRecordRaw[] = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/mp/components/all/emptyLayout.vue'),
    meta: {
      title: '页面未找到',
      requiresAuth: false
    }
  },
  ...commonRoutes,
  ...homeRoutes,
  ...userRoutes,
  ...adminRoutes,
  ...toolsRoutes,
  ...supportRoutes
];

// ===================================
// 路由实例创建
// ===================================
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  }
});

// ===================================
// 路由工具函数
// ===================================
const handleRedirect = (
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  authData: AuthData
): boolean => {
  const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
  if (redirectAfterLogin && from.path === '/') {
    localStorage.removeItem('redirectAfterLogin');
    next(redirectAfterLogin);
    return true;
  }
  
  if (to.path === '/') {
    next(authData.role === 'admin' ? '/admin/home' : '/user/home');
    return true;
  }
  
  return false;
};

const handleAuthRequired = (
  to: RouteLocationNormalized,
  next: NavigationGuardNext,
  authData: AuthData
): boolean => {
  if (!to.meta.requiresAuth) return false;

  if (!authData.token) {
    next({ 
      path: authData.role === 'admin' ? '/admin/login' : '/login',
      query: { redirect: to.fullPath }
    });
    return true;
  }

  if (to.meta.role && to.meta.role !== authData.role) {
    next({
      path: authData.role === 'admin' ? '/admin/home' : '/user/home'
    });
    return true;
  }

  return false;
};

// ===================================
// 导航守卫
// ===================================
router.beforeEach(async (to, from, next) => {
  // 开始加载进度条
  NProgress.start();

  // 获取认证数据
  const authData = getAuthData();

  // 设置页面标题
  setDocumentTitle(to.meta.title as string);

  // 处理重定向
  if (handleRedirect(to, from, next, authData)) {
    NProgress.done();
    return;
  }

  // 处理需要认证的路由
  if (handleAuthRequired(to, next, authData)) {
    NProgress.done();
    return;
  }

  // 继续导航
  next();
});

// 路由后置守卫
router.afterEach((to, from) => {
  // 结束加载进度条
  NProgress.done();
  
  // 记录路由历史（可用于后退功能）
  const routeHistory = JSON.parse(localStorage.getItem('routeHistory') || '[]');
  routeHistory.push({
    path: to.path,
    timestamp: Date.now()
  });
  
  // 只保留最近的10条记录
  if (routeHistory.length > 10) {
    routeHistory.shift();
  }
  
  localStorage.setItem('routeHistory', JSON.stringify(routeHistory));
});

// 路由错误处理
router.onError((error) => {
  // 处理路由错误
  NProgress.done();
});

export default router; 