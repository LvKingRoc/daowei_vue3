// @ts-nocheck
import request from '@/core/utils/request';
// 认证相关 API 封装（纯 JavaScript 版本）
// 统一管理用户 / 管理员登录，返回后端统一的 ApiResponse 结构

export const authApi = {
  // 用户登录
  userLogin(payload) {
    return request.post('/user/login', payload);
  },

  // 管理员登录
  adminLogin(payload) {
    return request.post('/admin/login', payload);
  },

  // 校验 token 是否有效
  verifyToken() {
    return request.get('/auth/verify');
  }
};
