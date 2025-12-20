/**
 * 认证相关的工具函数
 * 统一管理认证数据的清除逻辑，避免分散在多处
 */

/**
 * 清除认证数据（只清除token相关，保留登录凭据）
 * 所有需要清除认证的地方都应该调用此函数
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('redirectAfterLogin');
  // 注意：不清除登录凭据（daowei_*_login），让用户下次登录时保留账号密码
};

/**
 * 获取登录页路径
 * @param {string} role - 用户角色 ('admin' | 'user')
 * @returns {string} 登录页路径
 */
export const getLoginPath = (role) => {
  return role === 'admin' ? '/admin/login' : '/login';
};

/**
 * 清除认证数据并返回登录页路径
 * @param {string} role - 用户角色
 * @returns {string} 登录页路径
 */
export const clearAuthAndGetLoginPath = (role) => {
  clearAuthData();
  return getLoginPath(role);
};
