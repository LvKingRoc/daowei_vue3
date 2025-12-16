// 从统一路由守卫导入
export { 
  getAuthData, 
  defaultRedirects,
  parseJwtPayload,
  isTokenExpiringSoon,
  clearAuthAndGetLoginPath,
  createRouterGuard
} from '@/core/router/guard';

// 设置页面标题（PC端版本）
export const setDocumentTitle = (title) => {
  document.title = title ? `${title} - 道威管理系统` : '道威管理系统';
};

// 确保路由包含默认 meta 配置
export const ensureMeta = (routes) => routes.map(route => ({
  ...route,
  meta: { hiddenCommonComponents: false, ...route.meta }
}));