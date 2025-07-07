import { RouteRecordRaw } from 'vue-router';

// 获取认证数据
export const getAuthData = () => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role') || 'user'
});

// 设置页面标题
export const setDocumentTitle = (title: string) => {
  document.title = title ? `${title} - 道威管理系统` : '道威管理系统';
};

// 确保路由包含默认 meta 配置
export const ensureMeta = (routes: RouteRecordRaw[]) => routes.map(route => ({
  ...route,
  meta: { hiddenCommonComponents: false, ...route.meta }
}));

// 默认重定向路径
export const defaultRedirects = {
  admin: '/admin/home',
  user: '/user/home',
  unauthenticated: '/login',
  adminUnauthenticated: '/admin/login'
};