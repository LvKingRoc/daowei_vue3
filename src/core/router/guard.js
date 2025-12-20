/**
 * 统一路由守卫工具
 * PC端和MP端共用
 */
import { clearAuthAndGetLoginPath } from '@/core/utils/authUtils';

// 获取认证数据
export const getAuthData = () => ({
  token: localStorage.getItem('token'),
  role: localStorage.getItem('role') || 'user'
});

/**
 * 解析 JWT Token 获取 payload
 * @param {string} token JWT token
 * @returns {object|null} 解析后的 payload 或 null
 */
export const parseJwtPayload = (token) => {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    return null;
  }
};

/**
 * 检查 Token 是否即将过期（提前5分钟判断）
 * @param {string} token JWT token
 * @returns {boolean} true 表示已过期或即将过期
 */
export const isTokenExpiringSoon = (token) => {
  const payload = parseJwtPayload(token);
  if (!payload || !payload.exp) return true;
  
  // 提前5分钟（300秒）判断过期
  const expirationTime = payload.exp * 1000;
  const bufferTime = 5 * 60 * 1000;
  return Date.now() >= (expirationTime - bufferTime);
};

// 重新导出以保持兼容性
export { clearAuthAndGetLoginPath };

// 默认重定向路径
export const defaultRedirects = {
  admin: '/admin/home',
  user: '/user/home',
  unauthenticated: '/login',
  adminUnauthenticated: '/admin/login'
};

/**
 * 创建路由守卫
 * @param {object} options 配置选项
 * @param {function} options.setDocumentTitle 设置页面标题的函数
 * @returns {function} 路由守卫函数
 */
export const createRouterGuard = (options = {}) => {
  const { setDocumentTitle } = options;

  return (to, from, next) => {
    const { token, role } = getAuthData();
    
    // 设置页面标题
    if (setDocumentTitle) {
      setDocumentTitle(to.meta.title);
    }

    // 检查是否有登录后的重定向路径
    const redirectAfterLogin = localStorage.getItem('redirectAfterLogin');
    if (redirectAfterLogin && from.path === '/') {
      localStorage.removeItem('redirectAfterLogin');
      return next(redirectAfterLogin);
    }

    // 根路径直接处理重定向
    if (to.path === '/') return next();

    // 处理需要认证的路由
    if (to.meta.requiresAuth) {
      // 未登录时重定向到登录页
      if (!token) {
        return next({ 
          path: role === 'admin' ? '/admin/login' : '/login', 
          query: { redirect: to.fullPath } 
        });
      }
      
      // Token 过期检查（提前5分钟判断）
      if (isTokenExpiringSoon(token)) {
        const loginPath = clearAuthAndGetLoginPath(role);
        return next({
          path: loginPath,
          query: { redirect: to.fullPath, reason: 'expired' }
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
  };
};

export default {
  getAuthData,
  parseJwtPayload,
  isTokenExpiringSoon,
  clearAuthAndGetLoginPath,
  defaultRedirects,
  createRouterGuard
};
