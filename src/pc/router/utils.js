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

/**
 * 清除认证数据并返回登录页路径
 * @param {string} role 用户角色
 * @returns {string} 登录页路径
 */
export const clearAuthAndGetLoginPath = (role) => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  return role === 'admin' ? '/admin/login' : '/login';
};

// 设置页面标题
export const setDocumentTitle = (title) => {
  document.title = title ? `${title} - 道威管理系统` : '道威管理系统';
};

// 确保路由包含默认 meta 配置
export const ensureMeta = (routes) => routes.map(route => ({
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