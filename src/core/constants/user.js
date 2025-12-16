/**
 * 用户和权限相关常量
 */

// 用户角色枚举
export const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user'
};

// 用户角色标签映射
export const USER_ROLE_LABELS = {
  [USER_ROLES.ADMIN]: '管理员',
  [USER_ROLES.USER]: '普通用户'
};

// Token存储键名
export const TOKEN_KEY = 'token';
export const ROLE_KEY = 'role';

// 默认重定向路径
export const DEFAULT_REDIRECTS = {
  admin: '/admin/home',
  user: '/user/home',
  unauthenticated: '/login',
  adminUnauthenticated: '/admin/login'
};

/**
 * 获取用户角色标签
 * @param {string} role 用户角色
 * @returns {string} 角色标签
 */
export function getUserRoleLabel(role) {
  return USER_ROLE_LABELS[role] || '未知角色';
}

/**
 * 判断是否为管理员
 * @param {string} role 用户角色
 * @returns {boolean}
 */
export function isAdmin(role) {
  return role === USER_ROLES.ADMIN;
}

export default {
  USER_ROLES,
  USER_ROLE_LABELS,
  TOKEN_KEY,
  ROLE_KEY,
  DEFAULT_REDIRECTS,
  getUserRoleLabel,
  isAdmin
};
